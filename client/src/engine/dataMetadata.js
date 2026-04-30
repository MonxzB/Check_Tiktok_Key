// ============================================================
// engine/dataMetadata.js — Freshness, confidence, data tracking
// ============================================================

/**
 * Get freshness label based on collectedAt timestamp.
 */
export function getFreshness(collectedAt) {
  if (!collectedAt) return 'Unknown';
  const days = (Date.now() - new Date(collectedAt)) / 86400000;
  if (days <= 7) return 'Fresh';
  if (days <= 30) return 'Recent';
  if (days <= 90) return 'Stale';
  return 'Very stale';
}

export function getFreshnessColor(freshness) {
  switch (freshness) {
    case 'Fresh': return 'var(--green)';
    case 'Recent': return 'var(--accent)';
    case 'Stale': return 'var(--yellow)';
    case 'Very stale': return 'var(--red)';
    default: return 'var(--text-muted)';
  }
}

/**
 * Determine confidence level based on available data.
 */
export function getConfidence({ hasApiData, longVideoCount, hasChannelStats, hasRecentVideos }) {
  if (hasApiData && longVideoCount >= 3 && hasChannelStats && hasRecentVideos) return 'High';
  if (hasApiData && longVideoCount >= 1) return 'Medium';
  return 'Low';
}

/**
 * Build metadata object for a keyword analysis result.
 */
export function buildMetadata({
  timeWindowDays = 180,
  regionCode = 'JP',
  languageCode = 'ja',
  hasApiData = false,
  longVideoCount = 0,
  hasChannelStats = false,
  hasRecentVideos = false,
} = {}) {
  const collectedAt = new Date().toISOString();
  const freshness = getFreshness(collectedAt);
  const confidence = getConfidence({ hasApiData, longVideoCount, hasChannelStats, hasRecentVideos });

  return {
    dataSourcesUsed: hasApiData ? 'YouTube Data API v3' : 'Rule-based only',
    collectedAt,
    timeWindowDays,
    regionCode,
    languageCode,
    confidenceLevel: confidence,
    freshnessStatus: freshness,
  };
}
