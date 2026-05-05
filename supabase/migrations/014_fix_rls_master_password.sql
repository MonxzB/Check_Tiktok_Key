-- ============================================================
-- 014_fix_rls_master_password.sql
-- Fix: "new row violates row-level security policy for table user_master_password"
--
-- Root cause: FOR ALL policy's USING clause is evaluated for INSERT in some
-- Postgres/Supabase versions, causing failure when no existing row matches.
-- Fix: split into separate SELECT / INSERT / UPDATE / DELETE policies,
--      and ensure the table is properly accessible to the authenticated role.
--
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Drop existing combined policy (may have been created without public. prefix)
DROP POLICY IF EXISTS "master_password_owner_all" ON public.user_master_password;
DROP POLICY IF EXISTS "master_password_owner_all" ON user_master_password;

-- 2. Ensure RLS is enabled
ALTER TABLE public.user_master_password ENABLE ROW LEVEL SECURITY;

-- 3. Recreate as separate policies (more explicit, avoids USING-on-INSERT issue)
CREATE POLICY "mp_owner_select"
  ON public.user_master_password
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mp_owner_insert"
  ON public.user_master_password
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mp_owner_update"
  ON public.user_master_password
  FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mp_owner_delete"
  ON public.user_master_password
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Grant table-level permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_master_password TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
