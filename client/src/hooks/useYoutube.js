// ============================================================
// hooks/useYoutube.js — Long-form YouTube analysis hook
// ============================================================
import { useState, useCallback } from 'react';
import { exportRefVideosCSV, exportRefChannelsCSV, downloadBlob } from '../engine/csvUtils.js';
import { buildMetadata } from '../engine/dataMetadata.js';
import { recordAnalyzeCall } from '../engine/quotaTracker.js';

export function useYoutube(toast, updateApiData, settings) {
  const [refVideos, setRefVideos]         = useState([]);
  const [refChannels, setRefChannels]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [serverConfigured, setServerConfigured] = useState(null);
  const [lastKeyword, setLastKeyword]     = useState('');
  const [usedKeyIndex, setUsedKeyIndex]   = useState(null);

  const checkStatus = useCallback(async () => {
    const userKeys = settings?.apiKeys?.filter(k => k.trim()) ?? [];
    try {
      const res  = await fetch('/api/youtube/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: userKeys }),
      });
      const data = await res.json();
      setServerConfigured(data.configured);
      return data.configured;
    } catch {
      setServerConfigured(false);
      return false;
    }
  }, [settings?.apiKeys]);

  const analyzeKeyword = useCallback(async (keyword) => {
    if (!keyword) { toast('Vui lòng chọn keyword', 'error'); return; }

    const userKeys = (settings?.apiKeys ?? []).filter(k => k.trim());

    setLoading(true);
    setLastKeyword(keyword);
    try {
      const res = await fetch('/api/youtube/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          apiKeys: userKeys,
          minDurationMin: settings?.minDurationMin ?? 8,
          timeWindowDays: settings?.timeWindowDays ?? 180,
          maxResults: settings?.maxResults ?? 25,
          orderBy: settings?.orderBy ?? 'relevance',
          regionCode: settings?.regionCode ?? 'JP',
          languageCode: settings?.languageCode ?? 'ja',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const { videos, channels, summary, usedKeyIdx } = data;

      setRefVideos(videos || []);
      setRefChannels(channels || []);
      setUsedKeyIndex(usedKeyIdx ?? null);

      // Track quota for the key that was used
      if (usedKeyIdx != null && userKeys[usedKeyIdx]) {
        recordAnalyzeCall(userKeys[usedKeyIdx], videos?.length ?? 25, channels?.length ?? 10);
      }

      // Build metadata and update keyword's apiData
      const meta = buildMetadata({
        hasApiData: true,
        longVideoCount: summary?.longVideosFound ?? 0,
        hasChannelStats: channels?.length > 0,
        hasRecentVideos: videos?.some(v => {
          const days = (Date.now() - new Date(v.publishedAt)) / 86400000;
          return days <= 90;
        }),
        timeWindowDays: settings?.timeWindowDays ?? 180,
        regionCode: settings?.regionCode ?? 'JP',
        languageCode: settings?.languageCode ?? 'ja',
      });

      updateApiData(keyword, summary, meta);

      const count = videos?.length ?? 0;
      const keyLabel = usedKeyIdx != null ? ` (Key #${usedKeyIdx + 1})` : '';
      const msg = data.fromCache
        ? `Cache: ${count} video long-form tìm thấy`
        : `Đã phân tích xong — ${count} video long-form${keyLabel}`;
      toast(msg, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, updateApiData, settings]);

  const exportVideosCsv = useCallback(() => {
    if (!refVideos.length) { toast('Chưa có video nào để xuất', 'error'); return; }
    downloadBlob(exportRefVideosCSV(refVideos), 'youtube_ref_videos.csv');
    toast('Đã xuất CSV reference videos!', 'success');
  }, [refVideos, toast]);

  const exportChannelsCsv = useCallback(() => {
    if (!refChannels.length) { toast('Chưa có kênh nào để xuất', 'error'); return; }
    downloadBlob(exportRefChannelsCSV(refChannels), 'youtube_ref_channels.csv');
    toast('Đã xuất CSV reference channels!', 'success');
  }, [refChannels, toast]);

  const clearResults = useCallback(() => {
    setRefVideos([]);
    setRefChannels([]);
    setLastKeyword('');
  }, []);

  return {
    refVideos, refChannels, loading, serverConfigured, lastKeyword, usedKeyIndex,
    analyzeKeyword, exportVideosCsv, exportChannelsCsv, clearResults, checkStatus,
  };
}
