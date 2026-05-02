// ============================================================
// hooks/usePersonalScoring.ts — Phase 10: Personalized Scoring
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import {
  adjustWeights, DEFAULT_WEIGHTS, feedbacksNeededForTraining,
  type ScoringWeights, type KeywordFeedback, type PerformanceRating,
} from '../engine/personalizedScoring.ts';
import type { Keyword } from '../types';

const WEIGHTS_LS_KEY  = 'ytlf_personal_weights';
const ENABLED_LS_KEY  = 'ytlf_personal_enabled';

export interface NewFeedback {
  keyword: Keyword;
  made_video: boolean;
  performance?: PerformanceRating;
  actual_views?: number;
  notes?: string;
}

export interface UsePersonalScoringReturn {
  weights:    ScoringWeights;
  feedbacks:  KeywordFeedback[];
  enabled:    boolean;
  training:   boolean;
  needMore:   number;        // feedbacks needed before training available
  setEnabled: (v: boolean) => void;
  submitFeedback: (data: NewFeedback) => Promise<void>;
  retrain:    () => Promise<void>;
  resetWeights: () => void;
  getFeedback: (keyword: string) => KeywordFeedback | undefined;
}

export function usePersonalScoring(userId: string | null): UsePersonalScoringReturn {
  const [weights, setWeights]   = useState<ScoringWeights>(() => {
    try {
      const saved = localStorage.getItem(WEIGHTS_LS_KEY);
      return saved ? JSON.parse(saved) : { ...DEFAULT_WEIGHTS };
    } catch { return { ...DEFAULT_WEIGHTS }; }
  });
  const [feedbacks, setFeedbacks] = useState<KeywordFeedback[]>([]);
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try { return localStorage.getItem(ENABLED_LS_KEY) === 'true'; } catch { return false; }
  });
  const [training, setTraining] = useState(false);

  // Load feedbacks from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('keyword_feedbacks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setFeedbacks(data as unknown as KeywordFeedback[]);
    })();
  }, [userId]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try { localStorage.setItem(ENABLED_LS_KEY, String(v)); } catch {}
  }, []);

  // ── submitFeedback ────────────────────────────────────────────
  const submitFeedback = useCallback(async (data: NewFeedback) => {
    if (!userId) return;
    const { keyword: kw, made_video, performance, actual_views, notes } = data;
    const row = {
      user_id:              userId,
      keyword:              kw.keyword,
      made_video,
      performance:          performance ?? null,
      actual_views:         actual_views ?? null,
      notes:                notes ?? null,
      score_demand:         kw.demand,
      score_search_intent:  kw.searchIntent,
      score_topic_depth:    kw.topicDepth,
      score_small_channel:  kw.smallChannel,
      score_evergreen:      kw.evergreen,
      score_series_potential: kw.seriesPotential,
      score_long_tail_exp:  kw.longTailExp,
      score_low_risk:       kw.lowRisk,
      score_total:          kw.longFormScore,
      updated_at:           new Date().toISOString(),
    };

    const { error } = await supabase
      .from('keyword_feedbacks')
      .upsert(row, { onConflict: 'user_id,keyword' });

    if (!error) {
      setFeedbacks(prev => {
        const idx = prev.findIndex(f => f.keyword === kw.keyword);
        const updated = row as unknown as KeywordFeedback;
        return idx >= 0 ? prev.map((f, i) => i === idx ? updated : f) : [updated, ...prev];
      });
    }
  }, [userId]);

  // ── retrain ───────────────────────────────────────────────────
  const retrain = useCallback(async () => {
    setTraining(true);
    try {
      const newWeights = adjustWeights(feedbacks);
      setWeights(newWeights);
      try { localStorage.setItem(WEIGHTS_LS_KEY, JSON.stringify(newWeights)); } catch {}
    } finally {
      setTraining(false);
    }
  }, [feedbacks]);

  // ── resetWeights ──────────────────────────────────────────────
  const resetWeights = useCallback(() => {
    setWeights({ ...DEFAULT_WEIGHTS });
    try { localStorage.removeItem(WEIGHTS_LS_KEY); } catch {}
  }, []);

  const getFeedback = useCallback(
    (keyword: string) => feedbacks.find(f => f.keyword === keyword),
    [feedbacks],
  );

  return {
    weights, feedbacks, enabled, training,
    needMore: feedbacksNeededForTraining(feedbacks),
    setEnabled, submitFeedback, retrain, resetWeights, getFeedback,
  };
}
