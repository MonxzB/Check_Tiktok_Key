// ============================================================
// components/reupStrategy/StrategyComparisonModal.tsx — Phase 19
// ============================================================
import React from 'react';
import type { Strategy } from '../../lib/reupAdvisor/strategyTypes.ts';

interface Props {
  strategies: Strategy[];
  onClose: () => void;
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 7 ? 'var(--green)' : score >= 5 ? 'var(--accent)' : 'var(--orange)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.72rem', color, fontWeight: 700, minWidth: 20 }}>{score}/10</span>
    </div>
  );
}

const ROWS: { label: string; render: (s: Strategy) => React.ReactNode }[] = [
  { label: 'Loại output', render: s => (
    <span style={{ fontSize: '0.8rem' }}>
      {{ shorts: '📱 Shorts', longform: '🎬 Long-form', mixed: '🔀 Mixed', duet: '🤝 Duet' }[s.outputType]}
    </span>
  )},
  { label: '🛡️ An toàn (copyright)', render: s => <ScoreBar score={s.safetyScore} /> },
  { label: '⚡ Công sức cần bỏ', render: s => <ScoreBar score={s.effortScore} /> },
  { label: '📹 Số clip ước tính', render: s => <strong style={{ color: 'var(--accent)' }}>{s.estimatedClips}</strong> },
  { label: '⏱ Thời lượng/clip', render: s => {
    const sec = s.estimatedClipDuration;
    const txt = sec >= 60 ? `${Math.round(sec/60)}p` : `${sec}s`;
    return <strong>{txt}</strong>;
  }},
  { label: '🔀 Phá cắt', render: s => s.config.breakCut.enabled
    ? <span style={{ color: 'var(--orange)' }}>Bật ({s.config.breakCut.keep}s giữ / {s.config.breakCut.skip}s bỏ)</span>
    : <span style={{ color: 'var(--text-muted)' }}>Tắt</span>
  },
  { label: '🎮 Duet', render: s => s.config.duet.enabled
    ? <span style={{ color: 'var(--accent2)' }}>Bật ({s.config.duet.bgVideoCategory})</span>
    : <span style={{ color: 'var(--text-muted)' }}>Tắt</span>
  },
  { label: '🎵 Audio Swap', render: s => s.config.audioSwap
    ? <span style={{ color: 'var(--yellow)' }}>Bật</span>
    : <span style={{ color: 'var(--text-muted)' }}>Tắt</span>
  },
  { label: '✅ PROS', render: s => (
    <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: '0.75rem', color: 'var(--green)' }}>
      {s.pros.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  )},
  { label: '⚠️ CONS', render: s => (
    <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: '0.75rem', color: 'var(--orange)' }}>
      {s.cons.map((c, i) => <li key={i}>{c}</li>)}
    </ul>
  )},
];

export default function StrategyComparisonModal({ strategies, onClose }: Props) {
  const cols = strategies.slice(0, 3);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="So sánh chiến lược" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h2>⚖️ So sánh chiến lược</h2>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div style={{ overflowX: 'auto', padding: '16px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '22%', fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  Tiêu chí
                </th>
                {cols.map(s => (
                  <th key={s.id} style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    {s.emoji} {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', verticalAlign: 'top', fontWeight: 600 }}>
                    {row.label}
                  </td>
                  {cols.map(s => (
                    <td key={s.id} style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'center' }}>
                      {row.render(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 0 0', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
