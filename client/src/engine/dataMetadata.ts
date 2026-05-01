// ============================================================
// engine/dataMetadata.ts — Freshness, confidence, data tracking
// ============================================================
import type { KeywordMetadata, FreshnessStatus, ConfidenceLevel, MetadataBuildOptions } from '../types';

export type ExtendedFreshness = FreshnessStatus | 'Recent' | 'Very stale' | 'Unknown';

/** Get freshness label based on collectedAt timestamp. */
export function getFreshness(collectedAt: string): ExtendedFreshness {
  if (!collectedAt) return 'Unknown';
  const days = (Date.now() - new Date(collectedAt).getTime()) / 86400000;
  if (days <= 7) return 'Fresh';
  if (days <= 30) return 'Recent';
  if (days <= 90) return 'Stale';
  return 'Very stale';
}

export function getFreshnessColor(freshness: ExtendedFreshness): string {
  switch (freshness) {
    case 'Fresh':      return 'var(--green)';
    case 'Recent':     return 'var(--accent)';
    case 'Stale':      return 'var(--yellow)';
    case 'Very stale': return 'var(--red)';
    default:           return 'var(--text-muted)';
  }
}

interface ConfidenceOptions {
  hasApiData: boolean;
  longVideoCount?: number;
  hasChannelStats?: boolean;
  hasRecentVideos?: boolean;
}

/** Determine confidence level based on available data. */
export function getConfidence({
  hasApiData,
  longVideoCount = 0,
  hasChannelStats = false,
  hasRecentVideos = false,
}: ConfidenceOptions): ConfidenceLevel {
  if (hasApiData && longVideoCount >= 3 && hasChannelStats && hasRecentVideos) return 'High';
  if (hasApiData && longVideoCount >= 1) return 'Medium';
  return 'Low';
}

/** Build metadata object for a keyword analysis result. */
export function buildMetadata(options: Partial<MetadataBuildOptions> = {}): KeywordMetadata {
  const {
    timeWindowDays = 180,
    regionCode = 'JP',
    languageCode = 'ja',
    hasApiData = false,
    longVideoCount = 0,
    hasChannelStats = false,
    hasRecentVideos = false,
  } = options;
  const collectedAt = new Date().toISOString();
  const freshnessRaw = getFreshness(collectedAt);
  const freshnessStatus: FreshnessStatus =
    freshnessRaw === 'Fresh' ? 'Fresh' :
    freshnessRaw === 'Stale' || freshnessRaw === 'Very stale' ? 'Stale' : 'Old';

  const confidenceLevel = getConfidence({ hasApiData, longVideoCount, hasChannelStats, hasRecentVideos });

  return {
    hasApiData,
    hasChannelStats,
    hasRecentVideos,
    collectedAt,
    timeWindowDays,
    regionCode,
    languageCode,
    confidenceLevel,
    freshnessStatus,
  };
}
