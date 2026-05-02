import React, { useState, useMemo } from 'react';
import { formatNum } from './utils.ts';
import type { UseTrackedChannelsReturn, ChannelVideo, TrackedChannel } from '../hooks/useTrackedChannels.ts';
import type { Keyword } from '../types';
import type { ExtendedSettings } from '../hooks/useSettings.ts';

interface CompetitorTabProps {
  tracker: UseTrackedChannelsReturn;
  keywords: Keyword[];
  settings: ExtendedSettings;
}
type VideoFilter = { channelId: string; days: number };

function formatDur(sec: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  if (sec >= 3600) return `${Math.floor(sec/3600)}:${String(m % 60).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function CompetitorTab({ tracker, keywords, settings }: CompetitorTabProps) {
  const { channels, videos, loading, refreshing, removeChannel, refreshAll, refreshOne } = tracker;
  const [filter, setFilter] = useState<VideoFilter>({ channelId: '', days: 30 });

  const apiKeys = (settings?.apiKeys ?? []).filter((k: string) => k.trim());

  const filteredVideos = useMemo(() => {
    const cutoff = Date.now() - filter.days * 86_400_000;
    return videos.filter(v => {
      if (filter.channelId && v.channelId !== filter.channelId) return false;
      if (filter.days && new Date(v.publishedAt).getTime() < cutoff) return false;
      return true;
    });
  }, [videos, filter]);

  if (!channels.length && !loading) {
    return (
      <section className="card text-center py-12 px-6">
        <div className="text-5xl mb-3">👥</div>
        <h3 className="m-0 mb-2">Chưa có kênh đang theo dõi</h3>
        <p className="text-text-muted text-[0.88rem]">
          Trong tab YouTube Research → bảng kênh → bấm "⭐ Track" để thêm kênh vào đây.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Section 1: Tracked channels ─────────────────────── */}
      <section className="card">
        <div className="flex justify-between items-center mb-3.5">
          <h2 className="m-0">
            <span className="icon">👥</span> Kênh đang theo dõi
            <span className="text-[0.8rem] text-text-muted font-normal ml-2">({channels.length})</span>
          </h2>
          <button className="btn btn-primary flex items-center gap-1.5" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
            onClick={() => refreshAll(apiKeys, keywords)} disabled={refreshing || !apiKeys.length}
            title={!apiKeys.length ? 'Thêm API Key trong Cài đặt' : ''}>
            {refreshing ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang tải...</> : '🔄 Refresh all'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-5 text-text-muted">
            <span className="spinner" style={{ width: 20, height: 20 }} />
          </div>
        )}

        {!loading && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Kênh</th>
                  <th>Subscribers</th>
                  <th>Video count</th>
                  <th>Last refresh</th>
                  <th style={{ background: 'rgba(0,229,255,0.06)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(ch => (
                  <tr key={ch.id}>
                    <td>
                      <a href={ch.channelUrl} target="_blank" rel="noreferrer"
                        className="text-accent font-semibold no-underline">{ch.channelTitle}</a>
                    </td>
                    <td className="text-text-secondary">{formatNum(ch.subCount)}</td>
                    <td className="text-text-secondary">{ch.videoCount || '—'}</td>
                    <td className="text-[0.78rem] text-text-muted">
                      {ch.lastRefreshAt ? timeAgo(ch.lastRefreshAt) : 'Chưa refresh'}
                    </td>
                    <td className="flex gap-1.5 py-1.5 px-2.5">
                      <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                        onClick={() => refreshOne(ch.channelId, apiKeys, keywords)}
                        disabled={refreshing || !apiKeys.length}>🔄</button>
                      <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem', color: '#ff1744' }}
                        onClick={() => { if (confirm(`Untrack "${ch.channelTitle}"?`)) removeChannel(ch.id); }}>
                        Untrack
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Section 2: Recent videos ──────────────────────────── */}
      <section className="card">
        <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2.5">
          <h2 className="m-0">
            <span className="icon">🎬</span> Video gần đây
            <span className="text-[0.8rem] text-text-muted font-normal ml-2">({filteredVideos.length})</span>
          </h2>
          <div className="flex gap-2 items-center flex-wrap">
            <select value={filter.channelId} onChange={e => setFilter(f => ({ ...f, channelId: e.target.value }))}
              className="text-[0.8rem]" style={{ padding: '5px 10px' }}>
              <option value="">Tất cả kênh</option>
              {channels.map(ch => <option key={ch.channelId} value={ch.channelId}>{ch.channelTitle}</option>)}
            </select>
            <select value={filter.days} onChange={e => setFilter(f => ({ ...f, days: parseInt(e.target.value) }))}
              className="text-[0.8rem]" style={{ padding: '5px 10px' }}>
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
              <option value={999999}>Tất cả</option>
            </select>
          </div>
        </div>

        {filteredVideos.length === 0 && !refreshing && (
          <div className="text-center py-8 text-text-muted text-[0.88rem]">
            <p>Chưa có video. Bấm "🔄 Refresh all" để tải video mới.</p>
          </div>
        )}

        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
          {filteredVideos.map(v => <VideoCard key={v.videoId} video={v} channels={channels} />)}
        </div>
      </section>
    </div>
  );
}

// ── Video Card ───────────────────────────────────────────────
function VideoCard({ video, channels }: { video: ChannelVideo; channels: TrackedChannel[] }) {
  const ch         = channels.find(c => c.channelId === video.channelId);
  const hasMatches = (video.matchedKeywords?.length ?? 0) > 0;

  return (
    <a href={video.videoUrl} target="_blank" rel="noreferrer" className="no-underline block">
      <div className="rounded-[10px] overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
        style={{
          background: hasMatches ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.04)',
          border: hasMatches ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
        }}>
        {/* Thumbnail */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          {video.thumbnailUrl && (
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
          )}
          {video.durationSec > 0 && (
            <span className="absolute bottom-1.5 right-1.5 text-white text-[0.72rem] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.8)' }}>
              {formatDur(video.durationSec)}
            </span>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="jp-text m-0 text-[0.84rem] font-semibold leading-snug overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {video.title}
          </p>
          <div className="flex justify-between mt-1.5 text-[0.72rem] text-text-muted">
            <span className="text-accent font-medium">{ch?.channelTitle || video.channelId}</span>
            <span>{formatNum(video.viewCount)} views</span>
          </div>
          <div className="text-[0.7rem] text-text-muted mt-0.5">{timeAgo(video.publishedAt)}</div>
          {hasMatches && (
            <div className="mt-2 px-2 py-1 rounded-md text-[0.7rem] text-accent"
              style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
              🎯 Liên quan: {video.matchedKeywords!.slice(0,2).join(', ')}
              {video.matchedKeywords!.length > 2 && ` +${video.matchedKeywords!.length - 2}`}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
