// client/src/engine/quotaTracker.js
// Track YouTube API quota usage per key per day (resets at midnight)

const UNITS_PER_SEARCH   = 100;  // search.list
const UNITS_PER_VIDEOS   = 1;    // videos.list per video (batch ~25 units)
const UNITS_PER_CHANNELS = 1;    // channels.list per channel
const DAILY_LIMIT        = 10000;

function todayKey(apiKey) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hash  = apiKey.slice(-8); // last 8 chars as identifier
  return `ytlf_quota_${hash}_${today}`;
}

export function getUsage(apiKey) {
  try {
    const raw = localStorage.getItem(todayKey(apiKey));
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

export function addUsage(apiKey, units) {
  try {
    const current = getUsage(apiKey);
    localStorage.setItem(todayKey(apiKey), String(current + units));
  } catch {}
}

export function isQuotaExhausted(apiKey) {
  return getUsage(apiKey) >= DAILY_LIMIT;
}

export function resetUsage(apiKey) {
  try { localStorage.removeItem(todayKey(apiKey)); } catch {}
}

// Called after a successful analyze — estimate units used
export function recordAnalyzeCall(apiKey, videoCount = 25, channelCount = 10) {
  const units = UNITS_PER_SEARCH + (videoCount * UNITS_PER_VIDEOS) + (channelCount * UNITS_PER_CHANNELS);
  addUsage(apiKey, units);
  return units;
}

export function getQuotaInfo(apiKey) {
  const used      = getUsage(apiKey);
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const pct       = Math.min(100, Math.round((used / DAILY_LIMIT) * 100));
  return { used, remaining, pct, limit: DAILY_LIMIT, exhausted: used >= DAILY_LIMIT };
}

export { DAILY_LIMIT };
