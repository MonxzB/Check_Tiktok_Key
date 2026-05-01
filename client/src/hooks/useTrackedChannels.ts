// ============================================================
// hooks/useTrackedChannels.ts — Phase 7: Competitor tracker
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import type { Keyword } from '../types';

export interface TrackedChannel {
  id: string;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  subCount: number;
  videoCount: number;
  lastRefreshAt: string | null;
  createdAt: string;
}

export interface ChannelVideo {
  channelId: string;
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  durationSec: number;
  thumbnailUrl: string;
  videoUrl: string;
  /** matched keywords from workspace */
  matchedKeywords?: string[];
}

// ── Smart matching ────────────────────────────────────────────
function matchVideoToKeywords(videoTitle: string, keywords: Keyword[]): string[] {
  const titleLower = videoTitle.toLowerCase();
  return keywords
    .filter(kw => {
      const tokens = kw.keyword.split(/\s+/).filter(t => t.length >= 2);
      return tokens.some(token => titleLower.includes(token.toLowerCase()));
    })
    .map(kw => kw.keyword);
}

export interface UseTrackedChannelsReturn {
  channels: TrackedChannel[];
  videos: ChannelVideo[];
  loading: boolean;
  refreshing: boolean;
  addChannel: (ch: Omit<TrackedChannel, 'id' | 'videoCount' | 'lastRefreshAt' | 'createdAt'>) => Promise<void>;
  removeChannel: (id: string) => Promise<void>;
  refreshAll: (apiKeys: string[], keywords: Keyword[]) => Promise<void>;
  refreshOne: (channelId: string, apiKeys: string[], keywords: Keyword[]) => Promise<void>;
  isTracked: (channelId: string) => boolean;
}

export function useTrackedChannels(workspaceId: string | null): UseTrackedChannelsReturn {
  const [channels, setChannels] = useState<TrackedChannel[]>([]);
  const [videos, setVideos]     = useState<ChannelVideo[]>([]);
  const [loading, setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load from Supabase ───────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) { setChannels([]); setVideos([]); return; }
    (async () => {
      setLoading(true);
      const { data: chData } = await supabase
        .from('tracked_channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });
      const mapped: TrackedChannel[] = (chData ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        channelId: r.channel_id as string,
        channelTitle: r.channel_title as string,
        channelUrl: r.channel_url as string,
        subCount: r.sub_count as number,
        videoCount: r.video_count as number,
        lastRefreshAt: r.last_refresh_at as string | null,
        createdAt: r.created_at as string,
      }));
      setChannels(mapped);

      // Load cached videos
      if (mapped.length > 0) {
        const trackedIds = mapped.map(c => c.id);
        const { data: vData } = await supabase
          .from('channel_videos')
          .select('*')
          .in('tracked_channel_id', trackedIds)
          .order('published_at', { ascending: false })
          .limit(200);
        setVideos((vData ?? []).map((v: Record<string, unknown>) => ({
          channelId: v.channel_id as string,
          videoId: v.video_id as string,
          title: v.title as string,
          publishedAt: v.published_at as string,
          viewCount: v.view_count as number,
          durationSec: v.duration_sec as number,
          thumbnailUrl: v.thumbnail_url as string,
          videoUrl: v.video_url as string,
        })));
      }
      setLoading(false);
    })();
  }, [workspaceId]);

  // ── addChannel ───────────────────────────────────────────────
  const addChannel = useCallback(async (ch: Omit<TrackedChannel, 'id' | 'videoCount' | 'lastRefreshAt' | 'createdAt'>) => {
    if (!workspaceId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('tracked_channels')
      .upsert({
        workspace_id: workspaceId,
        user_id: user.id,
        channel_id: ch.channelId,
        channel_title: ch.channelTitle,
        channel_url: ch.channelUrl,
        sub_count: ch.subCount,
        video_count: 0,
      }, { onConflict: 'workspace_id,channel_id', ignoreDuplicates: false })
      .select()
      .single();
    if (error) throw error;
    const newCh: TrackedChannel = {
      id: (data as Record<string, unknown>).id as string,
      channelId: ch.channelId,
      channelTitle: ch.channelTitle,
      channelUrl: ch.channelUrl,
      subCount: ch.subCount,
      videoCount: 0,
      lastRefreshAt: null,
      createdAt: (data as Record<string, unknown>).created_at as string,
    };
    setChannels(prev => [...prev.filter(c => c.channelId !== ch.channelId), newCh]);
  }, [workspaceId]);

  // ── removeChannel ────────────────────────────────────────────
  const removeChannel = useCallback(async (id: string) => {
    await supabase.from('tracked_channels').delete().eq('id', id);
    setChannels(prev => prev.filter(c => c.id !== id));
    setVideos(prev => {
      const remaining = channels.filter(c => c.id !== id).map(c => c.channelId);
      return prev.filter(v => remaining.includes(v.channelId));
    });
  }, [channels]);

  // ── fetchVideosFromServer ────────────────────────────────────
  async function fetchFromServer(channelIds: string[], apiKeys: string[]): Promise<ChannelVideo[]> {
    const res = await fetch('/api/youtube/channel-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelIds, apiKeys, maxPerChannel: 10 }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const { videos } = await res.json() as { videos: ChannelVideo[] };
    return videos;
  }

  // ── refreshAll ───────────────────────────────────────────────
  const refreshAll = useCallback(async (apiKeys: string[], keywords: Keyword[]) => {
    if (!workspaceId || !channels.length) return;
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channelIds = channels.map(c => c.channelId);
      const fresh = await fetchFromServer(channelIds, apiKeys);

      // Match keywords
      const withMatches = fresh.map(v => ({
        ...v,
        matchedKeywords: matchVideoToKeywords(v.title, keywords),
      }));

      // Upsert to DB
      for (const v of fresh) {
        const ch = channels.find(c => c.channelId === v.channelId);
        if (!ch) continue;
        await supabase.from('channel_videos').upsert({
          tracked_channel_id: ch.id,
          workspace_id: workspaceId,
          user_id: user.id,
          video_id: v.videoId,
          channel_id: v.channelId,
          title: v.title,
          published_at: v.publishedAt,
          view_count: v.viewCount,
          duration_sec: v.durationSec,
          thumbnail_url: v.thumbnailUrl,
          video_url: v.videoUrl,
        }, { onConflict: 'tracked_channel_id,video_id', ignoreDuplicates: false });
        // Update last_refresh_at
        await supabase.from('tracked_channels')
          .update({ last_refresh_at: new Date().toISOString() })
          .eq('id', ch.id);
      }
      setVideos(withMatches);
      setChannels(prev => prev.map(c => ({ ...c, lastRefreshAt: new Date().toISOString() })));
    } finally {
      setRefreshing(false);
    }
  }, [workspaceId, channels]);

  // ── refreshOne ───────────────────────────────────────────────
  const refreshOne = useCallback(async (channelId: string, apiKeys: string[], keywords: Keyword[]) => {
    const ch = channels.find(c => c.channelId === channelId);
    if (!ch || !workspaceId) return;
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fresh = await fetchFromServer([channelId], apiKeys);
      const withMatches = fresh.map(v => ({ ...v, matchedKeywords: matchVideoToKeywords(v.title, keywords) }));
      for (const v of fresh) {
        await supabase.from('channel_videos').upsert({
          tracked_channel_id: ch.id, workspace_id: workspaceId, user_id: user.id,
          video_id: v.videoId, channel_id: v.channelId, title: v.title,
          published_at: v.publishedAt, view_count: v.viewCount, duration_sec: v.durationSec,
          thumbnail_url: v.thumbnailUrl, video_url: v.videoUrl,
        }, { onConflict: 'tracked_channel_id,video_id', ignoreDuplicates: false });
      }
      await supabase.from('tracked_channels').update({ last_refresh_at: new Date().toISOString() }).eq('id', ch.id);
      setVideos(prev => {
        const others = prev.filter(v => v.channelId !== channelId);
        return [...withMatches, ...others].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      });
      setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, lastRefreshAt: new Date().toISOString() } : c));
    } finally {
      setRefreshing(false);
    }
  }, [workspaceId, channels]);

  const isTracked = useCallback((channelId: string) => channels.some(c => c.channelId === channelId), [channels]);

  return { channels, videos, loading, refreshing, addChannel, removeChannel, refreshAll, refreshOne, isTracked };
}
