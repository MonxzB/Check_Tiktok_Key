-- ============================================================
-- Migration 007: YouTube Quota Usage Tracker
-- Task 1.3: Move quota tracking from localStorage to Supabase
--
-- Problem: localStorage tracks per-device only. Users on 2 devices
-- each count quota independently, leading to 403 errors when total
-- YouTube API usage exceeds 10,000 units/day despite UI showing quota
-- still available.
--
-- Solution: Shared table with atomic increment updates.
-- ============================================================

CREATE TABLE IF NOT EXISTS youtube_quota_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_key_hash     TEXT NOT NULL,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  units_used       INTEGER NOT NULL DEFAULT 0,
  last_request_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, api_key_hash, date)
);

CREATE INDEX IF NOT EXISTS idx_quota_user_date
  ON youtube_quota_usage(user_id, date);

-- Row Level Security
ALTER TABLE youtube_quota_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quota"
  ON youtube_quota_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quota"
  ON youtube_quota_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quota"
  ON youtube_quota_usage FOR UPDATE
  USING (auth.uid() = user_id);
