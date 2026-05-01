-- ============================================================
-- Phase 7 Migration: Competitor Channel Tracker
-- Run after 001_workspaces.sql and 002_snapshots.sql
-- ============================================================

-- ── 1. Tracked channels ───────────────────────────────────────
create table if not exists tracked_channels (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,

  channel_id      text not null,
  channel_title   text not null default '',
  channel_url     text not null default '',
  sub_count       bigint not null default 0,
  video_count     integer not null default 0,
  last_refresh_at timestamptz,
  created_at      timestamptz not null default now(),

  unique(workspace_id, channel_id)
);

alter table tracked_channels enable row level security;
create policy "Users manage own tracked channels" on tracked_channels
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tracked_channels_workspace
  on tracked_channels(workspace_id);

-- ── 2. Channel videos (cached recent videos per tracked channel)
create table if not exists channel_videos (
  id              uuid primary key default gen_random_uuid(),
  tracked_channel_id uuid references tracked_channels(id) on delete cascade not null,
  workspace_id    uuid references workspaces(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,

  video_id        text not null,
  channel_id      text not null,
  title           text not null default '',
  published_at    timestamptz not null,
  view_count      bigint not null default 0,
  duration_sec    integer not null default 0,
  thumbnail_url   text not null default '',
  video_url       text not null default '',

  created_at      timestamptz not null default now(),
  unique(tracked_channel_id, video_id)
);

alter table channel_videos enable row level security;
create policy "Users manage own channel videos" on channel_videos
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists channel_videos_workspace_time
  on channel_videos(workspace_id, published_at desc);

create index if not exists channel_videos_tracked
  on channel_videos(tracked_channel_id, published_at desc);
