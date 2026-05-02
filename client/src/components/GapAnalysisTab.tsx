import React, { useState, useMemo } from 'react';
import type { Keyword, Niche } from '../types';
import type { UseYoutubeConnectionReturn } from '../hooks/useYoutubeConnection.ts';
import { analyzeGap, getOpportunities, type GapResult } from '../engine/gapAnalysis.ts';
import { formatNum } from './utils.ts';
import { NICHE_EMOJI } from '../engine/heatmapData.ts';
import { wsKey } from '../engine/storageKeys.ts';

interface GapAnalysisTabProps {
  keywords: Keyword[];
  ytConn: UseYoutubeConnectionReturn;
  onAnalyzeKeyword: (kw: string) => void;
  workspaceId?: string | null;
}

const NICHES = ['', 'AI / ChatGPT', 'Excel / Office', 'Lập trình', 'Tiết kiệm', 'Công việc', 'Phỏng vấn', 'Học tập', 'Tâm lý học', 'Kiến thức / Fact', 'Văn hóa Nhật', '100均', 'Sức khỏe', 'Kinh doanh'];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
  opportunity: { bg: 'rgba(0,229,255,0.06)',  color: '#00e5ff', label: 'Cơ hội', emoji: '💎' },
  partial:     { bg: 'rgba(245,158,11,0.06)', color: '#f59e0b', label: 'Partial', emoji: '⚠️' },
  covered:     { bg: 'rgba(74,222,128,0.05)', color: '#4ade80', label: 'Đã làm', emoji: '✅' },
};

export default function GapAnalysisTab({ keywords, ytConn, onAnalyzeKeyword, workspaceId }: GapAnalysisTabProps) {
  const { connection, myVideos, loading, connecting, fetchingVideos, oauthConfigured, connect, disconnect, fetchMyVideos } = ytConn;
  const [minScore,    setMinScore]    = useState(60);
  const [niche,       setNiche]       = useState('');
  const [showAll,     setShowAll]     = useState(false);
  const [localVideos, setLocalVideos] = useState<Array<{ videoId: string; title: string }>>([]);

  const plannedKey = wsKey('planned', workspaceId);
  const [planned, setPlanned] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(plannedKey) || '[]')); }
    catch { return new Set(); }
  });

  const allVideos = [...myVideos, ...localVideos];

  const filtered = useMemo(() =>
    keywords.filter(k => k.longFormScore >= minScore && (!niche || k.niche === niche)),
    [keywords, minScore, niche],
  );

  const results       = useMemo(() => allVideos.length ? analyzeGap(filtered, allVideos) : [], [filtered, allVideos]);
  const opportunities = results.filter(r => r.status === 'opportunity');
  const partials      = results.filter(r => r.status === 'partial');

  function togglePlan(kw: string) {
    setPlanned(prev => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      try { localStorage.setItem(plannedKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  // ── Not connected ─────────────────────────────────────────────
  if (!connection) {
    return (
      <section className="card text-center py-12 px-6">
        <div className="text-5xl mb-3">🔗</div>
        <h3 className="m-0 mb-2">Kết nối YouTube Channel</h3>
        <p className="text-text-muted text-[0.88rem] max-w-[420px] mx-auto mb-5">
          Kết nối channel của bạn để Gap Analysis tự động phát hiện keyword nào bạn <strong>chưa làm video</strong>.
        </p>
        {!oauthConfigured && (
          <div className="inline-block px-4 py-2.5 rounded-lg text-[0.82rem] text-[#fb923c] mb-4"
            style={{ background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.25)' }}>
            ⚠️ Server chưa cấu hình OAuth. Thêm <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> vào <code>server/.env</code>
          </div>
        )}
        <button className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '10px 24px' }}
          onClick={connect} disabled={connecting || !oauthConfigured || loading}>
          {connecting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Đang kết nối...</> : '🔗 Connect YouTube Channel'}
        </button>
        <div className="mt-6 px-4 py-3 rounded-lg text-[0.8rem] text-text-muted"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          Hoặc thêm video titles thủ công bên dưới (offline mode)
          <ManualVideoInput onSave={vids => setLocalVideos(prev => [...prev, ...vids])} />
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Channel info bar ────────────────────────────────── */}
      <section className="card" style={{ padding: '12px 16px' }}>
        <div className="flex items-center gap-3 flex-wrap">
          {connection.channelThumb && (
            <img src={connection.channelThumb} alt={connection.channelTitle}
              className="rounded-full w-10 h-10" style={{ border: '2px solid #00e5ff' }} />
          )}
          <div>
            <div className="font-bold text-accent">▶️ {connection.channelTitle}</div>
            <div className="text-[0.74rem] text-text-muted">
              {formatNum(connection.subscriberCount)} subs · Kết nối từ {new Date(connection.connectedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div className="ml-auto flex gap-2 items-center">
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => fetchMyVideos(50)} disabled={fetchingVideos}>
              {fetchingVideos ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang tải...</> : `🔄 Tải video${allVideos.length ? ` (${allVideos.length})` : ''}`}
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.76rem', color: '#ff1744' }}
              onClick={disconnect}>Disconnect</button>
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="flex gap-2.5 flex-wrap items-center">
        <label className="text-[0.8rem] text-text-muted">Score ≥</label>
        {[0, 50, 60, 70, 80].map(s => (
          <button key={s} onClick={() => setMinScore(s)} className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem', background: minScore === s ? '#00e5ff' : '', color: minScore === s ? '#000' : '' }}>
            {s || 'Tất cả'}
          </button>
        ))}
        <select value={niche} onChange={e => setNiche(e.target.value)} className="field-select"
          style={{ width: 'auto', minWidth: 140, padding: '4px 10px', fontSize: '0.8rem' }}>
          {NICHES.map(n => <option key={n} value={n}>{n ? `${NICHE_EMOJI[n] || ''} ${n}` : 'Tất cả niche'}</option>)}
        </select>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: '💎 Cơ hội', value: opportunities.length, color: '#00e5ff' },
            { label: '⚠️ Partial', value: partials.length,      color: '#f59e0b' },
            { label: '✅ Đã làm', value: results.filter(r => r.status === 'covered').length, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} className="rounded-[10px] px-4 py-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[1.5rem] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[0.74rem] text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── No videos ─────────────────────────────────────────── */}
      {!allVideos.length && !fetchingVideos && (
        <div className="text-center py-8 text-text-muted text-[0.88rem]">
          <p>Bấm "🔄 Tải video" để phân tích gap.</p>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {results.length > 0 && (
        <section className="card">
          <h3 className="m-0 mb-3.5 text-[0.95rem]">💎 Cơ hội cao — chưa làm ({opportunities.length})</h3>
          <div className="flex flex-col gap-2">
            {(showAll ? opportunities : opportunities.slice(0, 12)).map(r => (
              <GapCard key={r.keyword.keyword} result={r} planned={planned} onPlan={togglePlan} onAnalyze={onAnalyzeKeyword} />
            ))}
            {opportunities.length > 12 && (
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px' }}
                onClick={() => setShowAll(v => !v)}>
                {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${opportunities.length - 12} keyword`}
              </button>
            )}
          </div>

          {partials.length > 0 && (
            <>
              <h3 className="mt-5 mb-2.5 text-[0.9rem]" style={{ color: '#f59e0b' }}>⚠️ Đã có video tương tự — Partial ({partials.length})</h3>
              <div className="flex flex-col gap-1.5">
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
  result: GapResult; planned: Set<string>; onPlan: (kw: string) => void; onAnalyze: (kw: string) => void;
}) {
  const { keyword: kw, status, matchedVideo } = result;
  const st    = STATUS_STYLE[status];
  const isPlan = planned.has(kw.keyword);
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] flex-wrap"
      style={{ background: st.bg, border: `1px solid ${st.color}33` }}>
      <span className="text-[1.1rem]">{st.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="jp-text font-semibold text-[0.9rem]">{kw.keyword}</div>
        <div className="text-[0.72rem] text-text-muted mt-0.5">
          {NICHE_EMOJI[kw.niche] || ''} {kw.niche} · Score: <strong style={{ color: st.color }}>{kw.longFormScore}</strong>
          {kw.apiData?.avgLongVideoViews ? ` · Đối thủ avg: ${formatNum(kw.apiData.avgLongVideoViews)} views` : ''}
        </div>
        {matchedVideo && (
          <div className="text-[0.7rem] text-text-muted mt-0.5">
            Gần nhất: <em className="jp-text">{matchedVideo.title.slice(0, 60)}</em>
          </div>
        )}
      </div>
      <div className="flex gap-1.5">
        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}
          onClick={() => onAnalyze(kw.keyword)}>▶️ Phân tích</button>
        <button className="btn btn-secondary"
          style={{ padding: '3px 10px', fontSize: '0.72rem', background: isPlan ? 'rgba(99,102,241,0.15)' : '', color: isPlan ? '#818cf8' : '' }}
          onClick={() => onPlan(kw.keyword)}>
          {isPlan ? '📌 Đã plan' : '📋 Lên kế hoạch'}
        </button>
      </div>
    </div>
  );
}

// ── Manual Video Input (offline mode) ────────────────────────
function ManualVideoInput({ onSave }: { onSave: (v: Array<{ videoId: string; title: string }>) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) return (
    <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: '0.75rem' }} onClick={() => setOpen(true)}>
      Nhập thủ công
    </button>
  );
  return (
    <div className="mt-2.5">
      <textarea value={text} onChange={e => setText(e.target.value)}
        className="field-input resize-none"
        style={{ minHeight: 80, fontFamily: 'inherit', fontSize: '0.8rem' }}
        placeholder={'Mỗi dòng 1 title video, ví dụ:\nChatGPT 使い方 完全解説\nExcel マクロ 入門'} />
      <button className="btn btn-primary" style={{ marginTop: 6, fontSize: '0.78rem', padding: '5px 14px' }}
        onClick={() => {
          const vids = text.trim().split('\n').filter(Boolean).map((t, i) => ({ videoId: `manual_${i}`, title: t.trim() }));
          onSave(vids); setOpen(false);
        }}>
        💾 Lưu ({text.split('\n').filter(Boolean).length} video)
      </button>
    </div>
  );
}
