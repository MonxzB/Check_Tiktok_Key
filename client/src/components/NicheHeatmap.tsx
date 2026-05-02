import React, { useState, useCallback, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer.tsx';
import type { TreemapNode } from 'recharts';
import type { Keyword, Niche } from '../types';
import { buildHeatmapData, NICHE_EMOJI, type NicheStats } from '../engine/heatmapData.ts';

const HEATMAP_VISIBLE_KEY = 'ytlf_heatmap_visible';
const LEGEND = [
  { label: '≥80', color: '#4ade80' },
  { label: '65–79', color: '#facc15' },
  { label: '50–64', color: '#fb923c' },
  { label: '<50',  color: '#f87171' },
];

// ── Custom Treemap Cell ───────────────────────────────────────
type CellProps = TreemapNode & NicheStats & { activeNiche: string; onClick: (name: string) => void; };

function CustomCell(props: CellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', color = '#888', count = 0, avgScore = 0, activeNiche, onClick } = props;
  if (!width || !height || width < 10 || height < 10) return null;
  const isActive   = activeNiche === name;
  const emoji      = NICHE_EMOJI[name] || '📌';
  const showLabel  = width > 50 && height > 35;
  const showCount  = width > 80 && height > 55;
  const displayName = name.length > 12 ? name.slice(0, 11) + '…' : name;
  const fontSize   = Math.min(12, Math.max(8, width / 9));
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onClick(name)}>
      <rect x={x+1} y={y+1} width={width-2} height={height-2} rx={6} ry={6}
        fill={color} fillOpacity={isActive ? 1 : 0.72}
        stroke={isActive ? '#fff' : 'rgba(0,0,0,0.25)'} strokeWidth={isActive ? 2.5 : 1} />
      {showLabel && (
        <>
          <text x={x+width/2} y={y+height/2-(showCount?9:0)} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize, fontWeight: 700, fill: 'rgba(0,0,0,0.85)', pointerEvents: 'none', userSelect: 'none' }}>
            {emoji} {displayName}
          </text>
          {showCount && (
            <text x={x+width/2} y={y+height/2+9} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: Math.max(8, fontSize-2), fill: 'rgba(0,0,0,0.6)', pointerEvents: 'none', userSelect: 'none' }}>
              {count} KW · {avgScore}đ
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ── Tooltip ───────────────────────────────────────────────────
interface TooltipPayload { payload?: NicheStats }
function HeatmapTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="px-3.5 py-2.5 rounded-[10px] text-[0.82rem] min-w-[180px]"
      style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div className="font-bold mb-1.5 text-[0.9rem]" style={{ color: d.color }}>
        {NICHE_EMOJI[d.niche] || '📌'} {d.niche}
      </div>
      <div className="text-[#ccc] mb-1">
        {d.count} keyword · Avg score: <strong style={{ color: d.color }}>{d.avgScore}</strong>/100
      </div>
      {d.topKeywords?.length > 0 && (
        <div className="text-[#888] text-[0.74rem] leading-relaxed">
          🏆 Top: {d.topKeywords.map(k => k.keyword).join(' · ')}
        </div>
      )}
      <div className="text-[0.68rem] text-[#555] mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        Click để lọc keyword table
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function NicheHeatmap({ keywords, onSelectNiche, activeNiche }: {
  keywords: Keyword[]; onSelectNiche: (niche: Niche | '') => void; activeNiche: string;
}) {
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

  return (
    <section className="card mb-3 px-4 py-3.5">
      {/* Header */}
      <div className={`flex items-center justify-between flex-wrap gap-2 ${visible ? 'mb-3.5' : ''}`}>
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-[0.95rem]">🗺️ Niche Overview</h2>
          <span className="text-[0.75rem] text-text-muted">({totalKw} keyword · {data.length} niche)</span>
          {activeNiche && (
            <button onClick={() => onSelectNiche('')}
              className="text-[0.72rem] text-accent cursor-pointer px-2 py-0.5 rounded-[10px]"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}>
              {NICHE_EMOJI[activeNiche]} {activeNiche} ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {visible && (
            <div className="flex gap-2 text-[0.68rem] text-text-muted items-center">
              {LEGEND.map(l => (
                <span key={l.label} className="flex items-center gap-0.5">
                  <span className="rounded-sm inline-block" style={{ width: 9, height: 9, background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
          <button onClick={toggleVisible} className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
            {visible ? '▲ Ẩn' : '▼ Heatmap'}
          </button>
        </div>
      </div>

      {visible && (
        <ChartContainer aspectRatio={16/5} minHeight={180}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data as unknown as Record<string, unknown>[]}
              dataKey="size" aspectRatio={16/5}
              onClick={handleTreemapClick}
              content={(props: unknown) => {
                const p = props as CellProps;
                return <CustomCell {...p} activeNiche={activeNiche} onClick={handleCellClick} />;
              }}
            >
              <Tooltip content={(p: unknown) => {
                const tp = p as { active?: boolean; payload?: TooltipPayload[] };
                return <HeatmapTooltip active={tp.active} payload={tp.payload} />;
              }} />
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </section>
  );
}
