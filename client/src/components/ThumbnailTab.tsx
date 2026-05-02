// ============================================================
// components/ThumbnailTab.tsx — Phase 15: Thumbnail A/B Ideas
// ============================================================
import React, { useMemo, useState } from 'react';
import type { Keyword } from '../types';
import type { ContentLanguage } from '../engine/languages/index';
import { generateThumbnailIdeas } from '../engine/thumbnailIdeas.ts';
import type { ThumbnailConcept } from '../engine/thumbnailIdeas.ts';

interface ThumbnailTabProps {
  keyword: Keyword;
  lang?: ContentLanguage;
}

const CTR_COLORS = { high: '#4ade80', medium: '#facc15', low: '#94a3b8' };
const CTR_LABELS = { high: '🔥 CTR Cao', medium: '📊 CTR Trung bình', low: '🎨 CTR Ổn định' };

// ── Color Swatch ──────────────────────────────────────────────
function ColorSwatch({ colors }: { colors: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {colors.map((c, i) => (
        <div
          key={i}
          title={c}
          data-tooltip={c}
          style={{
            width: 18, height: 18, borderRadius: 4, background: c,
            border: '1px solid rgba(255,255,255,0.15)', cursor: 'help',
          }}
        />
      ))}
    </div>
  );
}

// ── Concept Card ──────────────────────────────────────────────
function ConceptCard({ concept, isAB }: { concept: ThumbnailConcept; isAB: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyHook() {
    navigator.clipboard.writeText(concept.ctaHook).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const abLabel = concept.abVariantOf ? 'B' : isAB ? 'A' : null;

  return (
    <div style={{
      background: 'var(--glass)', border: '1px solid var(--glass-border)',
      borderRadius: 12, padding: '14px 16px',
      transition: 'border-color 0.2s',
      borderLeft: `3px solid ${CTR_COLORS[concept.estimatedCtr]}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{concept.styleLabel}</span>
            {abLabel && (
              <span style={{
                padding: '1px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700,
                background: abLabel === 'A' ? 'rgba(99,102,241,0.2)' : 'rgba(244,114,182,0.2)',
                color: abLabel === 'A' ? '#818cf8' : '#f472b6',
                border: `1px solid ${abLabel === 'A' ? '#818cf8' : '#f472b6'}40`,
              }}>
                Variant {abLabel}
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: CTR_COLORS[concept.estimatedCtr], fontWeight: 600 }}>
              {CTR_LABELS[concept.estimatedCtr]}
            </span>
          </div>
          {/* Headline preview */}
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: 'rgba(0,0,0,0.3)', borderRadius: 8,
            fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em',
          }}>
            {concept.headline}
            {concept.subtext && (
              <div style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>
                {concept.subtext}
              </div>
            )}
          </div>
        </div>
        <ColorSwatch colors={concept.colorPalette} />
      </div>

      {/* Visual description */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
        🖼 {concept.visualDescription}
      </div>

      {/* Hook */}
      <div style={{
        background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: 8, padding: '8px 12px', marginBottom: 10,
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          🎬 Hook 3 giây đầu
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic' }}>
          "{concept.ctaHook}"
        </div>
        <button
          onClick={copyHook}
          style={{
            marginTop: 6, padding: '3px 10px', borderRadius: 6,
            fontSize: '0.7rem', cursor: 'pointer',
            background: copied ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${copied ? 'rgba(0,230,118,0.4)' : 'var(--glass-border)'}`,
            color: copied ? '#4ade80' : 'var(--text-muted)',
          }}
        >
          {copied ? '✓ Đã copy' : '📋 Copy hook'}
        </button>
      </div>

      {/* Tips toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
          color: 'var(--text-muted)', width: '100%', textAlign: 'left',
        }}
      >
        {expanded ? '▲' : '▼'} {concept.tips.length} Design Tips
      </button>
      {expanded && (
        <ul style={{ margin: '8px 0 0', padding: '0 0 0 16px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {concept.tips.map((tip, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── A/B Test Summary ──────────────────────────────────────────
function ABSummary({ concepts }: { concepts: ThumbnailConcept[] }) {
  const pairs: [ThumbnailConcept, ThumbnailConcept][] = [];
  for (let i = 0; i < concepts.length - 1; i += 2) {
    pairs.push([concepts[i], concepts[i + 1]]);
  }
  if (!pairs.length) return null;
  return (
    <div style={{
      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 16,
      fontSize: '0.8rem', color: 'var(--text-secondary)',
    }}>
      <strong style={{ color: '#818cf8' }}>📐 A/B Test Plan</strong>
      <div style={{ marginTop: 6 }}>
        {pairs.map(([a, b], i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            Test {i + 1}: <span style={{ color: '#818cf8' }}>{a.styleLabel}</span>
            {' '}vs <span style={{ color: '#f472b6' }}>{b.styleLabel}</span>
            {' '}— đăng cách nhau 7-14 ngày, so sánh CTR sau 48h đầu.
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ThumbnailTab({ keyword, lang = 'ja' }: ThumbnailTabProps) {
  const [count, setCount] = useState<4 | 6 | 8>(4);

  const ideaSet = useMemo(
    () => generateThumbnailIdeas(keyword, lang, count),
    [keyword.keyword, lang, count],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🎨 Thumbnail A/B Ideas</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Các concept thumbnail cho <span className="jp-text" style={{ color: 'var(--accent)' }}>{keyword.keyword}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: 4 }}>Số concept:</span>
          {([4, 6, 8] as const).map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
                background: count === n ? 'var(--accent)' : 'var(--glass)',
                border: `1px solid ${count === n ? 'var(--accent)' : 'var(--glass-border)'}`,
                color: count === n ? '#000' : 'var(--text)', fontWeight: count === n ? 700 : 400,
              }}
            >{n}</button>
          ))}
        </div>
      </div>

      {/* CTR legend */}
      <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        {Object.entries(CTR_LABELS).map(([k, v]) => (
          <span key={k} style={{ color: CTR_COLORS[k as keyof typeof CTR_COLORS] }}>{v}</span>
        ))}
      </div>

      {/* A/B plan */}
      <ABSummary concepts={ideaSet.concepts} />

      {/* Concept grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {ideaSet.concepts.map((c, i) => (
          <ConceptCard
            key={c.id}
            concept={c}
            isAB={i % 2 === 0 && i + 1 < ideaSet.concepts.length}
          />
        ))}
      </div>

      {/* Footer tips */}
      <div style={{
        fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.7,
        borderTop: '1px solid var(--glass-border)', paddingTop: 10,
      }}>
        💡 <strong>Quy tắc vàng:</strong> Thumbnail phải "đọc được" ở 120px. Test tối thiểu 2 variants trước khi chốt style chính.
        Ưu tiên màu sắc tương phản cao và text ≤ 5 từ.
      </div>
    </div>
  );
}
