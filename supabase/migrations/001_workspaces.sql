-- ============================================================
-- Phase 2 Migration: Workspaces + Keywords + RLS
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → paste & Run
-- ============================================================

-- ── 1. Workspaces ────────────────────────────────────────────
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  niche       text,
  color       text not null default '#00e5ff',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only one default workspace per user
create unique index if not exists workspaces_user_default
  on workspaces(user_id) where is_default = true;

-- ── 2. Keywords (per workspace) ───────────────────────────────
create table if not exists keywords (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,

  -- Identity
  keyword         text not null,
  vi              text not null default '',
  niche           text not null default '',
  level           text not null default 'Mid-tail',

  -- 8 score dimensions
  demand          integer not null default 0,
  search_intent   integer not null default 0,
  topic_depth     integer not null default 0,
  small_channel   integer not null default 0,
  evergreen       integer not null default 0,
  series_potential integer not null default 0,
  long_tail_exp   integer not null default 0,
  low_risk        integer not null default 0,
  long_form_score integer not null default 0,

  -- Derived
  recommendation  text not null default '',
  reason          text not null default '',
  chapters        jsonb not null default '[]',
  suggested_titles jsonb not null default '[]',
  sub_keywords    jsonb not null default '[]',

  -- YouTube API data (nullable until analyzed)
  api_data        jsonb,
  metadata        jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(workspace_id, keyword)
);

-- ── 3. Row Level Security ────────────────────────────────────
alter table workspaces enable row level security;
alter table keywords    enable row level security;

-- Workspaces: users only see/modify their own
create policy "workspaces: user owns" on workspaces
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keywords: users only see/modify their own
create policy "keywords: user owns" on keywords
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 4. Auto-update updated_at ────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at();

create trigger keywords_updated_at
  before update on keywords
  for each row execute function update_updated_at();
