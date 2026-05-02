// ============================================================
// components/TrendingKeywordsModal.tsx — Phase 17
// Shows top-10 trending YouTube keywords on first session load
// ============================================================
import React, { useCallback } from 'react';
import type { TrendingKeyword, Keyword } from '../types';
import type { TrendingStatus } from '../hooks/useTrendingKeywords';

const REGION_FLAG: Record<string, string> = {
  JP: '🇯🇵', KR: '🇰🇷', US: '🇺🇸', VN: '🇻🇳', GB: '🇬🇧', AU: '🇦🇺',
};
const LANG_LABEL: Record<string, string> = {
  ja: '日本語', ko: '한국어', en: 'English', vi: 'Tiếng Việt',
};

interface Props {
  visible: boolean;
  status: TrendingStatus;
  keywords: TrendingKeyword[];
  error: string | null;
  fromCache: boolean;
  regionCode: string;
  language: string;
  canRefresh: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onAddKeyword: (kw: TrendingKeyword) => void;
  onAnalyzeKeyword: (keyword: string) => void;
  onDisablePermanently: () => void;
}

export default function TrendingKeywordsModal({
  visible, status, keywords, error, fromCache,
  regionCode, language, canRefresh,
  onClose, onRefresh, onAddKeyword, onAnalyzeKeyword, onDisablePermanently,
}: Props) {
  const [expandedRow, setExpandedRow] = React.useState<number | null>(null);
  const [addedSet, setAddedSet] = React.useState<Set<string>>(new Set());

  const handleAdd = useCallback((kw: TrendingKeyword) => {
    onAddKeyword(kw);
    setAddedSet(prev => new Set([...prev, kw.keyword]));
  }, [onAddKeyword]);

  if (!visible) return null;

  const flag  = REGION_FLAG[regionCode] ?? '🌍';
  const lang  = LANG_LABEL[language] ?? language;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680, width: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              🔥 10 Keyword đang trending
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {flag} {lang} · YouTube Most Popular
              {fromCache && <span style={{ marginLeft: 8, opacity: 0.6 }}>· từ cache</span>}
            </p>
          </div>
          <button className="btn" onClick={onClose} style={{ fontSize: '1.2rem', padding: '4px 10px', lineHeight: 1 }}>✕</button>
        </div>

        {/* ── Body ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ width: 24, height: 24 }} />
              <p style={{ marginTop: 12 }}>Đang tải trending data…</p>
            </div>
          )}

          {status === 'no_key' && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔑</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có YouTube API Key</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Vào tab <strong>⚙️ Cài đặt</strong> → thêm YouTube API Key để xem trending data.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
              <p style={{ fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Không tải được trending data</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>{error}</p>
              {canRefresh && (
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onRefresh}>
                  🔄 Thử lại
                </button>
              )}
            </div>
          )}

          {status === 'ready' && keywords.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              Không có đủ dữ liệu để trích xuất keyword trending.
            </div>
          )}

          {status === 'ready' && keywords.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keywords.map((kw, i) => (
                <div key={kw.keyword} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rank badge */}
                    <span style={{
                      minWidth: 28, height: 28, borderRadius: '50%',
                      background: i < 3 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'var(--bg-elevated)',
                      color: i < 3 ? '#fff' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.78rem', flexShrink: 0,
                    }}>
                      {kw.rank}
                    </span>

                    {/* Keyword text */}
                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-word' }}>
                      {kw.keyword}
                    </span>

                    {/* Score bar */}
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textAlign: 'right' }}>
                        {kw.score}/100
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${kw.score}%`,
                          background: kw.score >= 70
                            ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                            : kw.score >= 40
                            ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                            : 'linear-gradient(90deg,#94a3b8,#64748b)',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className={`btn ${addedSet.has(kw.keyword) ? '' : 'btn-primary'}`}
                        style={{ padding: '4px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                        onClick={() => handleAdd(kw)}
                        disabled={addedSet.has(kw.keyword)}
                        title="Thêm vào workspace và score ngay"
                      >
                        {addedSet.has(kw.keyword) ? '✅ Đã thêm' : '➕ Thêm'}
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                        onClick={() => { onAnalyzeKeyword(kw.keyword); onClose(); }}
                        title="Phân tích trên YouTube Research"
                      >
                        🔍
                      </button>
                    </div>

                    {/* Expand toggle */}
                    {kw.sampleVideoTitles.length > 0 && (
                      <button
                        className="btn"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      >
                        {expandedRow === i ? '▲' : '▼'}
                      </button>
                    )}
                  </div>

                  {/* Expanded: sample video titles */}
                  {expandedRow === i && kw.sampleVideoTitles.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>
                        Video mẫu:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {kw.sampleVideoTitles.map((t, j) => (
                          <li key={j} style={{ marginBottom: 2 }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={onRefresh}
              disabled={!canRefresh || status === 'loading'}
              title={canRefresh ? 'Lấy dữ liệu mới' : 'Chờ 15 phút giữa các lần refresh'}
              style={{ fontSize: '0.82rem' }}
            >
              🔄 Refresh {!canRefresh && <span style={{ opacity: 0.5, marginLeft: 4 }}>(cooldown)</span>}
            </button>
            <button
              className="btn"
              onClick={onDisablePermanently}
              style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
              title="Tắt popup này vĩnh viễn (có thể bật lại trong Cài đặt)"
            >
              🚫 Tắt vĩnh viễn
            </button>
          </div>
          <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.82rem' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
