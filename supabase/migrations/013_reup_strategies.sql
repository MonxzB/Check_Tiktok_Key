-- ============================================================
-- Phase 19 Migration: Reup Strategy Advisor
-- Run in Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → paste & Run
-- ============================================================

-- ── 1. Main table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reup_strategies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Video identification
  video_url           TEXT NOT NULL,
  video_id            TEXT NOT NULL,

  -- Video metadata (fetched from YouTube API)
  video_meta          JSONB,   -- VideoMeta object

  -- Generated strategies
  strategies          JSONB,   -- Strategy[] array
  generated_by        TEXT NOT NULL DEFAULT 'rules', -- 'rules' | 'llm' | 'hybrid'
  confidence          INT,     -- 0-100

  -- User selection
  selected_strategy_id TEXT,   -- ID of chosen strategy

  -- Feedback
  feedback_rating     INT CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_notes      TEXT,
  result_video_url    TEXT,    -- optional: link to final published video

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reup_strategies_workspace
  ON public.reup_strategies(workspace_id);

CREATE INDEX IF NOT EXISTS idx_reup_strategies_video
  ON public.reup_strategies(video_id);

CREATE INDEX IF NOT EXISTS idx_reup_strategies_user
  ON public.reup_strategies(user_id);

-- ── 3. Auto-update updated_at ─────────────────────────────────
-- Reuse existing update_updated_at() function from migration 001
CREATE TRIGGER reup_strategies_updated_at
  BEFORE UPDATE ON public.reup_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Row Level Security ─────────────────────────────────────
ALTER TABLE public.reup_strategies ENABLE ROW LEVEL SECURITY;

-- Users can only access strategies in their own workspaces
CREATE POLICY "reup_strategies: user owns"
  ON public.reup_strategies
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );
