// ============================================================
// components/reupStrategy/StrategyCard.tsx — Phase 19
// ============================================================
import React, { useState } from 'react';
import type { Strategy } from '../../lib/reupAdvisor/strategyTypes.ts';
import ConfigExporter from './ConfigExporter.tsx';

interface Props {
  strategy: Strategy;
  isSelected?: boolean;
  isCompareActive?: boolean;
  onUseThis?: (strategyId: string) => void;
  onToggleCompare?: (strategyId: string) => void;
  onRate?: (rating: number) => void;
  savedRating?: number | null;
}

function SafetyBar({ score }: { score: number }) {
  const color = score >= 8 ? 'var(--green)' : score >= 6 ? 'var(--accent)' : score >= 4 ? 'var(--orange)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color, minWidth: 16 }}>{score}</span>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
            color: n <= (hover || value || 0) ? '#ffea00' : 'rgba(255,255,255,0.15)',
            transition: 'color 0.15s', padding: '0 1px',
          }}
          aria-label={`Đánh giá ${n} sao`}
        >★</button>
      ))}
    </div>
  );
}

export default function StrategyCard({
  strategy, isSelected, isCompareActive, onUseThis, onToggleCompare, onRate, savedRating,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const outputBadge = {
    shorts: { label: '📱 Shorts', color: 'var(--accent)' },
    longform: { label: '🎬 Long-form', color: 'var(--green)' },
    mixed: { label: '🔀 Mixed', color: 'var(--orange)' },
    duet: { label: '🤝 Duet', color: 'var(--accent2)' },
  }[strategy.outputType];

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', 'var(--text-muted)', 'var(--text-muted)'];

  return (
    <div
      style={{
        background: isSelected
          ? 'rgba(0,229,255,0.06)'
          : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'rgba(0,229,255,0.35)' : isCompareActive ? 'rgba(124,77,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {/* Rank badge */}
      <div style={{
        position: 'absolute', top: 12, right: 14,
        fontSize: '0.75rem', fontWeight: 700, color: rankColors[strategy.rank - 1],
      }}>
        #{strategy.rank}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{strategy.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{strategy.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              background: `${outputBadge.color}18`, color: outputBadge.color,
              border: `1px solid ${outputBadge.color}40`,
              borderRadius: 20, padding: '1px 10px', fontSize: '0.72rem', fontWeight: 600,
            }}>
              {outputBadge.label}
            </span>
            {strategy.estimatedClips > 0 && (
              <span className="score-badge score-med">
                📹 {strategy.estimatedClips} clip
              </span>
            )}
            <span className="score-badge score-high">
              ⏱ ~{Math.round(strategy.estimatedClipDuration / 60) > 0
                ? `${Math.round(strategy.estimatedClipDuration / 60)}p`
                : `${strategy.estimatedClipDuration}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>🛡️ An toàn</div>
          <SafetyBar score={strategy.safetyScore} />
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>⚡ Công sức</div>
          <SafetyBar score={strategy.effortScore} />
        </div>
      </div>

      {/* Reasoning */}
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
        {strategy.reasoning}
      </p>

      {/* Expandable pros/cons */}
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginBottom: expanded ? 10 : 0 }}
      >
        {expanded ? '▲ Thu gọn' : '▼ Xem Pros/Cons'}
      </button>

      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>✅ PROS</div>
            {strategy.pros.map((p, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: 8, marginBottom: 2 }}>
                • {p}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 600, marginBottom: 4 }}>⚠️ CONS</div>
            {strategy.cons.map((c, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: 8, marginBottom: 2 }}>
                • {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config exporter */}
      <button
        onClick={() => setShowConfig(p => !p)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginBottom: showConfig ? 4 : 0 }}
      >
        {showConfig ? '▲ Ẩn Config JSON' : '▼ Xem Config JSON'}
      </button>
      {showConfig && <ConfigExporter strategy={strategy} />}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        {onUseThis && (
          <button
            className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => onUseThis(strategy.id)}
          >
            {isSelected ? '✅ Đã chọn' : '✅ Dùng chiến lược này'}
          </button>
        )}
        {onToggleCompare && (
          <button
            className="btn btn-secondary"
            style={{
              padding: '6px 12px', fontSize: '0.78rem',
              ...(isCompareActive ? { borderColor: 'var(--accent2)', color: 'var(--accent2)' } : {}),
            }}
            onClick={() => onToggleCompare(strategy.id)}
          >
            {isCompareActive ? '☑ So sánh' : '☐ So sánh'}
          </button>
        )}
        {onRate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Đánh giá:</span>
            <StarRating value={savedRating ?? null} onChange={onRate} />
          </div>
        )}
      </div>
    </div>
  );
}
