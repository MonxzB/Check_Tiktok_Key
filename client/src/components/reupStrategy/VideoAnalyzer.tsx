// ============================================================
// components/reupStrategy/VideoAnalyzer.tsx — Phase 19
// URL input + video metadata display after fetch
// ============================================================
import React from 'react';
import type { VideoMeta } from '../../lib/reupAdvisor/strategyTypes.ts';

interface Props {
  url: string;
  onChange: (url: string) => void;
  onAnalyze: () => void;
  onDeepAnalyze: () => void;
  loading: boolean;
  deepLoading: boolean;
  videoMeta: VideoMeta | null;
  error: string | null;
  hasGeminiKey: boolean;  // from server status
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoAnalyzer({
  url, onChange, onAnalyze, onDeepAnalyze,
  loading, deepLoading, videoMeta, error, hasGeminiKey,
}: Props) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !loading) onAnalyze();
  }

  return (
    <div>
      {/* URL Input row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
        <div style={{ flex: '1 1 320px' }}>
          <label className="tw-label" htmlFor="reup-url-input">Link YouTube</label>
          <input
            id="reup-url-input"
            type="url"
            className="field-input"
            placeholder="https://www.youtube.com/watch?v=... hoặc youtu.be/..."
            value={url}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || deepLoading}
            autoComplete="off"
            spellCheck={false}
            aria-label="Nhập link YouTube để phân tích"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={onAnalyze}
          disabled={loading || deepLoading || !url.trim()}
          style={{ whiteSpace: 'nowrap' }}
          aria-label="Quick Analyze"
        >
          {loading
            ? <><span className="spinner" /> Đang phân tích...</>
            : '⚡ Quick Analyze'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onDeepAnalyze}
          disabled={loading || deepLoading || !videoMeta}
          title={!hasGeminiKey ? 'Cần thêm GEMINI_API_KEY vào Vercel để dùng Deep Analyze' : 'Phân tích sâu bằng Gemini AI'}
          style={{ whiteSpace: 'nowrap', ...((!hasGeminiKey) ? { opacity: 0.5 } : {}) }}
          aria-label="Deep Analyze với Gemini AI"
        >
          {deepLoading
            ? <><span className="spinner" /> Gemini đang phân tích...</>
            : '🤖 Deep Analyze'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)',
          borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: 'var(--red)', marginBottom: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Video meta preview */}
      {videoMeta && !loading && (
        <div style={{
          background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 4,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${videoMeta.videoId}/mqdefault.jpg`}
              alt={videoMeta.title}
              style={{ width: 96, height: 54, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoMeta.title}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>⏱ <strong style={{ color: 'var(--accent)' }}>{fmtDuration(videoMeta.duration)}</strong></span>
                <span>👁 <strong>{fmtNum(videoMeta.viewCount)}</strong></span>
                <span>📺 <strong>{fmtNum(videoMeta.channelSubs)}</strong> subs</span>
                <span>🏷 {videoMeta.category}</span>
                {videoMeta.isOfficialArtist && (
                  <span style={{ color: 'var(--orange)' }}>⚠️ Official Artist</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deep analyze note */}
      {videoMeta && !hasGeminiKey && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
          💡 Thêm <code>GEMINI_API_KEY</code> vào Vercel Environment Variables để dùng Deep Analyze (~$0.00008/lần)
        </div>
      )}
    </div>
  );
}
