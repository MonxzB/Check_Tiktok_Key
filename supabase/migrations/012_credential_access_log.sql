-- 012_credential_access_log.sql — Audit log for credential views (Phase 18)
-- Every time a user reveals a credential (password/token/cookie),
-- a row is appended here for audit/forensics purposes.
-- Users can only SELECT their own rows (no UPDATE/DELETE for integrity).

CREATE TABLE IF NOT EXISTS credential_access_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID        NOT NULL REFERENCES tiktok_channels(id) ON DELETE CASCADE,
  -- 'view_password' | 'view_token' | 'view_cookie' | 'view_recovery' | 'export' | 'edit'
  action     TEXT        NOT NULL,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_time
  ON credential_access_log (user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_channel
  ON credential_access_log (channel_id, accessed_at DESC);

ALTER TABLE credential_access_log ENABLE ROW LEVEL SECURITY;

-- Read-only: users can see their own log entries
CREATE POLICY "audit_log_owner_select" ON credential_access_log
  FOR SELECT USING (auth.uid() = user_id);

-- Insert only via application (no UPDATE/DELETE to preserve audit integrity)
CREATE POLICY "audit_log_owner_insert" ON credential_access_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
