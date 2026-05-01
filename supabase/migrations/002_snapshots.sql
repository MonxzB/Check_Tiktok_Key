-- ============================================================
-- Phase 6 Migration: keyword_snapshots table for trend tracking
-- Run in Supabase SQL Editor after 001_workspaces.sql
-- ============================================================

create table if not exists keyword_snapshots (
  id              uuid primary key default gen_random_uuid(),
  keyword_id      uuid references keywords(id) on delete cascade not null,
  workspace_id    uuid references workspaces(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,

  -- Snapshot data
  long_form_score  integer not null default 0,
  avg_views        bigint  not null default 0,
  long_videos_found integer not null default 0,
  best_ratio       numeric(8,2) not null default 0,
  api_data         jsonb not null default '{}',

  captured_at      timestamptz not null default now()
);

-- Index for fast time-series queries
create index if not exists kw_snapshots_keyword_time
  on keyword_snapshots(keyword_id, captured_at desc);

create index if not exists kw_snapshots_workspace
  on keyword_snapshots(workspace_id, captured_at desc);

-- ── RLS ─────────────────────────────────────────────────────────
alter table keyword_snapshots enable row level security;

create policy "Users manage own snapshots" on keyword_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update: limit to 90 snapshots per keyword (keep most recent)
-- (handled in application layer to avoid heavy trigger overhead)
