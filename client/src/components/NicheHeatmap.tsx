import React, { useState, useCallback, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { TreemapNode } from 'recharts';
import type { Keyword, Niche } from '../types';
import { buildHeatmapData, NICHE_EMOJI, type NicheStats } from '../engine/heatmapData.ts';

const HEATMAP_VISIBLE_KEY = 'ytlf_heatmap_visible';

interface NicheHeatmapProps {
  keywords: Keyword[];
  onSelectNiche: (niche: Niche | '') => void;
  activeNiche: string;
}

// ── Custom Treemap Cell ───────────────────────────────────────
// Recharts passes TreemapNode merged with original data object into content()
type CellProps = TreemapNode & NicheStats & {
  activeNiche: string;
  onClick: (name: string) => void;
};

function CustomCell(props: CellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', color = '#888', count = 0, avgScore = 0, activeNiche, onClick } = props;
  if (!width || !height || width < 10 || height < 10) return null;

  const isActive = activeNiche === name;
  const emoji = NICHE_EMOJI[name] || '📌';
  const showLabel = width > 50 && height > 35;
  const showCount = width > 80 && height > 55;
  const displayName = name.length > 12 ? name.slice(0, 11) + '…' : name;
  const fontSize = Math.min(12, Math.max(8, width / 9));

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onClick(name)}>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        rx={6}
        ry={6}
        fill={color}
        fillOpacity={isActive ? 1 : 0.72}
        stroke={isActive ? '#fff' : 'rgba(0,0,0,0.25)'}
        strokeWidth={isActive ? 2.5 : 1}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (showCount ? 9 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize, fontWeight: 700, fill: 'rgba(0,0,0,0.85)', pointerEvents: 'none', userSelect: 'none' }}
          >
            {emoji} {displayName}
          </text>
          {showCount && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 9}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: Math.max(8, fontSize - 2), fill: 'rgba(0,0,0,0.6)', pointerEvents: 'none', userSelect: 'none' }}
            >
              {count} KW · {avgScore}đ
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ── Tooltip content ───────────────────────────────────────────
interface TooltipPayload { payload?: NicheStats }
function HeatmapTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div style={{
      background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
      padding: '10px 14px', fontSize: '0.82rem', minWidth: 180,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: d.color, fontSize: '0.9rem' }}>
        {NICHE_EMOJI[d.niche] || '📌'} {d.niche}
      </div>
      <div style={{ color: '#ccc', marginBottom: 4 }}>
        {d.count} keyword · Avg score:{' '}
        <strong style={{ color: d.color }}>{d.avgScore}</strong>/100
      </div>
      {d.topKeywords?.length > 0 && (
        <div style={{ color: '#888', fontSize: '0.74rem', lineHeight: 1.5 }}>
          🏆 Top: {d.topKeywords.map(k => k.keyword).join(' · ')}
        </div>
      )}
      <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 5 }}>
        Click để lọc keyword table
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function NicheHeatmap({ keywords, onSelectNiche, activeNiche }: NicheHeatmapProps) {
  const [visible, setVisible] = useState<boolean>(() => {
    try { return localStorage.getItem(HEATMAP_VISIBLE_KEY) !== 'false'; } catch { return true; }
  });

  const data = useMemo(() => buildHeatmapData(keywords), [keywords]);

  const toggleVisible = useCallback(() => {
    setVisible(v => {
      const next = !v;
      try { localStorage.setItem(HEATMAP_VISIBLE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleCellClick = useCallback((name: string) => {
    onSelectNiche((activeNiche === name ? '' : name) as Niche | '');
  }, [activeNiche, onSelectNiche]);

  const handleTreemapClick = useCallback((node: TreemapNode) => {
    const name = (node as unknown as { name?: string }).name;
    if (name) handleCellClick(name);
  }, [handleCellClick]);

  if (!data.length) return null;

  const totalKw = data.reduce((s, d) => s + d.count, 0);
  const mapHeight = Math.min(300, Math.max(160, Math.ceil(data.length / 3) * 80));

  const LEGEND = [
    { label: '≥80', color: '#4ade80' },
    { label: '65–79', color: '#facc15' },
    { label: '50–64', color: '#fb923c' },
    { label: '<50',  color: '#f87171' },
  ];

  return (
    <section className="card" style={{ marginBottom: 12, padding: '14px 16px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: visible ? 14 : 0, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem' }}>
            🗺️ Niche Overview
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({totalKw} keyword · {data.length} niche)
          </span>
          {activeNiche && (
            <button
              onClick={() => onSelectNiche('')}
              style={{ fontSize: '0.72rem', background: 'rgba(0,229,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10, padding: '2px 8px', cursor: 'pointer' }}
            >
              {NICHE_EMOJI[activeNiche]} {activeNiche} ✕
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {visible && (
            <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: 'var(--text-muted)', alignItems: 'center' }}>
              {LEGEND.map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={toggleVisible}
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.72rem' }}
          >
            {visible ? '▲ Ẩn' : '▼ Heatmap'}
          </button>
        </div>
      </div>

      {visible && (
        <div style={{ height: mapHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={16 / 5}
              onClick={handleTreemapClick}
              content={(props: unknown) => {
                const p = props as CellProps;
                return (
                  <CustomCell
                    {...p}
                    activeNiche={activeNiche}
                    onClick={handleCellClick}
                  />
                );
              }}
            >
              <Tooltip content={(p: unknown) => {
                const tp = p as { active?: boolean; payload?: TooltipPayload[] };
                return <HeatmapTooltip active={tp.active} payload={tp.payload} />;
              }} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
