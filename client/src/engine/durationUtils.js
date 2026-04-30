// ============================================================
// engine/durationUtils.js — ISO 8601 duration parsing
// ============================================================

/**
 * Parse YouTube ISO 8601 duration string to seconds.
 * e.g. "PT12M34S" -> 754, "PT1H2M3S" -> 3723
 */
export function parseISO8601Duration(str) {
  if (!str) return 0;
  const m = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0');
  const min = parseInt(m[2] || '0');
  const sec = parseInt(m[3] || '0');
  return h * 3600 + min * 60 + sec;
}

/**
 * Format seconds to "HH:MM:SS" or "MM:SS"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Classify video duration category for long-form
 */
export function classifyDuration(seconds) {
  if (seconds < 300) return 'short';           // < 5 min
  if (seconds < 600) return 'short-longform';  // 5–10 min
  if (seconds < 1200) return 'standard';       // 10–20 min
  return 'deep';                               // 20+ min
}

/**
 * Check if a video is a YouTube Short (< 60s or has #shorts)
 */
export function isShort(durationSeconds, title = '', description = '') {
  if (durationSeconds > 0 && durationSeconds <= 60) return true;
  const text = (title + ' ' + description).toLowerCase();
  if (/#shorts|#short\b/.test(text)) return true;
  return false;
}
