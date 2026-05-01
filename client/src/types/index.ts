// ============================================================
// types/index.ts — Shared TypeScript types for the entire app
// NOTE: Field names intentionally match current JS code (not spec aliases)
//       e.g. kw.keyword (not kw.text), kw.longTailExp (not longTailExpansion)
//       These will be normalized in Phase 1 when migrating to Supabase.
// ============================================================

// ── Supabase user re-export ────────────────────────────────────
export type { User } from '@supabase/supabase-js';

// ── Niche ─────────────────────────────────────────────────────
export type Niche =
  | 'AI / ChatGPT'
  | 'Excel / Office'
  | 'Lập trình'
  | 'Tiết kiệm'
  | 'Công việc'
  | 'Phỏng vấn'
  | 'Học tập'
  | 'Tâm lý học'
  | 'Kiến thức / Fact'
  | 'Văn hóa Nhật'
  | '100均'
  | 'Sức khỏe'
  | 'Kinh doanh';

// ── Keyword classification ────────────────────────────────────
export type KeywordLevel = 'Broad' | 'Mid-tail' | 'Long-tail';
export type SearchIntent = 'high' | 'medium' | 'low';
export type FreshnessStatus = 'Fresh' | 'Stale' | 'Old';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

// ── Keyword scores (8 dimensions) ────────────────────────────
export interface KeywordScores {
  demand: number;         // 0-20
  searchIntent: number;   // 0-15
  topicDepth: number;     // 0-15
  smallChannel: number;   // 0-15
  evergreen: number;      // 0-10
  seriesPotential: number; // 0-10
  longTailExp: number;    // 0-10  (spec alias: longTailExpansion)
  lowRisk: number;        // 0-5
}

// ── YouTube API summary (returned by server after analysis) ───
export interface KeywordApiSummary {
  longVideosFound: number;
  avgLongVideoViews: number;
  bestViewSubRatio: number;
  hasSmallChannelOpportunity: boolean;
  hasRiskyChannels: boolean;
  refChannels: string[];
  refVideoTitles: string[];
  collectedAt: string;
  timeWindowDays: number;
  regionCode: string;
  languageCode: string;
}

// ── Keyword metadata (freshness, confidence) ──────────────────
export interface KeywordMetadata {
  collectedAt: string;
  freshnessStatus: FreshnessStatus;
  confidenceLevel: ConfidenceLevel;
  hasApiData: boolean;
  hasChannelStats: boolean;
  hasRecentVideos: boolean;
  timeWindowDays: number;
  regionCode: string;
  languageCode: string;
}

// ── Keyword (main entity) ─────────────────────────────────────
export interface Keyword {
  // Identity (field name matches current JS code)
  keyword: string;         // spec alias: text
  vi: string;              // Vietnamese meaning
  niche: Niche;
  level: KeywordLevel;

  // 8 score dimensions (flat, not nested — current code structure)
  demand: number;
  searchIntent: number;
  topicDepth: number;
  smallChannel: number;
  evergreen: number;
  seriesPotential: number;
  longTailExp: number;     // spec alias: longTailExpansion
  lowRisk: number;
  longFormScore: number;   // total

  // Derived
  recommendation: string;
  reason: string;
  chapters: string[];
  suggestedTitles: string[];
  subKeywords: string[];

  // API data (filled after YouTube analysis)
  apiData: KeywordApiSummary | null;
  metadata: KeywordMetadata | null;

  // Phase 2+ (workspace support)
  workspaceId?: string;
}

// ── Seed object (used by expansion engine) ────────────────────
export interface SeedObject {
  jp: string;
  vi: string;
  niche?: Niche;
}

// ── YouTube Reference Video ───────────────────────────────────
export interface RefVideo {
  keyword: string;
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  durationSec: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  isShort: boolean;
  isRisky: boolean;
  riskNotes: string;
  viewSubRatio: number;
  longFormFitScore: number;
  videoUrl: string;
  channelUrl: string;
}

// ── YouTube Reference Channel ─────────────────────────────────
export interface RefChannel {
  keyword: string;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  relatedLongVideos: number;
  bestVideoTitle: string;
  bestVideoUrl: string;
  bestVideoViews: number;
  bestViewSubRatio: number;
  fitScore: number;
  recommendation: string;
  reason: string;
  riskNotes: string;
  isRisky: boolean;
  isSmallOpportunity: boolean;
}

// ── Analyze result from server ────────────────────────────────
export interface AnalyzeResult {
  videos: RefVideo[];
  channels: RefChannel[];
  summary: KeywordApiSummary;
  fromCache?: boolean;
  usedKeyIdx?: number;
}

// ── Settings ──────────────────────────────────────────────────
export type RegionCode = 'JP' | 'US' | 'VN';
export type LanguageCode = 'ja' | 'en' | 'vi';
export type OrderBy = 'relevance' | 'viewCount' | 'date';

export interface UserSettings {
  apiKeys: string[];
  minDurationMin: number;
  timeWindowDays: number;
  maxResults: number;
  orderBy: OrderBy;
  regionCode: RegionCode;
  languageCode: LanguageCode;
  hideRisky: boolean;
}

// ── Keyword Filters ───────────────────────────────────────────
export interface KeywordFilters {
  minScore: number;
  niche: string;
  level: string;
  intent: string;
  evergreen: string;
  risk: string;
  rec: string;
}

// ── Toast ─────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastFn = (message: string, type?: ToastType) => void;

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ── Tab IDs ───────────────────────────────────────────────────
export type TabId = 'keywords' | 'youtube' | 'csv' | 'settings' | 'competitors';

// ── Quota tracker ─────────────────────────────────────────────
export interface QuotaEntry {
  date: string;
  calls: number;
  unitsUsed: number;
}

// ── Metadata build options ────────────────────────────────────
export interface MetadataBuildOptions {
  hasApiData: boolean;
  longVideoCount?: number;
  hasChannelStats?: boolean;
  hasRecentVideos?: boolean;
  timeWindowDays?: number;
  regionCode?: string;
  languageCode?: string;
}

// ── Server API request/response types ────────────────────────
export interface AnalyzeRequest {
  keyword: string;
  apiKeys: string[];
  minDurationMin?: number;
  timeWindowDays?: number;
  maxResults?: number;
  orderBy?: OrderBy;
  regionCode?: RegionCode;
  languageCode?: LanguageCode;
}

export interface StatusRequest {
  apiKeys?: string[];
}

export interface StatusResponse {
  configured: boolean;
  message: string;
}

// ── Workspace (placeholder for Phase 2) ──────────────────────
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  niche?: Niche;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Phase 2: Supabase row shapes ──────────────────────────────
export interface WorkspaceInsert {
  user_id: string;
  name: string;
  description?: string;
  niche?: string;
  color?: string;
  is_default?: boolean;
}

/** Supabase `keywords` table row (snake_case, matches DB) */
export interface KeywordRow {
  id: string;
  workspace_id: string;
  user_id: string;
  keyword: string;
  vi: string;
  niche: string;
  level: string;
  demand: number;
  search_intent: number;
  topic_depth: number;
  small_channel: number;
  evergreen: number;
  series_potential: number;
  long_tail_exp: number;
  low_risk: number;
  long_form_score: number;
  recommendation: string;
  reason: string;
  chapters: string[];
  suggested_titles: string[];
  sub_keywords: string[];
  api_data: KeywordApiSummary | null;
  metadata: KeywordMetadata | null;
  created_at: string;
  updated_at: string;
}

/** Convert DB KeywordRow → frontend Keyword */
export function rowToKeyword(row: KeywordRow): Keyword {
  return {
    keyword: row.keyword,
    vi: row.vi,
    niche: row.niche as Keyword['niche'],
    level: row.level as Keyword['level'],
    demand: row.demand,
    searchIntent: row.search_intent,
    topicDepth: row.topic_depth,
    smallChannel: row.small_channel,
    evergreen: row.evergreen,
    seriesPotential: row.series_potential,
    longTailExp: row.long_tail_exp,
    lowRisk: row.low_risk,
    longFormScore: row.long_form_score,
    recommendation: row.recommendation,
    reason: row.reason,
    chapters: row.chapters,
    suggestedTitles: row.suggested_titles,
    subKeywords: row.sub_keywords,
    apiData: row.api_data,
    metadata: row.metadata,
    workspaceId: row.workspace_id,
  };
}

/** Convert frontend Keyword → DB insert/upsert shape */
export function keywordToRow(
  kw: Keyword,
  workspaceId: string,
  userId: string,
): Omit<KeywordRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    workspace_id: workspaceId,
    user_id: userId,
    keyword: kw.keyword,
    vi: kw.vi,
    niche: kw.niche,
    level: kw.level,
    demand: kw.demand,
    search_intent: kw.searchIntent,
    topic_depth: kw.topicDepth,
    small_channel: kw.smallChannel,
    evergreen: kw.evergreen,
    series_potential: kw.seriesPotential,
    long_tail_exp: kw.longTailExp,
    low_risk: kw.lowRisk,
    long_form_score: kw.longFormScore,
    recommendation: kw.recommendation,
    reason: kw.reason,
    chapters: kw.chapters,
    suggested_titles: kw.suggestedTitles,
    sub_keywords: kw.subKeywords,
    api_data: kw.apiData,
    metadata: kw.metadata,
  };
}

// ── Phase 6: Snapshot (time-series) ──────────────────────────
export interface KeywordSnapshotRow {
  id: string;
  keyword_id: string;
  workspace_id: string;
  user_id: string;
  long_form_score: number;
  avg_views: number;
  long_videos_found: number;
  best_ratio: number;
  api_data: Record<string, unknown>;
  captured_at: string;
}

export interface SnapshotInsert {
  keyword_id: string;
  workspace_id: string;
  user_id: string;
  long_form_score: number;
  avg_views: number;
  long_videos_found: number;
  best_ratio: number;
  api_data: Record<string, unknown>;
}
