import React, { useState, useEffect } from 'react';
import type { Keyword } from '../types';
import { scoreColor, recBadgeClass } from './utils.ts';
import { getFreshness, getFreshnessColor } from '../engine/dataMetadata.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import type { KeywordSnapshot } from '../engine/trendDetection.ts';
import { calculateTrend, filterByPeriod } from '../engine/trendDetection.ts';
import type { UseKeywordsReturn } from '../hooks/useKeywords.ts';

type Period = '7d' | '30d' | '90d' | 'all';

interface DetailModalProps {
  kw: Keyword | null;
  onClose: () => void;
  onAnalyze?: (keyword: string) => void;
  snapshots?: UseKeywordsReturn['snapshots'];
}

interface ScoreDimension { label: string; value: number; max: number; desc: string; }

type TabId = 'detail' | 'trend';

export default function DetailModal({ kw, onClose, onAnalyze, snapshots }: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('detail');
  const [period, setPeriod]       = useState<Period>('30d');
  const [kwSnapshots, setKwSnapshots] = useState<KeywordSnapshot[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [keywordId, setKeywordId] = useState<string | null>(null);

  if (!kw) return null;

  const scores: ScoreDimension[] = [
    { label: 'Demand',           value: kw.demand,          max: 20, desc: 'Video long-form cho key này có views tốt không?' },
    { label: 'Search Intent',    value: kw.searchIntent,    max: 15, desc: 'Người xem tìm kiếm giải thích, hướng dẫn, so sánh?' },
    { label: 'Topic Depth',      value: kw.topicDepth,      max: 15, desc: 'Chủ đề đủ sâu cho video 5–20+ phút không?' },
    { label: 'Small Channel',    value: kw.smallChannel,    max: 15, desc: 'Kênh nhỏ/trung có cơ hội với keyword này không?' },
    { label: 'Evergreen',        value: kw.evergreen,       max: 10, desc: 'Chủ đề còn có giá trị sau nhiều tháng không?' },
    { label: 'Series Potential', value: kw.seriesPotential, max: 10, desc: 'Có thể làm nhiều video theo series không?' },
    { label: 'Long-tail Exp.',   value: kw.longTailExp,     max: 10, desc: 'Có thể mở rộng ra nhiều sub-topic không?' },
    { label: 'Low Risk',         value: kw.lowRisk,         max: 5,  desc: '5 = an toàn bản quyền, 0 = rủi ro cao' },
  ];

  const api  = kw.apiData;
  const meta = kw.metadata;
  const freshness = meta?.freshnessStatus || (meta?.collectedAt ? getFreshness(meta.collectedAt) : null);
  const isStale = freshness === 'Old' || freshness === 'Stale';

  // ── Load snapshots when Trend tab opens ─────────────────────
  useEffect(() => {
    if (activeTab !== 'trend' || !snapshots) return;
    // Fetch keyword_id first if not cached
    (async () => {
      setLoadingSnaps(true);
      if (kw.workspaceId) {
        // We need keyword_id from DB — use workspaceId + keyword text
        const { supabase } = await import('../lib/supabase.ts');
        const { data } = await supabase
          .from('keywords')
          .select('id')
          .eq('workspace_id', kw.workspaceId)
          .eq('keyword', kw.keyword)
          .single();
        if (data?.id) {
          setKeywordId(data.id as string);
          const snaps = await snapshots.fetchSnapshots(data.id as string);
          setKwSnapshots(snaps);
        }
      }
      setLoadingSnaps(false);
    })();
  }, [activeTab, kw.keyword, kw.workspaceId]);

  // ── Chart data ───────────────────────────────────────────────
  const periodSnaps = filterByPeriod(kwSnapshots, period);
  const chartData = [...periodSnaps].reverse().map(s => ({
    date: new Date(s.captured_at).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
    score: s.long_form_score,
    views: Math.round(s.avg_views / 1000),
    ratio: s.best_ratio,
  }));

  const trend = calculateTrend(periodSnaps);

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="jp-text">{kw.keyword}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
          {kw.vi} — <strong style={{ color: 'var(--accent)' }}>{kw.niche}</strong> — {kw.level}
        </p>
        <span className={`rec-badge ${recBadgeClass(kw.recommendation)}`}>{kw.recommendation}</span>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, marginBottom: 0, borderBottom: '1px solid var(--glass-border)' }}>
          {(['detail', 'trend'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '7px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
              }}
            >
              {t === 'detail' ? '📋 Chi tiết' : '📈 Trend'}
            </button>
          ))}
        </div>

        {/* ── Detail Tab ───────────────────────────────────────── */}
        {activeTab === 'detail' && (
          <>
            {/* Freshness warning */}
            {isStale && onAnalyze && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginTop: 14, background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.3)', borderRadius: 8, fontSize: '0.82rem' }}>
                <span>⏰ Data đã cũ ({freshness}). Phân tích lại để cập nhật trend.</span>
                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }} onClick={() => { onAnalyze(kw.keyword); onClose(); }}>
                  ▶️ Phân tích ngay
                </button>
              </div>
            )}

            {/* Score Grid */}
            <div className="detail-grid" style={{ marginTop: 16 }}>
              {scores.map(s => (
                <div key={s.label} className="detail-item">
                  <div className="label">{s.label} (/{s.max})</div>
                  <div className="value" style={{ color: scoreColor(s.value, s.max) }}>{s.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
              <div className="detail-item" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
                <div className="label">Long-Form Score Tổng</div>
                <div className="value" style={{ fontSize: '2rem', color: scoreColor(kw.longFormScore, 100) }}>
                  {kw.longFormScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
            </div>

            {/* YouTube API Data */}
            {api && api.longVideosFound > 0 && (
              <div className="detail-sub">
                <h3>▶️ Dữ liệu YouTube</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {([
                    ['Long video tìm thấy', api.longVideosFound],
                    ['Avg views / video', api.avgLongVideoViews ? Math.round(api.avgLongVideoViews / 1000) + 'k' : '—'],
                    ['Best view/sub ratio', api.bestViewSubRatio ? api.bestViewSubRatio.toFixed(1) + 'x' : '—'],
                    ['Kênh nhỏ cơ hội', api.hasSmallChannelOpportunity ? '✅ Có' : '—'],
                  ] as [string, string | number][]).map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--glass)', padding: '6px 10px', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {api.refChannels?.length > 0 && (
                  <p style={{ fontSize: '0.78rem', marginTop: 8, color: 'var(--text-secondary)' }}>
                    Kênh tham khảo: <strong>{api.refChannels.slice(0, 3).join(', ')}</strong>
                  </p>
                )}
              </div>
            )}

            {kw.chapters?.length > 0 && (
              <div className="detail-sub">
                <h3>🎬 Gợi ý Chapters (tiếng Nhật)</h3>
                <ol style={{ paddingLeft: 20 }}>
                  {kw.chapters.map((ch, i) => (
                    <li key={i} className="jp-text" style={{ padding: '3px 0', fontSize: '0.88rem', color: 'var(--text)' }}>{ch}</li>
                  ))}
                </ol>
              </div>
            )}

            {kw.suggestedTitles?.length > 0 && (
              <div className="detail-sub">
                <h3>✏️ Gợi ý Tiêu đề (nội dung gốc)</h3>
                <ul>
                  {kw.suggestedTitles.map((t, i) => (
                    <li key={i} className="jp-text" style={{ padding: '4px 0', fontSize: '0.88rem' }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {kw.subKeywords?.length > 0 && (
              <div className="detail-sub">
                <h3>🔀 Sub-keywords liên quan</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {kw.subKeywords.map(s => (
                    <span key={s} className="seed-tag jp-text" style={{ fontSize: '0.8rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(freshness || meta?.confidenceLevel) && (
              <div className="detail-sub" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12, marginTop: 12 }}>
                <h3>📊 Metadata dữ liệu</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, fontSize: '0.78rem' }}>
                  {([
                    ['Nguồn dữ liệu', meta?.hasApiData ? 'YouTube Data API v3' : 'Rule-based'],
                    ['Thu thập lúc', meta?.collectedAt ? new Date(meta.collectedAt).toLocaleDateString('vi-VN') : '—'],
                    ['Freshness', freshness || '—'],
                    ['Confidence', meta?.confidenceLevel || '—'],
                    ['Time window', meta?.timeWindowDays ? meta.timeWindowDays + ' ngày' : '—'],
                    ['Region', meta?.regionCode || 'JP'],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} style={{ color: 'var(--text-muted)' }}>
                      <span>{k}: </span>
                      <span style={{ color: k === 'Freshness' ? getFreshnessColor(v as Parameters<typeof getFreshnessColor>[0]) : 'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kw.reason && (
              <div className="detail-sub">
                <h3>📝 Phân tích</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{kw.reason}</p>
              </div>
            )}
          </>
        )}

        {/* ── Trend Tab ────────────────────────────────────────── */}
        {activeTab === 'trend' && (
          <div style={{ marginTop: 16 }}>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['7d', '30d', '90d', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '4px 12px', borderRadius: 14, fontSize: '0.78rem', cursor: 'pointer',
                    background: period === p ? 'var(--accent)' : 'var(--glass)',
                    color: period === p ? '#000' : 'var(--text-muted)',
                    border: period === p ? 'none' : '1px solid var(--glass-border)',
                    fontWeight: period === p ? 700 : 400,
                  }}
                >
                  {p === 'all' ? 'Tất cả' : p}
                </button>
              ))}
            </div>

            {loadingSnaps && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            )}

            {!loadingSnaps && chartData.length < 2 && (
              <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--glass)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                <p>Chưa đủ data để hiển thị trend.</p>
                <p style={{ fontSize: '0.78rem', marginTop: 4 }}>Phân tích lại keyword này sau 7 ngày để xem biểu đồ.</p>
                {onAnalyze && (
                  <button className="btn btn-primary" style={{ marginTop: 12, padding: '7px 18px', fontSize: '0.82rem' }} onClick={() => { onAnalyze(kw.keyword); onClose(); }}>
                    ▶️ Phân tích ngay
                  </button>
                )}
              </div>
            )}

            {!loadingSnaps && chartData.length >= 2 && (
              <>
                {/* Trend summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--glass)', marginBottom: 14 }}>
                  <span style={{ fontSize: '1.6rem' }}>{trend.badge ?? '➡️'}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: trend.direction === 'rising' ? 'var(--green)' : trend.direction === 'declining' ? 'var(--red)' : 'var(--text)' }}>
                      {trend.direction === 'rising' ? 'Đang tăng' : trend.direction === 'declining' ? 'Đang giảm' : 'Ổn định'}
                      {' '}<span style={{ fontSize: '0.85rem' }}>({trend.label})</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Score thay đổi: {trend.scoreDelta > 0 ? '+' : ''}{trend.scoreDelta} pts · Confidence: {trend.confidence} · {periodSnaps.length} snapshot
                    </div>
                  </div>
                </div>

                {/* Line chart */}
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                      <YAxis yAxisId="score" domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} width={28} />
                      <YAxis yAxisId="views" orientation="right" tick={{ fill: '#888', fontSize: 10 }} width={36} unit="k" />
                      <Tooltip
                        contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
                        formatter={(value: unknown, name: unknown) => {
                          if (name === 'LF Score') return [`${value}/100`, String(name)];
                          if (name === 'Avg Views') return [`${value}k`, String(name)];
                          return [String(value), String(name)];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                      <Line yAxisId="score" type="monotone" dataKey="score" name="LF Score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="views" type="monotone" dataKey="views" name="Avg Views" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
