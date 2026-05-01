// ============================================================
// hooks/useKeywords.ts — Phase 3: Supabase Cloud Sync
// workspaceId drives all loads. Offline-first with queue + retry.
// ============================================================
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { expandKeywords, getSeedObjects } from '../engine/expansion.js';
import { scoreLongFormKeywords } from '../engine/longFormScoring.js';
import { exportKeywordsCSV, importKeywordsCSV, downloadBlob } from '../engine/csvUtils.js';
import { buildMetadata } from '../engine/dataMetadata.js';
import type { Keyword, KeywordApiSummary, KeywordMetadata, ToastFn, KeywordRow } from '../types';
import { rowToKeyword, keywordToRow } from '../types';
import { useSnapshots } from './useSnapshots.ts';

const LOCAL_FALLBACK_KEY = 'ytlf_offline_kws';
const MIGRATE_DONE_KEY   = 'ytlf_migrated_v3';

// ── Offline queue for writes when navigator is offline ────────
interface QueuedWrite {
  row: ReturnType<typeof keywordToRow>;
  workspaceId: string;
}
let offlineQueue: QueuedWrite[] = [];

// ── localStorage fallback helpers ─────────────────────────────
function saveLocal(kws: Keyword[]) {
  try { localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(kws)); } catch {}
}
function loadLocal(): Keyword[] {
  try { const d = localStorage.getItem(LOCAL_FALLBACK_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}

export interface SyncStatus { state: 'loading' | 'syncing' | 'synced' | 'offline'; lastSyncedAt: Date | null; }

export interface UseKeywordsReturn {
  keywords: Keyword[];
  loading: boolean;
  syncStatus: SyncStatus;
  hasMigrationPending: boolean;
  runMigration: () => Promise<void>;
  expand: (seedText: string) => void;
  score: () => void;
  clear: () => void;
  exportCsv: (filtered: Keyword[]) => void;
  importCsv: (text: string) => void;
  updateApiData: (keyword: string, apiData: KeywordApiSummary, metadata: KeywordMetadata) => void;
  snapshots: ReturnType<typeof useSnapshots>;
}

export function useKeywords(toast: ToastFn, workspaceId: string | null): UseKeywordsReturn {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading]   = useState(false);
  const snapshots = useSnapshots();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'synced', lastSyncedAt: null });
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasMigrationPending, setHasMigrationPending] = useState(false);

  // Stable refs
  const workspaceRef  = useRef<string | null>(null);
  const userIdRef     = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Online/offline listeners ───────────────────────────────
  useEffect(() => {
    function onOnline()  { setIsOnline(true);  flushOfflineQueue(); }
    function onOffline() { setIsOnline(false); setSyncStatus(s => ({ ...s, state: 'offline' })); }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load from Supabase when workspaceId changes ───────────
  useEffect(() => {
    if (!workspaceId) { setKeywords([]); return; }
    workspaceRef.current = workspaceId;
    loadFromCloud(workspaceId);
    checkMigrationPending();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check if localStorage has un-migrated data ─────────────
  function checkMigrationPending() {
    if (localStorage.getItem(MIGRATE_DONE_KEY)) { setHasMigrationPending(false); return; }
    const oldKeys = localStorage.getItem('ytlf_keywords');
    if (oldKeys) {
      try {
        const parsed = JSON.parse(oldKeys) as Keyword[];
        setHasMigrationPending(parsed.length > 0);
      } catch { setHasMigrationPending(false); }
    }
  }

  // ── Fetch from Supabase ────────────────────────────────────
  async function loadFromCloud(wsId: string) {
    setLoading(true);
    setSyncStatus({ state: 'loading', lastSyncedAt: null });

    // Get userId
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userIdRef.current = user.id;

    if (!isOnline) {
      // Offline: use local fallback
      const local = loadLocal();
      setKeywords(local);
      setLoading(false);
      setSyncStatus({ state: 'offline', lastSyncedAt: null });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('workspace_id', wsId)
        .order('long_form_score', { ascending: false });

      if (error) throw error;
      const kws = (data as KeywordRow[]).map(rowToKeyword);
      setKeywords(kws);
      saveLocal(kws);
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
    } catch {
      // Fallback to localStorage on error
      const local = loadLocal();
      setKeywords(local);
      setSyncStatus({ state: 'offline', lastSyncedAt: null });
      toast('Dùng dữ liệu offline — sẽ sync khi có mạng', 'info' as const);
    } finally {
      setLoading(false);
    }
  }

  // ── Upsert (respects offline queue) ───────────────────────
  async function upsertMany(kws: Keyword[]): Promise<void> {
    const wsId = workspaceRef.current;
    const uid  = userIdRef.current;
    if (!wsId || !uid || !kws.length) return;

    const rows = kws.map(k => keywordToRow(k, wsId, uid));

    if (!isOnline) {
      rows.forEach(row => offlineQueue.push({ row, workspaceId: wsId }));
      return;
    }
    setSyncStatus(s => ({ ...s, state: 'syncing' }));
    try {
      await supabase.from('keywords').upsert(rows, { onConflict: 'workspace_id,keyword' });
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
    } catch {
      rows.forEach(row => offlineQueue.push({ row, workspaceId: wsId }));
      setSyncStatus(s => ({ ...s, state: 'offline' }));
    }
  }

  async function upsertOne(kw: Keyword): Promise<void> {
    await upsertMany([kw]);
  }

  // ── Flush offline queue when back online ──────────────────
  async function flushOfflineQueue() {
    if (!offlineQueue.length) return;
    setSyncStatus(s => ({ ...s, state: 'syncing' }));
    const toFlush = [...offlineQueue];
    offlineQueue = [];
    try {
      // Group by workspaceId
      const grouped = toFlush.reduce((acc, item) => {
        if (!acc[item.workspaceId]) acc[item.workspaceId] = [];
        acc[item.workspaceId].push(item.row);
        return acc;
      }, {} as Record<string, QueuedWrite['row'][]>);

      for (const [wsId, rows] of Object.entries(grouped)) {
        await supabase.from('keywords').upsert(rows, { onConflict: 'workspace_id,keyword' });
      }
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
    } catch {
      offlineQueue = [...toFlush, ...offlineQueue]; // put back
      setSyncStatus(s => ({ ...s, state: 'offline' }));
    }
  }

  // ── One-time migration from localStorage ──────────────────
  const runMigration = useCallback(async () => {
    const wsId = workspaceRef.current;
    const uid  = userIdRef.current;
    if (!wsId || !uid) { toast('Chưa chọn workspace', 'error'); return; }
    const oldData = localStorage.getItem('ytlf_keywords');
    if (!oldData) { toast('Không có data cũ để migrate', 'info' as const); return; }

    const old = JSON.parse(oldData) as Keyword[];
    if (!old.length) { localStorage.setItem(MIGRATE_DONE_KEY, '1'); setHasMigrationPending(false); return; }

    setSyncStatus(s => ({ ...s, state: 'syncing' }));
    toast(`Đang đồng bộ ${old.length} keyword lên cloud...`, 'info' as const);
    try {
      const rows = old.map(k => keywordToRow(k, wsId, uid));
      await supabase.from('keywords').upsert(rows, { onConflict: 'workspace_id,keyword' });
      localStorage.setItem(MIGRATE_DONE_KEY, '1');
      localStorage.removeItem('ytlf_keywords');
      setHasMigrationPending(false);
      toast(`✅ Đã đồng bộ ${old.length} keyword!`, 'success');
      // Reload from cloud
      await loadFromCloud(wsId);
    } catch (e) {
      toast('Migration thất bại: ' + (e as Error).message, 'error');
      setSyncStatus(s => ({ ...s, state: 'offline' }));
    }
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── expand ────────────────────────────────────────────────
  const expand = useCallback((seedText: string) => {
    const lines = seedText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast('Vui lòng nhập ít nhất 1 seed keyword', 'error'); return; }
    const scored = scoreLongFormKeywords(expandKeywords(getSeedObjects(lines))).map(kw => ({
      ...kw, metadata: buildMetadata({ hasApiData: false }),
      workspaceId: workspaceRef.current ?? undefined,
    }));
    // Optimistic update
    setKeywords(prev => {
      const existing = new Set(prev.map(k => k.keyword));
      const merged = [...prev, ...scored.filter(k => !existing.has(k.keyword))];
      saveLocal(merged);
      return merged;
    });
    toast(`Đã tạo ${scored.length} keyword`, 'success');
    upsertMany(scored).catch(() => {});
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── score ─────────────────────────────────────────────────
  const score = useCallback(() => {
    if (!keywords.length) { toast('Chưa có keyword nào', 'error'); return; }
    const rescored = scoreLongFormKeywords([...keywords]);
    setKeywords(rescored);
    saveLocal(rescored);
    toast('Đã chấm điểm xong!', 'success');
    upsertMany(rescored).catch(() => {});
  }, [keywords, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── clear ─────────────────────────────────────────────────
  const clear = useCallback(() => {
    const wsId = workspaceRef.current;
    if (!confirm('Xoá tất cả keyword?')) return;
    setKeywords([]);
    saveLocal([]);
    toast('Đã xoá tất cả', 'success');
    if (wsId && isOnline) {
      supabase.from('keywords').delete().eq('workspace_id', wsId).then(() => {});
    }
  }, [isOnline, toast]);

  // ── exportCsv ─────────────────────────────────────────────
  const exportCsv = useCallback((filtered: Keyword[]) => {
    if (!filtered.length) { toast('Chưa có dữ liệu để xuất', 'error'); return; }
    downloadBlob(exportKeywordsCSV(filtered), 'youtube_longform_keywords.csv');
    toast('Đã xuất CSV!', 'success');
  }, [toast]);

  // ── importCsv ─────────────────────────────────────────────
  const importCsv = useCallback((text: string) => {
    const imported = importKeywordsCSV(text) as Keyword[];
    if (!imported.length) { toast('File CSV không hợp lệ', 'error'); return; }
    setKeywords(prev => {
      const existing = new Set(prev.map(k => k.keyword));
      const newKws = imported.filter(k => !existing.has(k.keyword));
      const merged = [...prev, ...newKws];
      saveLocal(merged);
      upsertMany(newKws).catch(() => {});
      return merged;
    });
    toast(`Đã nhập ${imported.length} keyword từ CSV`, 'success');
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── updateApiData ─────────────────────────────────────────
  const updateApiData = useCallback((
    keyword: string, apiData: KeywordApiSummary, metadata: KeywordMetadata,
  ) => {
    setKeywords(prev => prev.map(k => {
      if (k.keyword !== keyword) return k;
      const updated: Keyword = { ...k, apiData, metadata };
      const [rescored] = scoreLongFormKeywords([updated]);
      upsertOne(rescored).then(async () => {
        // Phase 6: create snapshot after upsert
        const ctx = workspaceRef.current;
        const uid = userIdRef.current;
        if (ctx && uid) {
          // Get keyword_id from DB (need to fetch it)
          const { data } = await supabase
            .from('keywords')
            .select('id')
            .eq('workspace_id', ctx)
            .eq('keyword', keyword)
            .single();
          if (data?.id) {
            snapshots.createSnapshot({
              keyword_id: data.id as string,
              workspace_id: ctx,
              user_id: uid,
              long_form_score: rescored.longFormScore,
              avg_views: apiData.avgLongVideoViews ?? 0,
              long_videos_found: apiData.longVideosFound ?? 0,
              best_ratio: apiData.bestViewSubRatio ?? 0,
              api_data: apiData as unknown as Record<string, unknown>,
            });
          }
        }
      }).catch(() => {});
      return rescored;
    }));
  }, [snapshots]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    keywords, loading, syncStatus, hasMigrationPending, runMigration,
    expand, score, clear, exportCsv, importCsv, updateApiData,
    snapshots,
  };
}
