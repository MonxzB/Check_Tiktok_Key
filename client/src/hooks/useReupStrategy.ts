// ============================================================
// hooks/useReupStrategy.ts — Phase 19
// State management for Reup Strategy Advisor tab
// Pattern mirrors useYoutube.ts / useTrackedChannels.ts
// ============================================================
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { runRuleEngine } from '../lib/reupAdvisor/ruleEngine.ts';
import { saveReupFeedback } from '../lib/reupAdvisor/scoringIntegration.ts';
import { extractVideoId } from '../lib/reupAdvisor/strategyTypes.ts';
import type {
  VideoMeta, ReupStrategyResult, ReupStrategyRow, Strategy,
} from '../lib/reupAdvisor/strategyTypes.ts';
import type { ToastFn } from '../types';

export interface UseReupStrategyReturn {
  // State
  videoMeta: VideoMeta | null;
  result: ReupStrategyResult | null;
  savedStrategies: ReupStrategyRow[];
  loading: boolean;
  deepLoading: boolean;
  error: string | null;
  currentUrl: string;
  compareIds: string[];         // strategy IDs selected for comparison

  // Actions
  setCurrentUrl: (url: string) => void;
  analyzeUrl: (url: string) => Promise<void>;        // Quick: rule engine
  deepAnalyze: () => Promise<void>;                  // Deep: Gemini
  saveStrategy: (strategyId: string) => Promise<void>;
  rateStrategy: (rowId: string, rating: number, notes?: string) => Promise<void>;
  loadSaved: () => Promise<void>;
  clearResult: () => void;
  toggleCompare: (strategyId: string) => void;
}

export function useReupStrategy(
  userId: string | null,
  workspaceId: string | null,
  toast: ToastFn,
): UseReupStrategyReturn {
  const [videoMeta, setVideoMeta]       = useState<VideoMeta | null>(null);
  const [result, setResult]             = useState<ReupStrategyResult | null>(null);
  const [savedStrategies, setSaved]     = useState<ReupStrategyRow[]>([]);
  const [loading, setLoading]           = useState(false);
  const [deepLoading, setDeepLoading]   = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [currentUrl, setCurrentUrl]     = useState('');
  const [compareIds, setCompareIds]     = useState<string[]>([]);

  // ── Quick Analyze (rule engine, no LLM) ───────────────────
  const analyzeUrl = useCallback(async (url: string) => {
    setError(null);
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      setError('Link YouTube không hợp lệ. Vui lòng paste URL từ youtube.com hoặc youtu.be');
      return;
    }

    setLoading(true);
    setResult(null);
    setVideoMeta(null);
    setCompareIds([]);

    try {
      // Fetch metadata from server (uses YT_API_KEY, 2 API units)
      const res = await fetch('/api/reup-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || `Lỗi server: ${res.status}`);
      }

      const data = await res.json() as { videoMeta: VideoMeta };
      const meta = data.videoMeta;
      setVideoMeta(meta);

      // Run rule engine client-side (instant, no API cost)
      const analysisResult = runRuleEngine(meta);
      setResult(analysisResult);
      toast(`✅ Đã phân tích — ${analysisResult.strategies.length} chiến lược được đề xuất`, 'success');
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ── Deep Analyze (server-side Gemini call) ─────────────────
  const deepAnalyze = useCallback(async () => {
    if (!videoMeta) { toast('Cần Quick Analyze trước', 'error'); return; }
    setDeepLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reup-advisor/deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoMeta }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || `Lỗi Gemini: ${res.status}`);
      }

      const deepResult = await res.json() as Partial<ReupStrategyResult>;
      setResult(prev => prev
        ? { ...prev, ...deepResult, videoMeta }
        : { videoMeta, primaryRecommendation: 'shorts', confidence: 70, copyrightRisk: 5, generatedAt: new Date().toISOString(), generatedBy: 'llm', strategies: [], ...deepResult }
      );
      toast('🤖 Deep Analyze hoàn thành!', 'success');
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast(msg, 'error');
    } finally {
      setDeepLoading(false);
    }
  }, [videoMeta, toast]);

  // ── Save strategy to Supabase ──────────────────────────────
  const saveStrategy = useCallback(async (strategyId: string) => {
    if (!userId || !workspaceId || !videoMeta || !result) {
      toast('Cần đăng nhập và chọn workspace để lưu', 'error');
      return;
    }

    const { error: dbErr } = await supabase
      .from('reup_strategies')
      .upsert({
        workspace_id: workspaceId,
        user_id: userId,
        video_url: currentUrl,
        video_id: videoMeta.videoId,
        video_meta: videoMeta,
        strategies: result.strategies,
        generated_by: result.generatedBy,
        confidence: result.confidence,
        selected_strategy_id: strategyId,
      }, { onConflict: 'workspace_id,video_id' });

    if (dbErr) {
      toast(`Lưu thất bại: ${dbErr.message}`, 'error');
    } else {
      toast('💾 Đã lưu chiến lược!', 'success');
      await loadSaved();
    }
  }, [userId, workspaceId, videoMeta, result, currentUrl, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rate a saved strategy ──────────────────────────────────
  const rateStrategy = useCallback(async (rowId: string, rating: number, notes?: string) => {
    const { error: dbErr } = await supabase
      .from('reup_strategies')
      .update({ feedback_rating: rating, feedback_notes: notes ?? null })
      .eq('id', rowId);

    if (dbErr) {
      toast('Lưu đánh giá thất bại', 'error');
      return;
    }

    // Feed into local ML loop
    const row = savedStrategies.find(r => r.id === rowId);
    if (row?.selected_strategy_id && row.video_meta) {
      saveReupFeedback({
        strategyId: row.selected_strategy_id,
        videoId: row.video_id,
        category: row.video_meta.category,
        duration: row.video_meta.duration,
        channelSubs: row.video_meta.channelSubs,
        rating,
        ratedAt: new Date().toISOString(),
      });
    }

    toast('⭐ Đã lưu đánh giá!', 'success');
    await loadSaved();
  }, [savedStrategies, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load saved strategies from Supabase ────────────────────
  const loadSaved = useCallback(async () => {
    if (!userId || !workspaceId) return;
    const { data, error: dbErr } = await supabase
      .from('reup_strategies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!dbErr && data) {
      setSaved(data as ReupStrategyRow[]);
    }
  }, [userId, workspaceId]);

  // ── Compare mode ───────────────────────────────────────────
  const toggleCompare = useCallback((strategyId: string) => {
    setCompareIds(prev => {
      if (prev.includes(strategyId)) return prev.filter(id => id !== strategyId);
      if (prev.length >= 3) { toast('Chỉ so sánh tối đa 3 chiến lược', 'info'); return prev; }
      return [...prev, strategyId];
    });
  }, [toast]);

  const clearResult = useCallback(() => {
    setResult(null);
    setVideoMeta(null);
    setError(null);
    setCompareIds([]);
    setCurrentUrl('');
  }, []);

  return {
    videoMeta, result, savedStrategies, loading, deepLoading, error,
    currentUrl, compareIds,
    setCurrentUrl, analyzeUrl, deepAnalyze, saveStrategy, rateStrategy,
    loadSaved, clearResult, toggleCompare,
  };
}
