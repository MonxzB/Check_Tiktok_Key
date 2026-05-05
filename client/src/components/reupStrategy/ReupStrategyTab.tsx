// ============================================================
// components/reupStrategy/ReupStrategyTab.tsx — Phase 19
// Main tab component for Reup Strategy Advisor
// ============================================================
import React, { useEffect, useState } from 'react';
import type { UseReupStrategyReturn } from '../../hooks/useReupStrategy.ts';
import VideoAnalyzer from './VideoAnalyzer.tsx';
import StrategyCard from './StrategyCard.tsx';
import StrategyComparisonModal from './StrategyComparisonModal.tsx';

interface Props {
  hook: UseReupStrategyReturn;
  userId: string | null;
  workspaceId: string | null;
}

// Skeleton card for loading state
function StrategyCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: '16px 20px', marginBottom: 12,
    }}>
      {[80, 60, 40, 90].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 12,
          width: `${w}%`, marginBottom: i === 0 ? 12 : 8,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: 6,
        }} />
      ))}
    </div>
  );
}

export default function ReupStrategyTab({ hook, userId, workspaceId }: Props) {
  const {
    videoMeta, result, savedStrategies, loading, deepLoading, error,
    currentUrl, compareIds,
    setCurrentUrl, analyzeUrl, deepAnalyze, saveStrategy, rateStrategy,
    loadSaved, clearResult, toggleCompare,
  } = hook;

  const [showCompare, setShowCompare] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [hasGeminiKey] = useState(true); // optimistic — server will return error if missing

  // Load saved strategies when tab mounts or workspace changes
  useEffect(() => {
    if (userId && workspaceId) loadSaved();
  }, [userId, workspaceId, loadSaved]);

  const compareStrategies = result?.strategies.filter(s => compareIds.includes(s.id)) ?? [];

  // Get selected strategy ID for this video
  const savedRow = savedStrategies.find(r => r.video_id === videoMeta?.videoId);
  const selectedId = savedRow?.selected_strategy_id ?? null;

  function handleSave(strategyId: string) {
    saveStrategy(strategyId);
  }

  function handleRate(rowId: string, rating: number) {
    rateStrategy(rowId, rating);
  }

  return (
    <div>
      {/* ── Copyright disclaimer ─────────────────────────────── */}
      <div style={{
        background: 'rgba(255,145,0,0.07)', border: '1px solid rgba(255,145,0,0.25)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚖️</span>
        <p style={{ fontSize: '0.78rem', color: '#ffa726', lineHeight: 1.6, margin: 0 }}>
          <strong>Lưu ý bản quyền:</strong> Tool này hỗ trợ phân tích chiến lược cho nội dung của{' '}
          <strong>chính bạn</strong> hoặc nội dung có <strong>license phù hợp (CC, royalty-free)</strong>.
          Tôn trọng Fair Use và quyền sở hữu trí tuệ. Tác giả không chịu trách nhiệm về việc sử dụng sai mục đích.
        </p>
      </div>

      {/* ── Input Section ───────────────────────────────────── */}
      <section className="card">
        <h2><span className="icon">✂️</span> Reup Strategy Advisor</h2>
        <VideoAnalyzer
          url={currentUrl}
          onChange={setCurrentUrl}
          onAnalyze={() => analyzeUrl(currentUrl)}
          onDeepAnalyze={deepAnalyze}
          loading={loading}
          deepLoading={deepLoading}
          videoMeta={videoMeta}
          error={error}
          hasGeminiKey={hasGeminiKey}
        />

        {/* Quick stats if result exists */}
        {result && !loading && (
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="stat-chip">
              <span className="stat-value">{result.strategies.length}</span> chiến lược
            </span>
            <span className="stat-chip">
              🛡️ Rủi ro BQ: <span className="stat-value" style={{
                color: result.copyrightRisk >= 7 ? 'var(--red)' : result.copyrightRisk >= 5 ? 'var(--orange)' : 'var(--green)',
                fontSize: '0.95rem', marginLeft: 4,
              }}>{result.copyrightRisk}/10</span>
            </span>
            <span className="stat-chip">
              🎯 Tin cậy: <span className="stat-value" style={{ fontSize: '0.95rem', marginLeft: 4 }}>{result.confidence}%</span>
            </span>
            <span className="stat-chip" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {result.generatedBy === 'llm' ? '🤖 Gemini' : '📐 Rule Engine'}
            </span>
            <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem', marginLeft: 'auto' }}
              onClick={clearResult}>
              🗑 Xóa
            </button>
          </div>
        )}
      </section>

      {/* ── Loading skeletons ────────────────────────────────── */}
      {(loading || deepLoading) && (
        <section className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="spinner" />
            {deepLoading ? 'Gemini đang phân tích sâu (~5s)...' : 'Đang fetch metadata + chạy rule engine...'}
          </div>
          {[1, 2, 3].map(i => <StrategyCardSkeleton key={i} />)}
        </section>
      )}

      {/* ── Strategy Results ─────────────────────────────────── */}
      {result && !loading && (
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0 }}>
              <span className="icon">🏆</span>
              Chiến lược đề xuất
              {result.primaryRecommendation === 'shorts'
                ? ' — ưu tiên Shorts'
                : result.primaryRecommendation === 'longform'
                  ? ' — ưu tiên Long-form'
                  : ' — kết hợp cả hai'}
            </h2>
            {compareIds.length >= 2 && (
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                onClick={() => setShowCompare(true)}>
                ⚖️ So sánh ({compareIds.length})
              </button>
            )}
          </div>

          {result.strategies.map(strategy => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isSelected={selectedId === strategy.id}
              isCompareActive={compareIds.includes(strategy.id)}
              onUseThis={userId ? handleSave : undefined}
              onToggleCompare={toggleCompare}
              onRate={savedRow ? (rating) => handleRate(savedRow.id, rating) : undefined}
              savedRating={savedRow?.feedback_rating ?? null}
            />
          ))}

          {!userId && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              💡 Đăng nhập để lưu chiến lược vào workspace
            </p>
          )}
        </section>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {!result && !loading && !deepLoading && (
        <div className="empty-state">
          <div className="empty-state__icon">✂️</div>
          <div className="empty-state__title">Phân tích chiến lược Reup</div>
          <div className="empty-state__desc">
            Paste link YouTube bất kỳ → nhận ngay 3-5 chiến lược cắt/edit phù hợp.<br />
            Quick Analyze chạy ngay (miễn phí) — Deep Analyze dùng Gemini AI (~$0.00008/lần).
          </div>
          <div className="empty-state__actions">
            <button className="btn btn-secondary" onClick={() => setCurrentUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}>
              🎬 Thử video mẫu
            </button>
          </div>
        </div>
      )}

      {/* ── Saved Strategies section ─────────────────────────── */}
      {userId && savedStrategies.length > 0 && (
        <section className="card" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSaved ? 14 : 0 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>
              💾 Đã lưu ({savedStrategies.length})
            </h2>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={() => setShowSaved(p => !p)}
            >
              {showSaved ? '▲ Thu gọn' : '▼ Xem tất cả'}
            </button>
          </div>

          {showSaved && (
            <div style={{ marginTop: 12 }}>
              {savedStrategies.map(row => {
                const selectedStrategy = row.strategies?.find(s => s.id === row.selected_strategy_id);
                return (
                  <div key={row.id} style={{
                    background: 'var(--glass)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  }}>
                    <img
                      src={`https://img.youtube.com/vi/${row.video_id}/mqdefault.jpg`}
                      alt=""
                      style={{ width: 72, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.video_meta?.title ?? row.video_id}
                      </div>
                      {selectedStrategy && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {selectedStrategy.emoji} {selectedStrategy.name}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {row.feedback_rating && (
                        <span style={{ color: '#ffea00', fontSize: '0.8rem' }}>
                          {'★'.repeat(row.feedback_rating)}{'☆'.repeat(5 - row.feedback_rating)}
                        </span>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                        onClick={() => {
                          setCurrentUrl(row.video_url);
                          analyzeUrl(row.video_url);
                        }}
                      >
                        🔄 Phân tích lại
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Comparison Modal ─────────────────────────────────── */}
      {showCompare && compareStrategies.length >= 2 && (
        <StrategyComparisonModal
          strategies={compareStrategies}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
