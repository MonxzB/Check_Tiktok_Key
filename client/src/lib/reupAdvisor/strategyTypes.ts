// ============================================================
// lib/reupAdvisor/strategyTypes.ts — Phase 19 Type Definitions
// ============================================================

// ── Video metadata (fetched from YouTube API) ─────────────────
export interface VideoMeta {
  videoId: string;
  title: string;
  duration: number;          // seconds
  category: string;          // YouTube category name
  categoryId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  channelSubs: number;
  tags: string[];            // top 10 only (to limit tokens)
  hasTranscript: boolean;
  isOfficialArtist: boolean; // detected from channel badges
}

// ── Cut configuration (maps to external video editor tool) ────
export interface CutConfig {
  trimStart: number;         // seconds to skip at start
  trimEnd: number;           // seconds to skip at end
  parts: number;             // number of output clips
  durationPerPart: number;   // target duration per clip (seconds)
  breakCut: {
    enabled: boolean;
    keep: number;            // seconds to keep per segment
    skip: number;            // seconds to skip per segment
  };
  duet: {
    enabled: boolean;
    layout: 'top-bottom' | 'left-right';
    bgVideoCategory: string; // e.g. "minecraft-parkour"
  };
  audioSwap: boolean;        // replace original audio
  customText: string[];      // overlay text suggestions per part
  selectRange?: {
    enabled: boolean;
    fromSecond: number;
    toSecond: number;
  };
}

// ── Output type ───────────────────────────────────────────────
export type StrategyOutputType = 'shorts' | 'longform' | 'mixed' | 'duet';

// ── Single strategy recommendation ───────────────────────────
export interface Strategy {
  id: string;                // e.g. "shorts-spam-safe"
  name: string;              // e.g. "Shorts Spam — Safe Mode"
  emoji: string;             // e.g. "✂️"
  outputType: StrategyOutputType;
  estimatedClips: number;
  estimatedClipDuration: number; // seconds
  config: CutConfig;
  pros: string[];
  cons: string[];
  safetyScore: number;       // 1-10 (10 = safest copyright-wise)
  effortScore: number;       // 1-10 (10 = most effort)
  recommendedFor: string[];  // ["new-account", "high-volume", "safe-reup"]
  reasoning: string;         // Vietnamese explanation
  rank: number;              // 1 = top recommended
}

// ── Full analysis result ──────────────────────────────────────
export interface ReupStrategyResult {
  videoMeta: VideoMeta;
  primaryRecommendation: 'shorts' | 'longform' | 'both';
  confidence: number;        // 0-100
  copyrightRisk: number;     // 1-10 (1=low risk, 10=high risk)
  strategies: Strategy[];    // 3-5 strategies, ranked
  generatedBy: 'rules' | 'llm' | 'hybrid';
  generatedAt: string;
  fromCache?: boolean;
}

// ── Saved strategy (Supabase row) ─────────────────────────────
export interface ReupStrategyRow {
  id: string;
  workspace_id: string;
  user_id: string;
  video_url: string;
  video_id: string;
  video_meta: VideoMeta;
  strategies: Strategy[];
  generated_by: 'rules' | 'llm' | 'hybrid';
  confidence: number | null;
  selected_strategy_id: string | null;
  feedback_rating: number | null;
  feedback_notes: string | null;
  result_video_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Duration buckets for rule engine ─────────────────────────
export type DurationBucket = 'micro' | 'short' | 'medium' | 'long' | 'epic';

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Format duration seconds → human readable
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}g${m}p${s}s`;
  if (m > 0) return `${m}p${s}s`;
  return `${s}s`;
}
