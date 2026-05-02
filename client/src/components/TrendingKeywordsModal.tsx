// ============================================================
// components/TrendingKeywordsModal.tsx — Phase 17 (Tailwind)
// Shows top-10 trending YouTube keywords on first session load
// ============================================================
import React, { useCallback } from 'react';
import type { TrendingKeyword } from '../types';
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

  const flag = REGION_FLAG[regionCode] ?? '🌍';
  const lang = LANG_LABEL[language] ?? language;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col rounded-xl overflow-hidden"
        style={{
          maxWidth: 680, maxHeight: '90vh',
          background: '#0d1425',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          animation: 'modalIn 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="m-0 text-lg font-bold">🔥 10 Keyword đang trending</h2>
            <p className="mt-1 text-xs text-text-muted">
              {flag} {lang} · YouTube Most Popular
              {fromCache && <span className="ml-2 opacity-60">· từ cache</span>}
            </p>
          </div>
          <button
            className="btn"
            onClick={onClose}
            style={{ fontSize: '1.2rem', padding: '4px 10px', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <span className="spinner" style={{ width: 24, height: 24 }} />
              <p className="mt-3 text-sm">Đang tải trending data…</p>
            </div>
          )}

          {/* No key */}
          {status === 'no_key' && (
            <div className="text-center py-8 px-4">
              <div className="text-4xl mb-3">🔑</div>
              <p className="font-semibold mb-1">Chưa có YouTube API Key</p>
              <p className="text-sm text-text-muted">
                Vào tab <strong>⚙️ Cài đặt</strong> → thêm YouTube API Key để xem trending data.
              </p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-8 px-4">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-semibold text-red-400 mb-1">Không tải được trending data</p>
              <p className="text-xs text-text-muted break-words">{error}</p>
              {canRefresh && (
                <button className="btn btn-primary mt-3" onClick={onRefresh}>🔄 Thử lại</button>
              )}
            </div>
          )}

          {/* Empty */}
          {status === 'ready' && keywords.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">
              Không có đủ dữ liệu để trích xuất keyword trending.
            </div>
          )}

          {/* Keyword list */}
          {status === 'ready' && keywords.length > 0 && (
            <div className="flex flex-col gap-2">
              {keywords.map((kw, i) => (
                <div
                  key={kw.keyword}
                  className="rounded-[10px] px-3.5 py-2.5 transition-colors duration-150"
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank badge */}
                    <span
                      className="shrink-0 flex items-center justify-center rounded-full font-bold text-xs"
                      style={{
                        width: 28, height: 28,
                        background: i < 3
                          ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                          : 'rgba(255,255,255,0.06)',
                        color: i < 3 ? '#fff' : '#5c6480',
                      }}
                    >
                      {kw.rank}
                    </span>

                    {/* Keyword */}
                    <span className="flex-1 font-semibold text-[0.95rem] break-words">
                      {kw.keyword}
                    </span>

                    {/* Score bar */}
                    <div className="w-20 shrink-0">
                      <div className="text-[0.7rem] text-text-muted mb-0.5 text-right">{kw.score}/100</div>
                      <div className="h-1 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-sm transition-all duration-300"
                          style={{
                            width: `${kw.score}%`,
                            background: kw.score >= 70
                              ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                              : kw.score >= 40
                              ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                              : 'linear-gradient(90deg,#94a3b8,#64748b)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        className={`btn ${addedSet.has(kw.keyword) ? '' : 'btn-primary'}`}
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleAdd(kw)}
                        disabled={addedSet.has(kw.keyword)}
                        title="Thêm vào workspace"
                      >
                        {addedSet.has(kw.keyword) ? '✅ Đã thêm' : '➕ Thêm'}
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => { onAnalyzeKeyword(kw.keyword); onClose(); }}
                        title="Phân tích trên YouTube Research"
                      >🔍</button>
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
                  </div>

                  {/* Expanded: sample video titles */}
                  {expandedRow === i && kw.sampleVideoTitles.length > 0 && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-[0.75rem] text-text-muted mb-1">Video mẫu:</p>
                      <ul className="m-0 pl-4 text-[0.8rem] text-text-secondary space-y-0.5 list-disc">
                        {kw.sampleVideoTitles.map((t, j) => (
                          <li key={j}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div
          className="shrink-0 flex flex-wrap gap-2.5 items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex gap-3 flex-wrap">
            <button
              className="btn text-[0.82rem]"
              onClick={onRefresh}
              disabled={!canRefresh || status === 'loading'}
              title={canRefresh ? 'Lấy dữ liệu mới' : 'Chờ 15 phút giữa các lần refresh'}
            >
              🔄 Refresh {!canRefresh && <span className="opacity-50 ml-1">(cooldown)</span>}
            </button>
            <button
              className="btn text-[0.82rem] text-text-muted"
              onClick={onDisablePermanently}
              title="Tắt popup này vĩnh viễn (có thể bật lại trong Cài đặt)"
            >
              🚫 Tắt vĩnh viễn
            </button>
          </div>
          <button className="btn btn-primary text-[0.82rem]" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
