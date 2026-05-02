import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { Keyword, RefVideo } from '../types';
import { scoreColor, recBadgeClass } from './utils.ts';
import { getFreshness, getFreshnessColor } from '../engine/dataMetadata.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer } from './ChartContainer.tsx';
import type { KeywordSnapshot } from '../engine/trendDetection.ts';
import { calculateTrend, filterByPeriod } from '../engine/trendDetection.ts';
import type { UseKeywordsReturn } from '../hooks/useKeywords.ts';
import type { UsePersonalScoringReturn } from '../hooks/usePersonalScoring.ts';
import type { PerformanceRating } from '../engine/personalizedScoring.ts';

const SeoTab        = lazy(() => import('./SeoTab.js'));
const MonetizationTab = lazy(() => import('./MonetizationTab.js'));
const ThumbnailTab  = lazy(() => import('./ThumbnailTab.js'));

type Period = '7d' | '30d' | '90d' | 'all';
type TabId  = 'detail' | 'trend' | 'feedback' | 'seo' | 'monetization' | 'thumbnail';

interface DetailModalProps {
  kw: Keyword | null;
  onClose: () => void;
  onAnalyze?: (keyword: string) => void;
  snapshots?: UseKeywordsReturn['snapshots'];
  personalScoring?: UsePersonalScoringReturn;
  refVideos?: RefVideo[];
}
interface ScoreDimension { label: string; value: number; max: number; desc: string; }

const TAB_LABELS: Record<TabId, string> = {
  detail:       '📋 Chi tiết',
  trend:        '📈 Trend',
  feedback:     '📊 Feedback',
  seo:          '🎯 SEO',
  monetization: '💰 Monetize',
  thumbnail:    '🎨 Thumbnail',
};

const LazyFallback = (
  <div className="text-center py-10 text-text-muted">
    <span className="spinner" style={{ width: 20, height: 20 }} />
  </div>
);

export default function DetailModal({ kw, onClose, onAnalyze, snapshots, personalScoring, refVideos = [] }: DetailModalProps) {
  const [activeTab,    setActiveTab]    = useState<TabId>('detail');
  const [period,       setPeriod]       = useState<Period>('30d');
  const [kwSnapshots,  setKwSnapshots]  = useState<KeywordSnapshot[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);

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

  const api       = kw.apiData;
  const meta      = kw.metadata;
  const freshness = meta?.freshnessStatus || (meta?.collectedAt ? getFreshness(meta.collectedAt) : null);
  const isStale   = freshness === 'Old' || freshness === 'Stale';

  useEffect(() => {
    if (activeTab !== 'trend' || !snapshots) return;
    (async () => {
      setLoadingSnaps(true);
      if (kw.workspaceId) {
        const { supabase } = await import('../lib/supabase.ts');
        const { data } = await supabase
          .from('keywords').select('id')
          .eq('workspace_id', kw.workspaceId).eq('keyword', kw.keyword).single();
        if (data?.id) {
          const snaps = await snapshots.fetchSnapshots(data.id as string);
          setKwSnapshots(snaps);
        }
      }
      setLoadingSnaps(false);
    })();
  }, [activeTab, kw.keyword, kw.workspaceId]);

  const periodSnaps = filterByPeriod(kwSnapshots, period);
  const chartData   = [...periodSnaps].reverse().map(s => ({
    date:  new Date(s.captured_at).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
    score: s.long_form_score,
    views: Math.round(s.avg_views / 1000),
    ratio: s.best_ratio,
  }));
  const trend = calculateTrend(periodSnaps);

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="jp-text pr-10 leading-snug">{kw.keyword}</h2>
        <p className="text-text-secondary mb-1 mt-1">
          {kw.vi} — <strong className="text-accent">{kw.niche}</strong> — {kw.level}
        </p>
        <span className={`rec-badge ${recBadgeClass(kw.recommendation)}`}>{kw.recommendation}</span>

        {/* Tab bar */}
        <div className="flex mt-5 mb-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {(Object.keys(TAB_LABELS) as TabId[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-2 bg-transparent border-0 cursor-pointer text-[0.82rem] whitespace-nowrap shrink-0 transition-all duration-150 -mb-px"
              style={{
                fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? '#00e5ff' : '#5c6480',
                borderBottom: activeTab === t ? '2px solid #00e5ff' : '2px solid transparent',
              }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* ── Detail Tab ──────────────────────────────────────── */}
        {activeTab === 'detail' && (
          <>
            {isStale && onAnalyze && (
              <div className="flex items-center gap-2.5 px-3.5 py-2 mt-3.5 rounded-lg text-[0.82rem]"
                style={{ background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.3)' }}>
                <span>⏰ Data đã cũ ({freshness}). Phân tích lại để cập nhật trend.</span>
                <button className="btn btn-secondary shrink-0" style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                  onClick={() => { onAnalyze(kw.keyword); onClose(); }}>
                  ▶️ Phân tích ngay
                </button>
              </div>
            )}

            <div className="detail-grid mt-4">
              {scores.map(s => (
                <div key={s.label} className="detail-item">
                  <div className="label">{s.label} (/{s.max})</div>
                  <div className="value" style={{ color: scoreColor(s.value, s.max) }}>{s.value}</div>
                  <div className="text-[0.68rem] text-text-muted mt-0.5">{s.desc}</div>
                </div>
              ))}
              <div className="detail-item text-center" style={{ gridColumn: 'span 4' }}>
                <div className="label">Long-Form Score Tổng</div>
                <div className="value text-[2rem]" style={{ color: scoreColor(kw.longFormScore, 100) }}>
                  {kw.longFormScore}<span className="text-base text-text-muted">/100</span>
                </div>
              </div>
            </div>

            {api && api.longVideosFound > 0 && (
              <div className="detail-sub">
                <h3>▶️ Dữ liệu YouTube</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {([
                    ['Long video tìm thấy', api.longVideosFound],
                    ['Avg views / video', api.avgLongVideoViews ? Math.round(api.avgLongVideoViews / 1000) + 'k' : '—'],
                    ['Best view/sub ratio', api.bestViewSubRatio ? api.bestViewSubRatio.toFixed(1) + 'x' : '—'],
                    ['Kênh nhỏ cơ hội', api.hasSmallChannelOpportunity ? '✅ Có' : '—'],
                  ] as [string, string | number][]).map(([label, val]) => (
                    <div key={label} className="px-2.5 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-[0.7rem] text-text-muted">{label}</div>
                      <div className="font-semibold text-accent">{val}</div>
                    </div>
                  ))}
                </div>
                {api.refChannels?.length > 0 && (
                  <p className="text-[0.78rem] mt-2 text-text-secondary">
                    Kênh tham khảo: <strong>{api.refChannels.slice(0, 3).join(', ')}</strong>
                  </p>
                )}
              </div>
            )}

            {kw.chapters?.length > 0 && (
              <div className="detail-sub">
                <h3>🎬 Gợi ý Chapters (tiếng Nhật)</h3>
                <ol className="pl-5">
                  {kw.chapters.map((ch, i) => (
                    <li key={i} className="jp-text py-0.5 text-[0.88rem]">{ch}</li>
                  ))}
                </ol>
              </div>
            )}

            {kw.suggestedTitles?.length > 0 && (
              <div className="detail-sub">
                <h3>✏️ Gợi ý Tiêu đề (nội dung gốc)</h3>
                <ul>
                  {kw.suggestedTitles.map((t, i) => (
                    <li key={i} className="jp-text py-1 text-[0.88rem]">{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {kw.subKeywords?.length > 0 && (
              <div className="detail-sub">
                <h3>🔀 Sub-keywords liên quan</h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {kw.subKeywords.map(s => (
                    <span key={s} className="seed-tag jp-text text-[0.8rem]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(freshness || meta?.confidenceLevel) && (
              <div className="detail-sub pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h3>📊 Metadata dữ liệu</h3>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[0.78rem]">
                  {([
                    ['Nguồn dữ liệu', meta?.hasApiData ? 'YouTube Data API v3' : 'Rule-based'],
                    ['Thu thập lúc', meta?.collectedAt ? new Date(meta.collectedAt).toLocaleDateString('vi-VN') : '—'],
                    ['Freshness', freshness || '—'],
                    ['Confidence', meta?.confidenceLevel || '—'],
                    ['Time window', meta?.timeWindowDays ? meta.timeWindowDays + ' ngày' : '—'],
                    ['Region', meta?.regionCode || 'JP'],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="text-text-muted">
                      <span>{k}: </span>
                      <span style={{ color: k === 'Freshness' ? getFreshnessColor(v as Parameters<typeof getFreshnessColor>[0]) : '#e8eaf6' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kw.reason && (
              <div className="detail-sub">
                <h3>📝 Phân tích</h3>
                <p className="text-text-secondary text-[0.88rem]">{kw.reason}</p>
              </div>
            )}
          </>
        )}

        {/* ── Trend Tab ────────────────────────────────────────── */}
        {activeTab === 'trend' && (
          <div className="mt-4">
            <div className="flex gap-1.5 mb-3.5">
              {(['7d', '30d', '90d', 'all'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1 rounded-2xl text-[0.78rem] cursor-pointer transition-all duration-150"
                  style={{
                    background: period === p ? '#00e5ff' : 'rgba(255,255,255,0.04)',
                    color: period === p ? '#000' : '#5c6480',
                    border: period === p ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    fontWeight: period === p ? 700 : 400,
                  }}>
                  {p === 'all' ? 'Tất cả' : p}
                </button>
              ))}
            </div>

            {loadingSnaps && (
              <div className="text-center py-10 text-text-muted">
                <span className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            )}

            {!loadingSnaps && chartData.length < 2 && (
              <div className="text-center px-5 py-8 rounded-xl text-text-muted text-[0.88rem]"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-3xl mb-2">📭</div>
                <p>Chưa đủ data để hiển thị trend.</p>
                <p className="text-[0.78rem] mt-1">Phân tích lại keyword này sau 7 ngày để xem biểu đồ.</p>
                {onAnalyze && (
                  <button className="btn btn-primary mt-3" style={{ padding: '7px 18px', fontSize: '0.82rem' }}
                    onClick={() => { onAnalyze(kw.keyword); onClose(); }}>
                    ▶️ Phân tích ngay
                  </button>
                )}
              </div>
            )}

            {!loadingSnaps && chartData.length >= 2 && (
              <>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] mb-3.5"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-[1.6rem]">{trend.badge ?? '➡️'}</span>
                  <div>
                    <div className="font-bold" style={{ color: trend.direction === 'rising' ? '#00e676' : trend.direction === 'declining' ? '#ff1744' : '#e8eaf6' }}>
                      {trend.direction === 'rising' ? 'Đang tăng' : trend.direction === 'declining' ? 'Đang giảm' : 'Ổn định'}
                      {' '}<span className="text-[0.85rem]">({trend.label})</span>
                    </div>
                    <div className="text-[0.75rem] text-text-muted">
                      Score thay đổi: {trend.scoreDelta > 0 ? '+' : ''}{trend.scoreDelta} pts · Confidence: {trend.confidence} · {periodSnaps.length} snapshot
                    </div>
                  </div>
                </div>

                <ChartContainer aspectRatio={16/6} minHeight={220}>
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
                      <Line yAxisId="score" type="monotone" dataKey="score" name="LF Score" stroke="#00e5ff" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="views" type="monotone" dataKey="views" name="Avg Views" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </>
            )}
          </div>
        )}

        {activeTab === 'feedback'     && <FeedbackPanel kw={kw} personalScoring={personalScoring} />}
        {activeTab === 'seo'          && <Suspense fallback={LazyFallback}><SeoTab keyword={kw} refVideos={refVideos} /></Suspense>}
        {activeTab === 'monetization' && <Suspense fallback={LazyFallback}><MonetizationTab keyword={kw} lang={kw.contentLanguage ?? 'ja'} /></Suspense>}
        {activeTab === 'thumbnail'    && <Suspense fallback={LazyFallback}><ThumbnailTab keyword={kw} lang={kw.contentLanguage ?? 'ja'} /></Suspense>}
      </div>
    </div>
  );
}

// ── Feedback Panel ────────────────────────────────────────────
const PERF_OPTIONS: Array<{ value: PerformanceRating; emoji: string; label: string; color: string }> = [
  { value: 'great',   emoji: '⭐', label: 'Great',   color: '#4ade80' },
  { value: 'good',    emoji: '👍', label: 'Good',    color: '#60a5fa' },
  { value: 'bad',     emoji: '😐', label: 'Bad',     color: '#f59e0b' },
  { value: 'flopped', emoji: '💀', label: 'Flopped', color: '#f87171' },
];

function FeedbackPanel({ kw, personalScoring }: { kw: Keyword; personalScoring?: UsePersonalScoringReturn }) {
  const existing = personalScoring?.getFeedback(kw.keyword);
  const [madeVideo, setMadeVideo] = useState<boolean>(existing?.made_video ?? false);
  const [perf,      setPerf]      = useState<PerformanceRating | undefined>(existing?.performance);
  const [views,     setViews]     = useState<string>(String(existing?.actual_views ?? ''));
  const [notes,     setNotes]     = useState<string>(existing?.notes ?? '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  async function handleSave() {
    if (!personalScoring) return;
    setSaving(true);
    await personalScoring.submitFeedback({
      keyword: kw, made_video: madeVideo,
      performance: madeVideo ? perf : undefined,
      actual_views: views ? parseInt(views) : undefined,
      notes: notes || undefined,
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!personalScoring) {
    return (
      <div className="p-8 text-center text-text-muted text-[0.85rem]">
        Personalized Scoring chưa được kết nối. Vào Settings → Bật Personalized Scoring.
      </div>
    );
  }

  return (
    <div className="px-1 py-5 flex flex-col gap-4">
      {/* Made video? */}
      <div>
        <p className="text-[0.88rem] text-text-secondary mb-2.5">🎞️ Bạn đã làm video về keyword này chưa?</p>
        <div className="flex gap-2">
          {[{ v: false, label: 'Chưa' }, { v: true, label: 'Đã làm' }].map(opt => (
            <button key={String(opt.v)} onClick={() => setMadeVideo(opt.v)}
              className="btn btn-secondary" style={{
                padding: '7px 18px', fontSize: '0.85rem',
                background: madeVideo === opt.v ? '#00e5ff' : '',
                color: madeVideo === opt.v ? '#000' : '',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {madeVideo && (
        <>
          <div>
            <p className="text-[0.85rem] text-text-secondary mb-2.5">Performance:</p>
            <div className="flex gap-2 flex-wrap">
              {PERF_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setPerf(opt.value)}
                  className="btn btn-secondary" style={{
                    padding: '7px 14px', fontSize: '0.85rem',
                    background: perf === opt.value ? opt.color + '33' : '',
                    border: perf === opt.value ? `1px solid ${opt.color}` : '',
                    color: perf === opt.value ? opt.color : '',
                  }}>
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[0.82rem] text-text-muted mb-1.5">Actual views:</label>
            <input type="number" value={views} onChange={e => setViews(e.target.value)}
              placeholder="Ví dụ: 15000" className="w-full box-border" />
          </div>
        </>
      )}

      <div>
        <label className="block text-[0.82rem] text-text-muted mb-1.5">Notes:</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          rows={3} placeholder="Ghi chú thêm..." className="w-full box-border resize-y" />
      </div>

      <button className="btn btn-primary self-start" style={{ padding: '8px 20px' }}
        onClick={handleSave} disabled={saving}>
        {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang lưu...</> : saved ? '✓ Đã lưu!' : '💾 Lưu feedback'}
      </button>

      {existing && (
        <div className="text-[0.72rem] text-text-muted px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          Đã lưu: {existing.performance || 'Chưa có rating'}{existing.actual_views ? ` · ${existing.actual_views.toLocaleString()} views` : ''}
        </div>
      )}
    </div>
  );
}
