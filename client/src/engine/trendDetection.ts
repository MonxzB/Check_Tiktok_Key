// ============================================================
// engine/trendDetection.ts — Phase 6: Trend analysis from snapshots
// ============================================================

export interface KeywordSnapshot {
  id: string;
  keyword_id: string;
  long_form_score: number;
  avg_views: number;
  long_videos_found: number;
  best_ratio: number;
  api_data: Record<string, unknown>;
  captured_at: string;
}

export interface TrendStatus {
  direction: 'rising' | 'stable' | 'declining';
  changePercent: number;     // % change vs baseline
  scoreDelta: number;        // absolute score change
  confidence: 'high' | 'medium' | 'low';
  badge: '🔥' | '📈' | '➡️' | '📉' | null;
  label: string;
}

/**
 * Calculate trend from a list of snapshots (newest first).
 * Needs at least 2 snapshots to compute a meaningful trend.
 */
export function calculateTrend(snapshots: KeywordSnapshot[]): TrendStatus {
  if (!snapshots || snapshots.length < 2) {
    return { direction: 'stable', changePercent: 0, scoreDelta: 0, confidence: 'low', badge: null, label: '—' };
  }

  // Sort newest first if not already
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
  );

  const latest   = sorted[0];
  const baseline = sorted[sorted.length - 1];

  // Avg views change
  const baseViews = baseline.avg_views || 0;
  const latestViews = latest.avg_views || 0;
  const changePercent = baseViews > 0
    ? ((latestViews - baseViews) / baseViews) * 100
    : 0;

  const scoreDelta = latest.long_form_score - baseline.long_form_score;
  const confidence: TrendStatus['confidence'] = snapshots.length >= 5 ? 'high' : snapshots.length >= 3 ? 'medium' : 'low';

  if (changePercent > 50) {
    return { direction: 'rising',    changePercent, scoreDelta, confidence, badge: '🔥', label: `+${changePercent.toFixed(0)}%` };
  }
  if (changePercent > 20) {
    return { direction: 'rising',    changePercent, scoreDelta, confidence, badge: '📈', label: `+${changePercent.toFixed(0)}%` };
  }
  if (changePercent < -30) {
    return { direction: 'declining', changePercent, scoreDelta, confidence, badge: '📉', label: `${changePercent.toFixed(0)}%` };
  }
  return   { direction: 'stable',   changePercent, scoreDelta, confidence, badge: '➡️', label: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(0)}%` };
}

/**
 * Filter snapshots by period.
 */
export function filterByPeriod(snapshots: KeywordSnapshot[], period: '7d' | '30d' | '90d' | 'all'): KeywordSnapshot[] {
  if (period === 'all') return snapshots;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 86_400_000;
  return snapshots.filter(s => new Date(s.captured_at).getTime() >= cutoff);
}
