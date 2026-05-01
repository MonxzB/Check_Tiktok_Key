// ============================================================
// hooks/useBulkAnalyze.ts — Phase 4: Sequential bulk YouTube analysis
// Rate-limited, pause/resume, retry, quota tracking, sessionStorage resume
// ============================================================
import { useState, useCallback, useRef } from 'react';
import { buildMetadata } from '../engine/dataMetadata.js';
import { recordAnalyzeCall } from '../engine/quotaTracker.js';
import type { KeywordApiSummary, KeywordMetadata, ToastFn, AnalyzeResult } from '../types';
import type { UseSettingsReturn } from './useSettings.ts';

const SESSION_KEY = 'ytlf_bulk_job';
const RATE_DELAY_MS = 2200;   // 2.2s between requests
const UNITS_PER_CALL = 125;   // conservative estimate
const QUOTA_LIMIT = 9500;     // stop before hard limit
const MAX_CONSECUTIVE_FAILS = 3;
const MAX_RETRIES = 1;

export type BulkItemStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface BulkItem {
  keyword: string;
  status: BulkItemStatus;
  score?: number;
  error?: string;
  retries: number;
}

export interface BulkAnalyzeState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  total: number;
  completed: number;
  failed: number;
  current: string | null;
  usedQuota: number;
  items: BulkItem[];
  startedAt: number | null;
}

const IDLE_STATE: BulkAnalyzeState = {
  status: 'idle', total: 0, completed: 0, failed: 0,
  current: null, usedQuota: 0, items: [], startedAt: null,
};

type UpdateApiDataFn = (keyword: string, apiData: KeywordApiSummary, metadata: KeywordMetadata) => void;

export interface UseBulkAnalyzeReturn {
  state: BulkAnalyzeState;
  hasResumable: boolean;
  start: (keywords: string[]) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  resumeFromStorage: () => void;
  estimatedUnits: (count: number) => number;
  estimatedSeconds: (count: number) => number;
}

export function useBulkAnalyze(
  updateApiData: UpdateApiDataFn,
  settings: UseSettingsReturn['settings'],
  toast: ToastFn,
): UseBulkAnalyzeReturn {
  const [state, setState] = useState<BulkAnalyzeState>(IDLE_STATE);
  const [hasResumable, setHasResumable] = useState(() => !!sessionStorage.getItem(SESSION_KEY));

  // Refs for mutable state accessible in async loops
  const pausedRef    = useRef(false);
  const cancelledRef = useRef(false);
  const stateRef     = useRef<BulkAnalyzeState>(IDLE_STATE);

  function updateState(patch: Partial<BulkAnalyzeState>) {
    setState(prev => {
      const next = { ...prev, ...patch };
      stateRef.current = next;
      return next;
    });
  }

  function saveToSession(s: BulkAnalyzeState) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    setHasResumable(false);
  }

  // ── Call single keyword via API ───────────────────────────────
  async function callAnalyze(keyword: string): Promise<{ apiData: KeywordApiSummary; metadata: KeywordMetadata } | null> {
    const userKeys = (settings?.apiKeys ?? []).filter((k: string) => k.trim());
    const res = await fetch('/api/youtube/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword,
        apiKeys: userKeys,
        minDurationMin: settings?.minDurationMin ?? 8,
        timeWindowDays: settings?.timeWindowDays ?? 180,
        maxResults:     settings?.maxResults ?? 25,
        orderBy:        settings?.orderBy ?? 'relevance',
        regionCode:     settings?.regionCode ?? 'JP',
        languageCode:   settings?.languageCode ?? 'ja',
      }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as AnalyzeResult;
    const { videos, channels, summary, usedKeyIdx } = data;
    if (usedKeyIdx != null && userKeys[usedKeyIdx]) {
      recordAnalyzeCall(userKeys[usedKeyIdx], videos?.length ?? 25, channels?.length ?? 10);
    }
    const metadata = buildMetadata({
      hasApiData: true,
      longVideoCount: summary?.longVideosFound ?? 0,
      hasChannelStats: (channels?.length ?? 0) > 0,
      hasRecentVideos: videos?.some(v => {
        const days = (Date.now() - new Date(v.publishedAt).getTime()) / 86400000;
        return days <= 90;
      }),
      timeWindowDays: settings?.timeWindowDays ?? 180,
      regionCode: settings?.regionCode ?? 'JP',
      languageCode: settings?.languageCode ?? 'ja',
    });
    return { apiData: summary, metadata };
  }

  // ── Delay helper ─────────────────────────────────────────────
  function delay(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  // ── Main queue processor ──────────────────────────────────────
  async function runQueue(items: BulkItem[], usedQuota: number) {
    let consecutiveFails = 0;
    let quota = usedQuota;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Skip already done
      if (item.status === 'success' || item.status === 'skipped') continue;

      // Check cancelled
      if (cancelledRef.current) break;

      // Wait if paused
      while (pausedRef.current && !cancelledRef.current) {
        await delay(300);
      }
      if (cancelledRef.current) break;

      // Quota check
      if (quota + UNITS_PER_CALL > QUOTA_LIMIT) {
        toast('⚠️ Quota gần hết! Bulk analyze tự dừng.', 'error');
        pausedRef.current = true;
        updateState({ status: 'paused' });
        break;
      }

      // Mark running
      items[i] = { ...item, status: 'running' };
      const current = item.keyword;
      updateState({ current, items: [...items] });
      saveToSession(stateRef.current);

      // Try with retry
      let success = false;
      let lastError = '';
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await callAnalyze(current);
          if (result) {
            updateApiData(current, result.apiData, result.metadata);
            items[i] = { ...items[i], status: 'success', score: undefined, retries: attempt };
            quota += UNITS_PER_CALL;
            updateState({
              completed: stateRef.current.completed + 1,
              usedQuota: quota,
              items: [...items],
            });
            success = true;
            consecutiveFails = 0;
          }
          break;
        } catch (err) {
          lastError = (err as Error).message;
          if (attempt < MAX_RETRIES) await delay(1500);
        }
      }

      if (!success) {
        items[i] = { ...items[i], status: 'failed', error: lastError };
        consecutiveFails++;
        updateState({
          failed: stateRef.current.failed + 1,
          items: [...items],
        });

        // 3 consecutive fails → auto pause
        if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
          toast(`⚠️ ${MAX_CONSECUTIVE_FAILS} keyword liên tiếp thất bại. Tạm dừng.`, 'error');
          pausedRef.current = true;
          updateState({ status: 'paused' });
          break;
        }
      }

      // Rate limit delay between requests
      if (i < items.length - 1 && !cancelledRef.current && !pausedRef.current) {
        await delay(RATE_DELAY_MS);
      }
    }

    if (cancelledRef.current) {
      updateState({ status: 'cancelled', current: null });
      clearSession();
    } else if (!pausedRef.current) {
      updateState({ status: 'completed', current: null });
      clearSession();
      const s = stateRef.current;
      toast(`✅ Bulk xong! ${s.completed} thành công, ${s.failed} thất bại.`, 'success');
    } else {
      updateState({ status: 'paused', current: null });
    }
    saveToSession(stateRef.current);
  }

  // ── start ─────────────────────────────────────────────────────
  const start = useCallback((keywords: string[]) => {
    if (!keywords.length) return;
    pausedRef.current = false;
    cancelledRef.current = false;
    const items: BulkItem[] = keywords.map(kw => ({ keyword: kw, status: 'pending', retries: 0 }));
    const initial: BulkAnalyzeState = {
      status: 'running', total: keywords.length, completed: 0, failed: 0,
      current: null, usedQuota: 0, items, startedAt: Date.now(),
    };
    stateRef.current = initial;
    setState(initial);
    saveToSession(initial);
    runQueue(items, 0);
  }, [settings, updateApiData, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── pause ─────────────────────────────────────────────────────
  const pause = useCallback(() => {
    pausedRef.current = true;
    updateState({ status: 'paused' });
  }, []);

  // ── resume ────────────────────────────────────────────────────
  const resume = useCallback(() => {
    pausedRef.current = false;
    updateState({ status: 'running' });
    const s = stateRef.current;
    runQueue([...s.items], s.usedQuota);
  }, [settings, updateApiData, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── cancel ────────────────────────────────────────────────────
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    pausedRef.current = false;
  }, []);

  // ── resumeFromStorage ────────────────────────────────────────
  const resumeFromStorage = useCallback(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as BulkAnalyzeState;
    // Reset running items back to pending
    const items = saved.items.map(item =>
      item.status === 'running' ? { ...item, status: 'pending' as const } : item
    );
    pausedRef.current = false;
    cancelledRef.current = false;
    const restored = { ...saved, status: 'running' as const, items };
    stateRef.current = restored;
    setState(restored);
    runQueue(items, saved.usedQuota);
  }, [settings, updateApiData, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const estimatedUnits   = (count: number) => count * UNITS_PER_CALL;
  const estimatedSeconds = (count: number) => Math.ceil(count * (RATE_DELAY_MS / 1000));

  return { state, hasResumable, start, pause, resume, cancel, resumeFromStorage, estimatedUnits, estimatedSeconds };
}
