-- 009_trending_cache.sql — Trending keywords cache (6h TTL)
-- Stores extracted keywords from YouTube trending videos to avoid
-- repeated API calls. Cache expires after 6 hours per platform/region/lang.

CREATE TABLE IF NOT EXISTS trending_cache (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    TEXT        NOT NULL CHECK (platform IN ('youtube', 'tiktok')),
  region_code TEXT        NOT NULL,
  language    TEXT        NOT NULL,
  -- JSON array of {keyword, score, rank, sampleVideoTitles[]}
  keywords    JSONB       NOT NULL DEFAULT '[]',
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '6 hours',
  UNIQUE (platform, region_code, language)
);

CREATE INDEX IF NOT EXISTS idx_trending_lookup
  ON trending_cache (platform, region_code, expires_at DESC);

-- No RLS needed: this is public read-only cache data managed by server
