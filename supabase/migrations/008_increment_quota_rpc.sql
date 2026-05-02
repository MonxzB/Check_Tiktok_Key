-- ============================================================
-- Migration 008: increment_quota RPC function
-- Task 1.3: Atomic quota increment to prevent race conditions
--
-- This RPC is called by quotaTracker.ts instead of a plain UPDATE,
-- guaranteeing atomicity when two devices call simultaneously.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_quota(
  p_api_key_hash TEXT,
  p_units        INTEGER
)
RETURNS INTEGER   -- returns the NEW total units_used for that day
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as table owner, bypasses RLS for the update
AS $$
DECLARE
  v_units INTEGER;
BEGIN
  INSERT INTO youtube_quota_usage (user_id, api_key_hash, date, units_used, last_request_at)
  VALUES (auth.uid(), p_api_key_hash, CURRENT_DATE, p_units, NOW())
  ON CONFLICT (user_id, api_key_hash, date)
  DO UPDATE SET
    units_used      = youtube_quota_usage.units_used + EXCLUDED.units_used,
    last_request_at = NOW()
  RETURNING units_used INTO v_units;

  RETURN v_units;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION increment_quota(TEXT, INTEGER) TO authenticated;

-- ── Read helper (used by quotaTracker.getUsage) ──────────────
CREATE OR REPLACE FUNCTION get_quota_usage(p_api_key_hash TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(units_used, 0)
  FROM youtube_quota_usage
  WHERE user_id       = auth.uid()
    AND api_key_hash  = p_api_key_hash
    AND date          = CURRENT_DATE;
$$;

GRANT EXECUTE ON FUNCTION get_quota_usage(TEXT) TO authenticated;
