// ============================================================
// engine/quotaTracker.ts — YouTube API quota usage per key/day
//
// Task 1.3: Moved to Supabase for cross-device accuracy.
//
// Strategy:
//   1. Always write to localStorage immediately (optimistic, offline-safe)
//   2. Async sync to Supabase using atomic increment (upsert + increment)
//   3. On reads, prefer in-memory cache → Supabase → localStorage fallback
//   4. 30-second in-memory cache to reduce Supabase query frequency
//
// Auth source: Supabase user ID from current session.
// ============================================================

import { supabase } from '../lib/supabase.ts';
import type { QuotaEntry } from '../types';

// ── Constants ─────────────────────────────────────────────────
const UNITS_PER_SEARCH   = 100;   // search.list
const UNITS_PER_VIDEOS   = 1;     // videos.list per video
const UNITS_PER_CHANNELS = 1;     // channels.list per channel
export const DAILY_LIMIT = 10000;
const CACHE_TTL_MS       = 30_000; // 30 s in-memory cache

// ── In-memory cache ───────────────────────────────────────────
const cache = new Map<string, { used: number; ts: number }>();

// ── Key helpers ───────────────────────────────────────────────
function apiKeyHash(apiKey: string): string {
  return apiKey.slice(-8);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function localStorageKey(apiKey: string): string {
  return `ytlf_quota_${apiKeyHash(apiKey)}_${todayStr()}`;
}

// ── localStorage (offline fallback) ──────────────────────────
function lsGet(apiKey: string): number {
  try {
    const raw = localStorage.getItem(localStorageKey(apiKey));
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

function lsAdd(apiKey: string, units: number): void {
  try {
    const current = lsGet(apiKey);
    localStorage.setItem(localStorageKey(apiKey), String(current + units));
  } catch { /* ignore */ }
}

// ── Supabase sync ─────────────────────────────────────────────

/**
 * Atomically increment quota in Supabase.
 * Uses upsert so first call of the day creates the row.
 */
async function supabaseAdd(apiKey: string, units: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // offline / unauthenticated

  const hash = apiKeyHash(apiKey);
  const date = todayStr();

  // Upsert: if row exists → increment; if not → insert with units
  const { error } = await supabase.rpc('increment_quota', {
    p_user_id:    user.id,
    p_key_hash:   hash,
    p_date:       date,
    p_units:      units,
  }).catch(() => ({ error: new Error('rpc unavailable') }));

  if (error) {
    // Fallback: plain upsert (non-atomic, acceptable for single device)
    await supabase
      .from('youtube_quota_usage')
      .upsert({
        user_id:     user.id,
        api_key_hash: hash,
        date,
        units_used:  units,
        last_request_at: new Date().toISOString(),
      }, { onConflict: 'user_id,api_key_hash,date', ignoreDuplicates: false })
      .catch(() => null);
  }
}

/**
 * Fetch total units used today from Supabase.
 * Returns null if offline or unauthenticated.
 */
async function supabaseGet(apiKey: string): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('youtube_quota_usage')
    .select('units_used')
    .eq('user_id', user.id)
    .eq('api_key_hash', apiKeyHash(apiKey))
    .eq('date', todayStr())
    .maybeSingle();

  if (error || !data) return null;
  return data.units_used as number;
}

// ── Public API ────────────────────────────────────────────────

export function getUsage(apiKey: string): number {
  const cached = cache.get(apiKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.used;
  }
  // Fallback to localStorage for synchronous reads
  return lsGet(apiKey);
}

/**
 * Refresh cache from Supabase (async).
 * Call this once on component mount to get cross-device accurate count.
 */
export async function refreshUsage(apiKey: string): Promise<number> {
  const remote = await supabaseGet(apiKey);
  const local  = lsGet(apiKey);
  const used   = remote !== null ? Math.max(remote, local) : local;
  cache.set(apiKey, { used, ts: Date.now() });
  // Write back to localStorage so offline reads are accurate
  try { localStorage.setItem(localStorageKey(apiKey), String(used)); } catch { /* ignore */ }
  return used;
}

export function addUsage(apiKey: string, units: number): void {
  // 1. Immediate optimistic update
  lsAdd(apiKey, units);
  const prev = cache.get(apiKey)?.used ?? lsGet(apiKey);
  cache.set(apiKey, { used: prev + units, ts: Date.now() });

  // 2. Async sync to Supabase (fire-and-forget)
  supabaseAdd(apiKey, units).catch(() => null);
}

export function isQuotaExhausted(apiKey: string): boolean {
  return getUsage(apiKey) >= DAILY_LIMIT;
}

export function resetUsage(apiKey: string): void {
  try { localStorage.removeItem(localStorageKey(apiKey)); } catch { /* ignore */ }
  cache.delete(apiKey);
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
