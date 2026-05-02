-- ============================================================
-- Phase 10 Migration: Keyword Feedback for Personalized Scoring
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists keyword_feedbacks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id   uuid references workspaces(id) on delete cascade,
  keyword        text not null,
  -- Whether user made a video
  made_video     boolean not null default false,
  -- Performance rating
  performance    text check (performance in ('great', 'good', 'bad', 'flopped')) null,
  -- Actual view count
  actual_views   bigint null,
  -- Free-form notes
  notes          text null,
  -- Keyword score dimensions at time of feedback (for ML correlation)
  score_demand          smallint,
  score_search_intent   smallint,
  score_topic_depth     smallint,
  score_small_channel   smallint,
  score_evergreen       smallint,
  score_series_potential smallint,
  score_long_tail_exp   smallint,
  score_low_risk        smallint,
  score_total           smallint,
  -- Timestamps
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One feedback per keyword per user
  unique(user_id, keyword)
);

alter table keyword_feedbacks enable row level security;

create policy "Users manage own feedback" on keyword_feedbacks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists keyword_feedbacks_user_id_idx on keyword_feedbacks(user_id);
