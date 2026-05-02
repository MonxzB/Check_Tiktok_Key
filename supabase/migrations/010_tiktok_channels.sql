-- 010_tiktok_channels.sql — TikTok Channel Manager (Phase 18)
-- Stores TikTok account metadata + encrypted credentials (zero-knowledge).
-- Credentials are AES-256-GCM encrypted on the CLIENT before being stored.
-- The server/Supabase only ever sees ciphertext + IV — never plaintext.

-- ── Helper: auto-update updated_at (reuse function from migration 001) ──────
-- (Function update_updated_at_column already exists from 001_workspaces.sql)

CREATE TABLE IF NOT EXISTS tiktok_channels (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

  -- ── Identity (plaintext, non-sensitive) ──────────────────────────
  channel_name TEXT NOT NULL,
  username     TEXT NOT NULL,           -- @handle
  channel_url  TEXT NOT NULL,
  channel_id   TEXT,                    -- TikTok internal ID
  uuid         TEXT,                    -- TikTok UUID field

  -- ── Targeting ────────────────────────────────────────────────────
  target_keywords TEXT[]  DEFAULT '{}',
  niche           TEXT,
  language        TEXT CHECK (language IN ('ja','ko','en','vi','other')),
  region_country  TEXT,                 -- ISO 3166-1 alpha-2

  -- ── Status & Health ──────────────────────────────────────────────
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active','warming_up','warning','shadowbanned','banned','paused','archived'
  )),
  health_score      INTEGER CHECK (health_score BETWEEN 0 AND 100),
  last_post_at      TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  posting_frequency TEXT,               -- 'daily','3x_week','weekly','irregular'

  -- ── Metrics (manual or scraped update) ───────────────────────────
  followers_count  INTEGER     DEFAULT 0,
  following_count  INTEGER     DEFAULT 0,
  videos_count     INTEGER     DEFAULT 0,
  total_likes      INTEGER     DEFAULT 0,
  avg_views        INTEGER     DEFAULT 0,
  engagement_rate  NUMERIC(5,2),
  metrics_updated_at TIMESTAMPTZ,

  -- ── Account info (non-sensitive) ─────────────────────────────────
  account_created_at DATE,
  is_monetized       BOOLEAN DEFAULT false,
  is_creator_fund    BOOLEAN DEFAULT false,

  -- ── Encrypted credentials (ciphertext JSON: {ciphertext, iv}) ────
  -- All values are AES-256-GCM encrypted on client before insert.
  -- Format stored: JSON string '{"ciphertext":"<base64>","iv":"<base64>"}'
  encrypted_email           TEXT,
  encrypted_secondary_email TEXT,
  encrypted_password        TEXT,
  encrypted_token           TEXT,
  encrypted_cookie          TEXT,
  encrypted_recovery_codes  TEXT,       -- JSON array, then encrypted
  encrypted_phone           TEXT,
  encryption_method TEXT DEFAULT 'aes-256-gcm-pbkdf2',

  -- ── Technical / Anti-detect ──────────────────────────────────────
  proxy_url          TEXT,
  proxy_country      TEXT,
  device_fingerprint TEXT,
  user_agent         TEXT,

  -- ── Organization ─────────────────────────────────────────────────
  tags        TEXT[] DEFAULT '{}',
  notes       TEXT,
  owner_label TEXT,
  priority    INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_channels_user_status  ON tiktok_channels(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tiktok_channels_workspace     ON tiktok_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_channels_last_post     ON tiktok_channels(last_post_at DESC NULLS LAST);

ALTER TABLE tiktok_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tiktok_channels_owner_all" ON tiktok_channels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_tiktok_channels_updated_at
  BEFORE UPDATE ON tiktok_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
