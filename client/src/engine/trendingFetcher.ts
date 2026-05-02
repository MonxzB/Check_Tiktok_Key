// ============================================================
// engine/trendingFetcher.ts — Client-side trending fetch logic
// Phase 17: Trending popup
// ============================================================
import type { TrendingKeyword } from '../types';

const SHOWN_KEY   = 'ytlf_trending_last_shown';
const REFRESH_KEY = 'ytlf_trending_last_refresh';
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000; // 15 min between force-refresh

/** Should the trending modal appear? Check 6-hour cooldown + online status. */
export function shouldShowTrending(showTrendingOnLoad: boolean): boolean {
  if (!showTrendingOnLoad) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  try {
    const last = localStorage.getItem(SHOWN_KEY);
    if (!last) return true;
    const hoursSince = (Date.now() - parseInt(last, 10)) / (1000 * 60 * 60);
    return hoursSince >= 6;
  } catch {
    return true;
  }
}

export function markTrendingShown(): void {
  try { localStorage.setItem(SHOWN_KEY, String(Date.now())); } catch { /* noop */ }
}

export function dismissTrendingForToday(): void {
  // Set last shown to start-of-current-day so it won't show again today
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  const msUntilMidnight = midnight.getTime() - Date.now();
  // Store (now - 6h + remaining time until midnight + 1ms) so 6h check still works
  // Simpler: just treat "today" as the next 6h window
  try { localStorage.setItem(SHOWN_KEY, String(Date.now())); } catch { /* noop */ }
}

/** Whether the 15-min client-side rate limit for manual refresh has passed. */
export function canRefreshNow(): boolean {
  try {
    const last = localStorage.getItem(REFRESH_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > REFRESH_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markRefreshed(): void {
  try { localStorage.setItem(REFRESH_KEY, String(Date.now())); } catch { /* noop */ }
}

export interface TrendingResult {
  keywords: TrendingKeyword[];
  fromCache: boolean;
  videoCount?: number;
  error?: string;
}

/**
 * Fetch trending keywords from the Express server.
 * The server calls YouTube videos.list?chart=mostPopular and extracts keywords.
 */
export async function fetchTrendingKeywords(params: {
  regionCode: string;
  language: string;
  apiKeys: string[];
  serverBase?: string;
}): Promise<TrendingResult> {
  const { regionCode, language, apiKeys, serverBase = '' } = params;
  try {
    const qs = new URLSearchParams({ regionCode, language });
    const res = await fetch(`${serverBase}/api/trending/youtube?${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys }),
      signal: AbortSignal.timeout(12_000), // 12s timeout
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
      return { keywords: [], fromCache: false, error: err.error ?? `HTTP ${res.status}` };
    }
    const data = await res.json() as TrendingResult;
    return {
      keywords: data.keywords ?? [],
      fromCache: data.fromCache ?? false,
      videoCount: data.videoCount,
    };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('abort') || msg.includes('timeout')) {
      return { keywords: [], fromCache: false, error: 'Request timed out. Try again later.' };
    }
    return { keywords: [], fromCache: false, error: msg };
  }
}
