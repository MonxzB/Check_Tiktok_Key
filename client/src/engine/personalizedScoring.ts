// ============================================================
// engine/personalizedScoring.ts — Phase 10: ML-lite scoring
// ============================================================
import type { Keyword } from '../types';

// The 8 score dimensions — field names match Keyword type exactly
export const SCORE_KEYS = [
  'demand', 'searchIntent', 'topicDepth', 'smallChannel',
  'evergreen', 'seriesPotential', 'longTailExp', 'lowRisk',
] as const;
export type ScoreKey = typeof SCORE_KEYS[number];

export interface ScoringWeights {
  demand:           number;
  searchIntent:     number;
  topicDepth:       number;
  smallChannel:     number;
  evergreen:        number;
  seriesPotential:  number;
  longTailExp:      number;
  lowRisk:          number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  demand: 1.0, searchIntent: 1.0, topicDepth: 1.0,
  smallChannel: 1.0, evergreen: 1.0, seriesPotential: 1.0,
  longTailExp: 1.0, lowRisk: 1.0,
};

export type PerformanceRating = 'great' | 'good' | 'bad' | 'flopped';

export interface KeywordFeedback {
  keyword: string;
  made_video: boolean;
  performance?: PerformanceRating;
  actual_views?: number;
  notes?: string;
  // Score dimensions at time of feedback
  score_demand?: number;
  score_search_intent?: number;
  score_topic_depth?: number;
  score_small_channel?: number;
  score_evergreen?: number;
  score_series_potential?: number;
  score_long_tail_exp?: number;
  score_low_risk?: number;
  score_total?: number;
}

// ── Outcome mapping ───────────────────────────────────────────
function outcomeValue(perf: PerformanceRating | undefined): number {
  switch (perf) {
    case 'great':   return 1.0;
    case 'good':    return 0.7;
    case 'bad':     return 0.3;
    case 'flopped': return 0.0;
    default:        return 0.5;
  }
}

// ── Pearson correlation ───────────────────────────────────────
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

const MIN_FEEDBACK = 20;

// ── Cold Start thresholds (Task 3.3) ─────────────────────────
/** Minimum feedbacks before ANY personal weight adjustment. Below this → pure default. */
export const COLD_START_MIN = 10;
/** Feedbacks needed for full trust in personal weights (no blending with global). */
export const WARMUP_MAX = 30;

/** Compute adjusted weights using Pearson correlation between each score dimension and outcome. */
export function adjustWeights(feedbacks: KeywordFeedback[]): ScoringWeights {
  const rated = feedbacks.filter(f => f.made_video && f.performance);
  if (rated.length < MIN_FEEDBACK) return { ...DEFAULT_WEIGHTS };

  const outcomes = rated.map(f => outcomeValue(f.performance));

  const FIELD_MAP: Record<ScoreKey, keyof KeywordFeedback> = {
    demand:          'score_demand',
    searchIntent:    'score_search_intent',
    topicDepth:      'score_topic_depth',
    smallChannel:    'score_small_channel',
    evergreen:       'score_evergreen',
    seriesPotential: 'score_series_potential',
    longTailExp:     'score_long_tail_exp',
    lowRisk:         'score_low_risk',
  };

  const weights: Partial<ScoringWeights> = {};
  for (const key of SCORE_KEYS) {
    const scoreField = FIELD_MAP[key];
    const xs = rated.map(f => Number(f[scoreField] ?? 0));
    const corr = pearson(xs, outcomes);
    const w = 1.0 + corr * 0.5;
    weights[key] = parseFloat(Math.max(0.5, Math.min(1.5, w)).toFixed(3));
  }

  return weights as ScoringWeights;
}

/**
 * Task 3.3: Returns the effective weights to use for scoring.
 *
 * Phase 1 — Cold start  (< 10 feedbacks): return global default
 * Phase 2 — Warm-up     (10-30 feedbacks): blend personal + global
 *   blendRatio = (count-10) / 20 → 0 at 10 feedbacks, 1 at 30
 * Phase 3 — Full personal (≥ 30 feedbacks): return computed personal weights
 *
 * This prevents noisy early feedback from destabilizing the engine.
 */
export function getEffectiveWeights(
  feedbacks: KeywordFeedback[],
  globalWeights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoringWeights {
  const rated = feedbacks.filter(f => f.made_video && f.performance);
  const count = rated.length;

  if (count < COLD_START_MIN) {
    // Cold start: not enough data — use global defaults
    return { ...globalWeights };
  }

  const personal = adjustWeights(feedbacks);

  if (count >= WARMUP_MAX) {
    // Full personal phase
    return personal;
  }

  // Warm-up phase: linear blend
  const blendRatio = (count - COLD_START_MIN) / (WARMUP_MAX - COLD_START_MIN); // 0 → 1
  const blended: Partial<ScoringWeights> = {};
  for (const key of SCORE_KEYS) {
    blended[key] = parseFloat(
      (personal[key] * blendRatio + globalWeights[key] * (1 - blendRatio)).toFixed(3)
    );
  }
  return blended as ScoringWeights;
}

export type FeedbackPhase = 'cold' | 'warmup' | 'active';

/**
 * Task 3.3: Returns the current phase + UI progress info.
 * Used by Settings to show: "7/10 feedbacks (cần thêm 3 để kích hoạt)"
 */
export function getFeedbackPhase(feedbacks: KeywordFeedback[]): {
  phase: FeedbackPhase;
  count: number;
  neededForActivation: number;
  neededForFull: number;
  progressPct: number;
  label: string;
} {
  const rated = feedbacks.filter(f => f.made_video && f.performance);
  const count = rated.length;

  if (count < COLD_START_MIN) {
    return {
      phase: 'cold',
      count,
      neededForActivation: COLD_START_MIN - count,
      neededForFull: WARMUP_MAX - count,
      progressPct: Math.round((count / COLD_START_MIN) * 100),
      label: `${count}/${COLD_START_MIN} feedbacks (cần thêm ${COLD_START_MIN - count} để kích hoạt)`,
    };
  }

  if (count < WARMUP_MAX) {
    const pct = Math.round(((count - COLD_START_MIN) / (WARMUP_MAX - COLD_START_MIN)) * 100);
    return {
      phase: 'warmup',
      count,
      neededForActivation: 0,
      neededForFull: WARMUP_MAX - count,
      progressPct: pct,
      label: `Warm-up: ${count}/${WARMUP_MAX} feedbacks (${pct}% personal weight)`,
    };
  }

  return {
    phase: 'active',
    count,
    neededForActivation: 0,
    neededForFull: 0,
    progressPct: 100,
    label: `✅ Personal Scoring active (${count} feedbacks)`,
  };
}

/** Apply personalized weights to a keyword's raw dimension scores. */
export function applyPersonalWeights(kw: Keyword, weights: ScoringWeights): number {
  let total = 0;
  for (const key of SCORE_KEYS) {
    total += (kw[key] ?? 0) * (weights[key] ?? 1);
  }
  return Math.round(Math.min(100, total));
}

export function feedbacksNeededForTraining(feedbacks: KeywordFeedback[]): number {
  const rated = feedbacks.filter(f => f.made_video && f.performance);
  return Math.max(0, MIN_FEEDBACK - rated.length);
}
