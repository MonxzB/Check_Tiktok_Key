// ============================================================
// hooks/useYoutubeConnection.ts — Phase 9: OAuth YouTube state
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';
import type { MyVideo } from '../engine/gapAnalysis.ts';

export interface YTConnection {
  channelId: string;
  channelTitle: string;
  channelThumb: string;
  subscriberCount: number;
  connectedAt: string;
}

export interface UseYoutubeConnectionReturn {
  connection: YTConnection | null;
  myVideos: MyVideo[];
  loading: boolean;
  connecting: boolean;
  fetchingVideos: boolean;
  oauthConfigured: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchMyVideos: (max?: number) => Promise<void>;
}

export function useYoutubeConnection(userId: string | null): UseYoutubeConnectionReturn {
  const [connection, setConnection] = useState<YTConnection | null>(null);
  const [myVideos, setMyVideos]     = useState<MyVideo[]>([]);
  const [loading, setLoading]       = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [fetchingVideos, setFetchingVideos] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);

  // Check server OAuth config
  useEffect(() => {
    fetch('/api/oauth/youtube/status')
      .then(r => r.json())
      .then((d: { configured?: boolean }) => setOauthConfigured(d.configured ?? false))
      .catch(() => {});
  }, []);

  // Load existing connection from Supabase
  useEffect(() => {
    if (!userId) { setConnection(null); setMyVideos([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_youtube_connections')
        .select('channel_id,channel_title,channel_thumb,subscriber_count,connected_at')
        .eq('user_id', userId)
        .single();
      if (data) {
        setConnection({
          channelId:       (data as Record<string, unknown>).channel_id as string,
          channelTitle:    (data as Record<string, unknown>).channel_title as string,
          channelThumb:    (data as Record<string, unknown>).channel_thumb as string,
          subscriberCount: (data as Record<string, unknown>).subscriber_count as number,
          connectedAt:     (data as Record<string, unknown>).connected_at as string,
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  // Handle OAuth redirect back (?yt_oauth=success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('yt_oauth');
    if (!status || !userId) return;
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    if (status === 'success') {
      // Reload connection from DB
      supabase
        .from('user_youtube_connections')
        .select('channel_id,channel_title,channel_thumb,subscriber_count,connected_at')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => {
          if (data) {
            setConnection({
              channelId:       (data as Record<string, unknown>).channel_id as string,
              channelTitle:    (data as Record<string, unknown>).channel_title as string,
              channelThumb:    (data as Record<string, unknown>).channel_thumb as string,
              subscriberCount: (data as Record<string, unknown>).subscriber_count as number,
              connectedAt:     (data as Record<string, unknown>).connected_at as string,
            });
          }
        });
    }
  }, [userId]);

  // ── connect ────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!userId) return;
    setConnecting(true);
    try {
      const res = await fetch(`/api/oauth/youtube/auth-url?user_id=${encodeURIComponent(userId)}`);
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('[YT OAuth] connect failed:', (err as Error).message);
    } finally {
      setConnecting(false);
    }
  }, [userId]);

  // ── disconnect ─────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('user_youtube_connections')
      .select('access_token')
      .eq('user_id', userId)
      .single();
    await fetch('/api/oauth/youtube/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, access_token: (data as Record<string, unknown>)?.access_token }),
    });
    setConnection(null);
    setMyVideos([]);
  }, [userId]);

  // ── fetchMyVideos ──────────────────────────────────────────
  const fetchMyVideos = useCallback(async (max = 50) => {
    if (!userId || !connection) return;
    setFetchingVideos(true);
    try {
      const res = await fetch(`/api/oauth/youtube/videos?user_id=${encodeURIComponent(userId)}&max=${max}`);
      const { videos, error } = await res.json() as { videos?: MyVideo[]; error?: string };
      if (error) throw new Error(error);
      setMyVideos(videos ?? []);
    } catch (err) {
      console.error('[YT OAuth] fetchMyVideos failed:', (err as Error).message);
    } finally {
      setFetchingVideos(false);
    }
  }, [userId, connection]);

  return { connection, myVideos, loading, connecting, fetchingVideos, oauthConfigured, connect, disconnect, fetchMyVideos };
}
