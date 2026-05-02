import React, { useMemo, useState } from 'react';
import type { Keyword, RefVideo } from '../types';
import { analyzeSeo } from '../engine/seoAnalyzer.ts';
import type { SeoAnalysis, TagSuggestion } from '../engine/seoAnalyzer.ts';

interface SeoTabProps { keyword: Keyword; refVideos: RefVideo[]; }

function scoreColor(score: number) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  if (score >= 40) return '#fb923c';
  return '#f87171';
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  return (
    <button onClick={copy} className="transition-all duration-200"
      style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: 6,
        background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? '#4ade80' : '#5c6480', cursor: 'pointer' }}>
      {copied ? '✓ Copied!' : `📋 ${label}`}
    </button>
  );
}

function TitleLengthBar({ analysis }: { analysis: SeoAnalysis['titleAnalysis'] }) {
  const { length, optimalMin, optimalMax, ideal } = analysis;
  const maxDisplay = optimalMax + 20;
  const pct    = (length / maxDisplay) * 100;
  const minPct = (optimalMin / maxDisplay) * 100;
  const maxPct = (optimalMax / maxDisplay) * 100;
  const barColor = analysis.status === 'optimal' ? '#4ade80' : analysis.status === 'too_long' ? '#f87171' : '#fb923c';
  return (
    <div className="mt-2.5">
      <div className="relative h-2 rounded overflow-visible" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="absolute top-0 h-full rounded" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%`, background: 'rgba(74,222,128,0.15)' }} />
        <div className="absolute" style={{ top: -2, left: `${(ideal / maxDisplay) * 100}%`, width: 2, height: 12, background: 'rgba(74,222,128,0.5)', borderRadius: 1 }} />
        <div className="absolute top-0 left-0 h-full rounded transition-all duration-300" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
      </div>
      <div className="flex justify-between text-[0.72rem] text-text-muted mt-1">
        <span>{optimalMin}</span>
        <span className="font-semibold" style={{ color: barColor }}>{length} ký tự</span>
        <span>{optimalMax}</span>
      </div>
    </div>
  );
}

function TagGrid({ tags }: { tags: TagSuggestion[] }) {
  const top  = tags.filter(t => t.recommended);
  const rest = tags.filter(t => !t.recommended);
  const [showAll, setShowAll] = useState(false);
  const displayed  = showAll ? tags : top;
  const allTagText = top.map(t => t.tag).join(', ');
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {displayed.map(tag => (
          <span key={tag.tag} title={`${tag.source} · ${tag.frequency} video`}
            className="px-2.5 py-0.5 rounded-[14px] text-[0.8rem] cursor-default"
            style={{ background: tag.recommended ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tag.recommended ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: tag.recommended ? '#00e5ff' : '#5c6480' }}>
            {tag.tag}
            {tag.frequency > 0 && <span className="text-[0.68rem] ml-1 opacity-60">×{tag.frequency}</span>}
          </span>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <CopyButton text={allTagText} label="Copy top 15 tags" />
        {rest.length > 0 && (
          <button onClick={() => setShowAll(!showAll)}
            className="text-[0.78rem] text-text-muted cursor-pointer px-2 py-1"
            style={{ background: 'none', border: 'none' }}>
            {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${rest.length} tag`}
          </button>
        )}
      </div>
    </div>
  );
}

function DescriptionEditor({ template }: { template: string }) {
  const [text, setText] = useState(template);
  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={12}
        className="field-input font-mono text-[0.78rem] leading-relaxed resize-y" />
      <div className="mt-1.5"><CopyButton text={text} label="Copy template" /></div>
    </div>
  );
}

function DensityTable({ density }: { density: SeoAnalysis['keywordDensity'] }) {
  const max = density[0]?.count ?? 1;
  return (
    <div className="flex flex-col gap-1.5">
      {density.slice(0, 10).map(d => (
        <div key={d.token} className="flex items-center gap-2.5 text-[0.8rem]">
          <span className="min-w-[100px] font-medium">{d.token}</span>
          <div className="flex-1 rounded h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded" style={{ width: `${(d.count / max) * 100}%`, background: '#00e5ff' }} />
          </div>
          <span className="min-w-[80px] text-text-muted text-right">
            {d.count}× · {d.videoCount}/— video
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const r = 28, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ, color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px', transition: 'stroke-dashoffset 0.6s' }} />
        <text x={36} y={40} textAnchor="middle" fontSize={15} fontWeight={700} fill={color}>{score}</text>
      </svg>
      <span className="text-[0.72rem] text-text-muted">SEO Score</span>
    </div>
  );
}

export default function SeoTab({ keyword, refVideos }: SeoTabProps) {
  const analysis = useMemo(() => analyzeSeo(keyword, refVideos), [keyword.keyword, refVideos.length]);

  if (!analysis.hasData) {
    return (
      <div className="text-center py-10 text-text-muted">
        <div className="text-[2.5rem] mb-3">🎯</div>
        <p className="text-[0.9rem] mb-1.5">Chưa có dữ liệu YouTube</p>
        <p className="text-[0.78rem] text-text-muted">Phân tích keyword này trong tab <strong>YouTube Research</strong> trước để xem SEO insights.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 mt-3.5">
      {/* Score row */}
      <div className="flex items-center gap-5 px-4 py-3.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <ScoreCircle score={analysis.overallScore} />
        <div className="flex-1">
          <div className="font-bold text-[1rem] mb-1">SEO Opportunity Score</div>
          <div className="text-[0.8rem] text-text-muted">
            Dựa trên {refVideos.length} video top · {analysis.suggestedTags.filter(t => t.recommended).length} tag gợi ý · {analysis.keywordDensity.length} token phổ biến
          </div>
        </div>
      </div>

      {/* Title Analysis */}
      <div className="detail-sub">
        <h3>📝 Phân tích Title</h3>
        <TitleLengthBar analysis={analysis.titleAnalysis} />
        <div className="mt-2.5 flex flex-col gap-1.5">
          {analysis.titleAnalysis.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2 items-start text-[0.8rem]">
              <span>{rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : '❌'}</span>
              <span style={{ color: rec.type === 'success' ? '#4ade80' : rec.type === 'warning' ? '#fb923c' : '#f87171' }}>{rec.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Title Suggestions */}
      <div className="detail-sub">
        <h3>💡 Gợi ý Title</h3>
        <div className="flex flex-col gap-2 mt-2">
          {analysis.suggestedTitles.map((st, i) => {
            const optimal = st.length >= analysis.titleAnalysis.optimalMin && st.length <= analysis.titleAnalysis.optimalMax;
            return (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="flex-1 text-[0.85rem]">{st.title}</span>
                <span className="text-[0.7rem] px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: optimal ? 'rgba(74,222,128,0.12)' : 'rgba(251,146,60,0.12)', color: optimal ? '#4ade80' : '#fb923c' }}>
                  {st.length} ký tự
                </span>
                <CopyButton text={st.title} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div className="detail-sub">
        <h3>🏷️ Tags gợi ý ({analysis.suggestedTags.filter(t => t.recommended).length} recommended)</h3>
        <TagGrid tags={analysis.suggestedTags} />
      </div>

      {/* Description */}
      <div className="detail-sub">
        <h3>📄 Description Template</h3>
        <p className="text-[0.78rem] text-text-muted mb-2">Có thể chỉnh sửa trực tiếp rồi copy.</p>
        <DescriptionEditor template={analysis.descriptionTemplate} />
      </div>

      {/* Density */}
      {analysis.keywordDensity.length > 0 && (
        <div className="detail-sub">
          <h3>📊 Keyword Density (từ top {refVideos.length} video)</h3>
          <p className="text-[0.78rem] text-text-muted mb-2.5">Các token phổ biến nhất trong title của video top.</p>
          <DensityTable density={analysis.keywordDensity} />
        </div>
      )}
    </div>
  );
}
