import React, { useState, useMemo } from 'react';
import type { Keyword, Niche } from '../types';
import type { UseYoutubeConnectionReturn } from '../hooks/useYoutubeConnection.ts';
import { analyzeGap, getOpportunities, type GapResult } from '../engine/gapAnalysis.ts';
import { formatNum } from './utils.ts';
import { NICHE_EMOJI } from '../engine/heatmapData.ts';

interface GapAnalysisTabProps {
  keywords: Keyword[];
  ytConn: UseYoutubeConnectionReturn;
  onAnalyzeKeyword: (kw: string) => void;
}

const NICHES = ['', 'AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Tiết kiệm', 'Công việc', 'Phỏng vấn', 'Học tập', 'Tâm lý học', 'Kiến thức / Fact', 'Văn hóa Nhật', '100均', 'Sức khỏe', 'Kinh doanh'];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
  opportunity: { bg: 'rgba(0,229,255,0.06)', color: 'var(--accent)', label: 'Cơ hội', emoji: '💎' },
  partial:     { bg: 'rgba(245,158,11,0.06)', color: '#f59e0b', label: 'Partial', emoji: '⚠️' },
  covered:     { bg: 'rgba(74,222,128,0.05)', color: '#4ade80', label: 'Đã làm', emoji: '✅' },
};

export default function GapAnalysisTab({ keywords, ytConn, onAnalyzeKeyword }: GapAnalysisTabProps) {
  const { connection, myVideos, loading, connecting, fetchingVideos, oauthConfigured, connect, disconnect, fetchMyVideos } = ytConn;
  const [minScore, setMinScore] = useState(60);
  const [niche, setNiche] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [localVideos, setLocalVideos] = useState<Array<{ videoId: string; title: string }>>([]);
  const [planned, setPlanned] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ytlf_planned') || '[]')); }
    catch { return new Set(); }
  });

  const allVideos = [...myVideos, ...localVideos];

  // ── Gap analysis ─────────────────────────────────────────────
  const filtered = useMemo(() =>
    keywords.filter(k => k.longFormScore >= minScore && (!niche || k.niche === niche)),
    [keywords, minScore, niche],
  );

  const results = useMemo(() => {
    if (!allVideos.length) return [];
    return analyzeGap(filtered, allVideos);
  }, [filtered, allVideos]);

  const opportunities = results.filter(r => r.status === 'opportunity');
  const partials       = results.filter(r => r.status === 'partial');
  const covered        = results.filter(r => r.status === 'covered');

  function togglePlan(kw: string) {
    setPlanned(prev => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      try { localStorage.setItem('ytlf_planned', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  // ── Not connected ─────────────────────────────────────────────
  if (!connection) {
    return (
      <section className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔗</div>
        <h3 style={{ margin: '0 0 8px' }}>Kết nối YouTube Channel</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 20px' }}>
          Kết nối channel của bạn để Gap Analysis tự động phát hiện keyword nào bạn <strong>chưa làm video</strong>.
        </p>
        {!oauthConfigured && (
          <div style={{ padding: '10px 16px', background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.25)', borderRadius: 8, fontSize: '0.82rem', color: '#fb923c', marginBottom: 16, display: 'inline-block' }}>
            ⚠️ Server chưa cấu hình OAuth. Thêm <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> vào <code>server/.env</code>
          </div>
        )}
        <button
          className="btn btn-primary"
          style={{ fontSize: '0.9rem', padding: '10px 24px' }}
          onClick={connect}
          disabled={connecting || !oauthConfigured || loading}
        >
          {connecting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Đang kết nối...</> : '🔗 Connect YouTube Channel'}
        </button>
        {/* Offline mode with manual video list */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--glass)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Hoặc thêm video titles thủ công bên dưới (offline mode)
          <ManualVideoInput onSave={vids => setLocalVideos(prev => [...prev, ...vids])} />
        </div>
      </section>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Channel info bar ─────────────────────────────────── */}
      <section className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {connection.channelThumb && (
            <img src={connection.channelThumb} alt={connection.channelTitle} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--accent)' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>▶️ {connection.channelTitle}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {formatNum(connection.subscriberCount)} subs · Kết nối từ {new Date(connection.connectedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => fetchMyVideos(50)}
              disabled={fetchingVideos}
            >
              {fetchingVideos ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang tải...</> : `🔄 Tải video${allVideos.length ? ` (${allVideos.length})` : ''}`}
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.76rem', color: 'var(--red)' }} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        </div>
      </section>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score ≥</label>
        {[0, 50, 60, 70, 80].map(s => (
          <button key={s} onClick={() => setMinScore(s)} className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem', background: minScore === s ? 'var(--accent)' : '', color: minScore === s ? '#000' : '' }}>
            {s || 'Tất cả'}
          </button>
        ))}
        <select value={niche} onChange={e => setNiche(e.target.value)}
          style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem' }}>
          {NICHES.map(n => <option key={n} value={n}>{n ? `${NICHE_EMOJI[n] || ''} ${n}` : 'Tất cả niche'}</option>)}
        </select>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: '💎 Cơ hội', value: opportunities.length, color: 'var(--accent)' },
            { label: '⚠️ Partial', value: partials.length, color: '#f59e0b' },
            { label: '✅ Đã làm', value: covered.length, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── No videos loaded ─────────────────────────────────── */}
      {!allVideos.length && !fetchingVideos && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <p>Bấm "🔄 Tải video" để phân tích gap.</p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────── */}
      {results.length > 0 && (
        <section className="card">
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>
            💎 Cơ hội cao — chưa làm ({opportunities.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(showAll ? opportunities : opportunities.slice(0, 12)).map(r => (
              <GapCard key={r.keyword.keyword} result={r} planned={planned} onPlan={togglePlan} onAnalyze={onAnalyzeKeyword} />
            ))}
            {opportunities.length > 12 && (
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px' }} onClick={() => setShowAll(v => !v)}>
                {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${opportunities.length - 12} keyword`}
              </button>
            )}
          </div>

          {partials.length > 0 && (
            <>
              <h3 style={{ margin: '20px 0 10px', fontSize: '0.9rem', color: '#f59e0b' }}>⚠️ Đã có video tương tự — Partial ({partials.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {partials.slice(0, 6).map(r => (
                  <GapCard key={r.keyword.keyword} result={r} planned={planned} onPlan={togglePlan} onAnalyze={onAnalyzeKeyword} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

// ── Gap Card ─────────────────────────────────────────────────
function GapCard({ result, planned, onPlan, onAnalyze }: {
  result: GapResult;
  planned: Set<string>;
  onPlan: (kw: string) => void;
  onAnalyze: (kw: string) => void;
}) {
  const { keyword: kw, status, matchedVideo } = result;
  const style = STATUS_STYLE[status];
  const isPlan = planned.has(kw.keyword);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10, background: style.bg,
      border: `1px solid ${style.color}33`, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{style.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="jp-text" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{kw.keyword}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {NICHE_EMOJI[kw.niche] || ''} {kw.niche} · Score: <strong style={{ color: style.color }}>{kw.longFormScore}</strong>
          {kw.apiData?.avgLongVideoViews ? ` · Đối thủ avg: ${formatNum(kw.apiData.avgLongVideoViews)} views` : ''}
        </div>
        {matchedVideo && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Gần nhất: <em className="jp-text">{matchedVideo.title.slice(0, 60)}</em>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 10px', fontSize: '0.72rem' }}
          onClick={() => onAnalyze(kw.keyword)}
        >▶️ Phân tích</button>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 10px', fontSize: '0.72rem', background: isPlan ? 'rgba(99,102,241,0.15)' : '', color: isPlan ? '#818cf8' : '' }}
          onClick={() => onPlan(kw.keyword)}
        >{isPlan ? '📌 Đã plan' : '📋 Lên kế hoạch'}</button>
      </div>
    </div>
  );
}

// ── Manual Video Input (offline mode) ────────────────────────
function ManualVideoInput({ onSave }: { onSave: (v: Array<{ videoId: string; title: string }>) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) return <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: '0.75rem' }} onClick={() => setOpen(true)}>Nhập thủ công</button>;
  return (
    <div style={{ marginTop: 10 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={'Mỗi dòng 1 title video, ví dụ:\nChatGPT 使い方 完全解説\nExcel マクロ 入門'}
        style={{ width: '100%', minHeight: 80, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', borderRadius: 6, padding: 8, fontSize: '0.8rem', fontFamily: 'inherit' }}
      />
      <button className="btn btn-primary" style={{ marginTop: 6, fontSize: '0.78rem', padding: '5px 14px' }} onClick={() => {
        const vids = text.trim().split('\n').filter(Boolean).map((t, i) => ({ videoId: `manual_${i}`, title: t.trim() }));
        onSave(vids); setOpen(false);
      }}>💾 Lưu ({text.split('\n').filter(Boolean).length} video)</button>
    </div>
  );
}
