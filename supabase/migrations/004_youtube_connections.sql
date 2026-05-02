-- ============================================================
-- Phase 9 Migration: YouTube OAuth Channel Connections
-- Run after 003_competitor_tracker.sql
-- ============================================================

create table if not exists user_youtube_connections (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  channel_id        text not null,
  channel_title     text not null,
  channel_thumb     text not null default '',
  subscriber_count  bigint not null default 0,
  refresh_token     text not null,
  access_token      text,
  token_expires_at  timestamptz,
  connected_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table user_youtube_connections enable row level security;

create policy "Users manage own YT connection" on user_youtube_connections
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
