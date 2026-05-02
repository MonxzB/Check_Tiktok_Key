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

/** Compute adjusted weights using Pearson correlation between each score dimension and outcome. */
export function adjustWeights(feedbacks: KeywordFeedback[]): ScoringWeights {
  // Only feedbacks where user actually made a video and gave a rating
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
    // Map correlation [-1,1] → weight [0.5, 1.5]
    // corr=1 → 1.5, corr=0 → 1.0, corr=-1 → 0.5
    const w = 1.0 + corr * 0.5;
    weights[key] = parseFloat(Math.max(0.5, Math.min(1.5, w)).toFixed(3));
  }

  return weights as ScoringWeights;
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
