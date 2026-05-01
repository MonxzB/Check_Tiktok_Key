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
  const m = Math.floor(sec / 60);
  const s = sec % 60;
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

  // ── Filtered videos ──────────────────────────────────────────
  const filteredVideos = useMemo(() => {
    const cutoff = Date.now() - filter.days * 86_400_000;
    return videos.filter(v => {
      if (filter.channelId && v.channelId !== filter.channelId) return false;
      if (filter.days && new Date(v.publishedAt).getTime() < cutoff) return false;
      return true;
    });
  }, [videos, filter]);

  // ── Empty state ──────────────────────────────────────────────
  if (!channels.length && !loading) {
    return (
      <section className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
        <h3 style={{ margin: '0 0 8px' }}>Chưa có kênh đang theo dõi</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Trong tab YouTube Research → bảng kênh → bấm "⭐ Track" để thêm kênh vào đây.
        </p>
      </section>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Section 1: Tracked channels ────────────────────────── */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>
            <span className="icon">👥</span> Kênh đang theo dõi
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>({channels.length})</span>
          </h2>
          <button
            className="btn btn-primary"
            style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => refreshAll(apiKeys, keywords)}
            disabled={refreshing || !apiKeys.length}
            title={!apiKeys.length ? 'Thêm API Key trong Cài đặt' : ''}
          >
            {refreshing
              ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang tải...</>
              : '🔄 Refresh all'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ width: 20, height: 20 }} />
          </div>
        )}

        {!loading && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Kênh</th>
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
                        style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                        {ch.channelTitle}
                      </a>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatNum(ch.subCount)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{ch.videoCount || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {ch.lastRefreshAt ? timeAgo(ch.lastRefreshAt) : 'Chưa refresh'}
                    </td>
                    <td style={{ display: 'flex', gap: 6, padding: '6px 10px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                        onClick={() => refreshOne(ch.channelId, apiKeys, keywords)}
                        disabled={refreshing || !apiKeys.length}
                      >
                        🔄
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.72rem', color: 'var(--red)' }}
                        onClick={() => { if (confirm(`Untrack "${ch.channelTitle}"?`)) removeChannel(ch.id); }}
                      >
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

      {/* ── Section 2: Recent videos timeline ──────────────────── */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0 }}>
            <span className="icon">🎬</span> Video gần đây
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>({filteredVideos.length})</span>
          </h2>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={filter.channelId}
              onChange={e => setFilter(f => ({ ...f, channelId: e.target.value }))}
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', padding: '5px 10px', borderRadius: 8, fontSize: '0.8rem' }}
            >
              <option value="">Tất cả kênh</option>
              {channels.map(ch => <option key={ch.channelId} value={ch.channelId}>{ch.channelTitle}</option>)}
            </select>
            <select
              value={filter.days}
              onChange={e => setFilter(f => ({ ...f, days: parseInt(e.target.value) }))}
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', padding: '5px 10px', borderRadius: 8, fontSize: '0.8rem' }}
            >
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
              <option value={999999}>Tất cả</option>
            </select>
          </div>
        </div>

        {filteredVideos.length === 0 && !refreshing && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <p>Chưa có video. Bấm "🔄 Refresh all" để tải video mới.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredVideos.map(v => (
            <VideoCard key={v.videoId} video={v} channels={channels} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Video Card ───────────────────────────────────────────────
function VideoCard({ video, channels }: { video: ChannelVideo; channels: TrackedChannel[] }) {
  const ch = channels.find(c => c.channelId === video.channelId);
  const hasMatches = (video.matchedKeywords?.length ?? 0) > 0;

  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        background: hasMatches ? 'rgba(0,229,255,0.04)' : 'var(--glass)',
        border: hasMatches ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--glass-border)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111' }}>
          {video.thumbnailUrl && (
            <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {video.durationSec > 0 && (
            <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.72rem', padding: '2px 5px', borderRadius: 4 }}>
              {formatDur(video.durationSec)}
            </span>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: '10px 12px' }}>
          <p className="jp-text" style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.title}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{ch?.channelTitle || video.channelId}</span>
            <span>{formatNum(video.viewCount)} views</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {timeAgo(video.publishedAt)}
          </div>
          {/* Keyword match badge */}
          {hasMatches && (
            <div style={{ marginTop: 8, padding: '4px 8px', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--accent)' }}>
              🎯 Liên quan: {video.matchedKeywords!.slice(0, 2).join(', ')}
              {video.matchedKeywords!.length > 2 && ` +${video.matchedKeywords!.length - 2}`}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
