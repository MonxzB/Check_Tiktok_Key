-- ============================================================
-- 015_fix_rls_tiktok_channels.sql
-- Fix 403 Forbidden: POST /rest/v1/tiktok_channels
--
-- Root cause: "FOR ALL USING(...)" policy blocks INSERT in some Supabase
-- versions because USING is evaluated before WITH CHECK on inserts.
-- Fix: split into explicit per-operation policies + GRANT to authenticated.
--
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Drop the combined policy
DROP POLICY IF EXISTS "tiktok_channels_owner_all" ON public.tiktok_channels;
DROP POLICY IF EXISTS "tiktok_channels_owner_all" ON tiktok_channels;

-- 2. Ensure RLS stays enabled
ALTER TABLE public.tiktok_channels ENABLE ROW LEVEL SECURITY;

-- 3. Separate policies per operation
CREATE POLICY "tc_owner_select"
  ON public.tiktok_channels
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tc_owner_insert"
  ON public.tiktok_channels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tc_owner_update"
  ON public.tiktok_channels
  FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tc_owner_delete"
  ON public.tiktok_channels
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Grant table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiktok_channels TO authenticated;

-- ── Also fix credential_access_log (same pattern) ────────────
DROP POLICY IF EXISTS "credential_access_log_owner_all" ON public.credential_access_log;

ALTER TABLE public.credential_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cal_owner_select"
  ON public.credential_access_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cal_owner_insert"
  ON public.credential_access_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.credential_access_log TO authenticated;
