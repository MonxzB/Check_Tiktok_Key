// ============================================================
// lib/reupAdvisor/scoringIntegration.ts — Phase 19
// Feeds reup feedback into existing ML personalization loop
// ============================================================

// Feedback event stored to localStorage — same pattern as usePersonalScoring
const FEEDBACK_KEY = 'ytlf_reup_feedback';

export interface ReupFeedbackEntry {
  strategyId: string;
  videoId: string;
  category: string;
  duration: number;
  channelSubs: number;
  rating: number;         // 1-5
  ratedAt: string;
}

export function saveReupFeedback(entry: ReupFeedbackEntry): void {
  try {
    const existing: ReupFeedbackEntry[] = loadReupFeedback();
    existing.push(entry);
    // Keep last 200 entries only
    const trimmed = existing.slice(-200);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function loadReupFeedback(): ReupFeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Compute which strategy types work best for a category based on feedback
export function getBestStrategyForCategory(category: string): string | null {
  const entries = loadReupFeedback().filter(
    e => e.category === category && e.rating >= 4,
  );
  if (entries.length < 3) return null; // not enough data
  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.strategyId] = (counts[e.strategyId] ?? 0) + e.rating;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
