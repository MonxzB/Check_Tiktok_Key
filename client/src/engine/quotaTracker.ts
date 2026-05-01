// ============================================================
// engine/quotaTracker.ts — YouTube API quota usage per key/day
// ============================================================
import type { QuotaEntry } from '../types';

const UNITS_PER_SEARCH   = 100;  // search.list
const UNITS_PER_VIDEOS   = 1;    // videos.list per video
const UNITS_PER_CHANNELS = 1;    // channels.list per channel
export const DAILY_LIMIT = 10000;

function todayKey(apiKey: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hash  = apiKey.slice(-8);
  return `ytlf_quota_${hash}_${today}`;
}

export function getUsage(apiKey: string): number {
  try {
    const raw = localStorage.getItem(todayKey(apiKey));
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

export function addUsage(apiKey: string, units: number): void {
  try {
    const current = getUsage(apiKey);
    localStorage.setItem(todayKey(apiKey), String(current + units));
  } catch { /* ignore storage errors */ }
}

export function isQuotaExhausted(apiKey: string): boolean {
  return getUsage(apiKey) >= DAILY_LIMIT;
}

export function resetUsage(apiKey: string): void {
  try { localStorage.removeItem(todayKey(apiKey)); } catch { /* ignore */ }
}

/** Called after a successful analyze — estimate units used */
export function recordAnalyzeCall(
  apiKey: string,
  videoCount = 25,
  channelCount = 10,
): number {
  const units = UNITS_PER_SEARCH + (videoCount * UNITS_PER_VIDEOS) + (channelCount * UNITS_PER_CHANNELS);
  addUsage(apiKey, units);
  return units;
}

export interface QuotaInfo {
  used: number;
  remaining: number;
  pct: number;
  limit: number;
  exhausted: boolean;
}

export function getQuotaInfo(apiKey: string): QuotaInfo {
  const used      = getUsage(apiKey);
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const pct       = Math.min(100, Math.round((used / DAILY_LIMIT) * 100));
  return { used, remaining, pct, limit: DAILY_LIMIT, exhausted: used >= DAILY_LIMIT };
}

// Satisfy the QuotaEntry import (used elsewhere)
export type { QuotaEntry };
