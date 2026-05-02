// ============================================================
// components/SeoTab.tsx — Phase 12: SEO Score UI
// ============================================================
import React, { useMemo, useState } from 'react';
import type { Keyword, RefVideo } from '../types';
import { analyzeSeo } from '../engine/seoAnalyzer.ts';
import type { SeoAnalysis, TagSuggestion } from '../engine/seoAnalyzer.ts';

interface SeoTabProps {
  keyword: Keyword;
  refVideos: RefVideo[];
}

// ── Small helpers ──────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  if (score >= 40) return '#fb923c';
  return '#f87171';
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      style={{
        padding: '4px 12px', fontSize: '0.78rem', borderRadius: 6,
        background: copied ? 'rgba(74,222,128,0.15)' : 'var(--glass)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'var(--glass-border)'}`,
        color: copied ? '#4ade80' : 'var(--text-muted)', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied!' : `📋 ${label}`}
    </button>
  );
}

// ── Title Score Bar ────────────────────────────────────────────
function TitleLengthBar({ analysis }: { analysis: SeoAnalysis['titleAnalysis'] }) {
  const { length, optimalMin, optimalMax, ideal } = analysis;
  const maxDisplay = optimalMax + 20;
  const pct = (length / maxDisplay) * 100;
  const minPct = (optimalMin / maxDisplay) * 100;
  const maxPct = (optimalMax / maxDisplay) * 100;

  const barColor = analysis.status === 'optimal' ? '#4ade80'
    : analysis.status === 'too_long' ? '#f87171' : '#fb923c';

  return (
    <div style={{ marginTop: 10 }}>
      {/* Bar */}
      <div style={{ position: 'relative', height: 8, background: 'var(--glass)', borderRadius: 4, overflow: 'visible' }}>
        {/* Optimal zone highlight */}
        <div style={{
          position: 'absolute', top: 0, left: `${minPct}%`,
          width: `${maxPct - minPct}%`, height: '100%',
          background: 'rgba(74,222,128,0.15)', borderRadius: 4,
        }} />
        {/* Ideal marker */}
        <div style={{
          position: 'absolute', top: -2, left: `${(ideal / maxDisplay) * 100}%`,
          width: 2, height: 12, background: 'rgba(74,222,128,0.5)', borderRadius: 1,
        }} />
        {/* Current length fill */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: `${Math.min(pct, 100)}%`, height: '100%',
          background: barColor, borderRadius: 4, transition: 'width 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
        <span>{optimalMin}</span>
        <span style={{ color: barColor, fontWeight: 600 }}>{length} ký tự</span>
        <span>{optimalMax}</span>
      </div>
    </div>
  );
}

// ── Tag Grid ──────────────────────────────────────────────────
function TagGrid({ tags, onCopyAll }: { tags: TagSuggestion[]; onCopyAll: () => void }) {
  const top = tags.filter(t => t.recommended);
  const rest = tags.filter(t => !t.recommended);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? tags : top;
  const allTagText = top.map(t => t.tag).join(', ');

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {displayed.map(tag => (
          <span
            key={tag.tag}
            title={`${tag.source} · ${tag.frequency} video`}
            style={{
              padding: '3px 10px', borderRadius: 14, fontSize: '0.8rem',
              background: tag.recommended ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tag.recommended ? 'rgba(0,229,255,0.25)' : 'var(--glass-border)'}`,
              color: tag.recommended ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'default',
            }}
          >
            {tag.tag}
            {tag.frequency > 0 && (
              <span style={{ fontSize: '0.68rem', marginLeft: 4, opacity: 0.6 }}>×{tag.frequency}</span>
            )}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <CopyButton text={allTagText} label="Copy top 15 tags" />
        {rest.length > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{ fontSize: '0.78rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}
          >
            {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${rest.length} tag`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Description Editor ────────────────────────────────────────
function DescriptionEditor({ template }: { template: string }) {
  const [text, setText] = useState(template);

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={12}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
          color: 'var(--text)', borderRadius: 8, padding: '10px 12px',
          fontSize: '0.78rem', lineHeight: 1.6, fontFamily: 'monospace',
          resize: 'vertical',
        }}
      />
      <div style={{ marginTop: 6 }}>
        <CopyButton text={text} label="Copy template" />
      </div>
    </div>
  );
}

// ── Density Table ─────────────────────────────────────────────
function DensityTable({ density }: { density: SeoAnalysis['keywordDensity'] }) {
  const max = density[0]?.count ?? 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {density.slice(0, 10).map(d => (
        <div key={d.token} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem' }}>
          <span style={{ minWidth: 100, color: 'var(--text)', fontWeight: 500 }}>{d.token}</span>
          <div style={{ flex: 1, background: 'var(--glass)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(d.count / max) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
          </div>
          <span style={{ minWidth: 80, color: 'var(--text-muted)', textAlign: 'right' }}>
            {d.count}× · {d.videoCount}/{density.length > 0 ? '—' : 0} video
          </span>
        </div>
      ))}
    </div>
  );
}

// ── SEO Score Circle ──────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px', transition: 'stroke-dashoffset 0.6s' }}
        />
        <text x={36} y={40} textAnchor="middle" fontSize={15} fontWeight={700} fill={color}>{score}</text>
      </svg>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SEO Score</span>
    </div>
  );
}

// ── Main SEO Tab ──────────────────────────────────────────────
export default function SeoTab({ keyword, refVideos }: SeoTabProps) {
  const analysis = useMemo(
    () => analyzeSeo(keyword, refVideos),
    [keyword.keyword, refVideos.length],
  );

  // Empty state
  if (!analysis.hasData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎯</div>
        <p style={{ fontSize: '0.9rem', marginBottom: 6 }}>Chưa có dữ liệu YouTube</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Phân tích keyword này trong tab <strong>YouTube Research</strong> trước để xem SEO insights.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 14 }}>

      {/* ── Overall Score Row ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 16px', background: 'var(--glass)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
        <ScoreCircle score={analysis.overallScore} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>SEO Opportunity Score</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dựa trên {refVideos.length} video top · {analysis.suggestedTags.filter(t => t.recommended).length} tag gợi ý · {analysis.keywordDensity.length} token phổ biến
          </div>
        </div>
      </div>

      {/* ── Title Analysis ─────────────────────────────────────── */}
      <div className="detail-sub">
        <h3>📝 Phân tích Title</h3>
        <TitleLengthBar analysis={analysis.titleAnalysis} />
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {analysis.titleAnalysis.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8rem' }}>
              <span>{rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : '❌'}</span>
              <span style={{ color: rec.type === 'success' ? '#4ade80' : rec.type === 'warning' ? '#fb923c' : '#f87171' }}>
                {rec.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Title Suggestions ──────────────────────────────────── */}
      <div className="detail-sub">
        <h3>💡 Gợi ý Title</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {analysis.suggestedTitles.map((st, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)' }}
            >
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text)' }}>{st.title}</span>
              <span style={{
                fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, flexShrink: 0,
                background: st.length >= analysis.titleAnalysis.optimalMin && st.length <= analysis.titleAnalysis.optimalMax
                  ? 'rgba(74,222,128,0.12)' : 'rgba(251,146,60,0.12)',
                color: st.length >= analysis.titleAnalysis.optimalMin && st.length <= analysis.titleAnalysis.optimalMax
                  ? '#4ade80' : '#fb923c',
              }}>
                {st.length} ký tự
              </span>
              <CopyButton text={st.title} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Tag Suggestions ────────────────────────────────────── */}
      <div className="detail-sub">
        <h3>🏷️ Tags gợi ý ({analysis.suggestedTags.filter(t => t.recommended).length} recommended)</h3>
        <TagGrid
          tags={analysis.suggestedTags}
          onCopyAll={() => {}}
        />
      </div>

      {/* ── Description Template ───────────────────────────────── */}
      <div className="detail-sub">
        <h3>📄 Description Template</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          Có thể chỉnh sửa trực tiếp rồi copy.
        </p>
        <DescriptionEditor template={analysis.descriptionTemplate} />
      </div>

      {/* ── Keyword Density ────────────────────────────────────── */}
      {analysis.keywordDensity.length > 0 && (
        <div className="detail-sub">
          <h3>📊 Keyword Density (từ top {refVideos.length} video)</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            Các token phổ biến nhất trong title của video top.
          </p>
          <DensityTable density={analysis.keywordDensity} />
        </div>
      )}
    </div>
  );
}
