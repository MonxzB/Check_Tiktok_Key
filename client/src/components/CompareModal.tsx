import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { toPng } from 'html-to-image';
import type { Keyword } from '../types';
import { ChartContainer } from './ChartContainer.tsx';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const AXES = [
  { key: 'demand',          label: 'Demand',        max: 20 },
  { key: 'searchIntent',    label: 'Search Intent', max: 15 },
  { key: 'topicDepth',      label: 'Topic Depth',   max: 15 },
  { key: 'smallChannel',    label: 'Small Channel', max: 15 },
  { key: 'evergreen',       label: 'Evergreen',     max: 10 },
  { key: 'seriesPotential', label: 'Series',        max: 10 },
  { key: 'longTailExp',     label: 'Long-tail',     max: 10 },
  { key: 'lowRisk',         label: 'Low Risk',      max: 5  },
];

type RowDef = { label: string; getValue: (kw: Keyword) => number | string; isScore?: boolean; };
const TABLE_ROWS: RowDef[] = [
  { label: 'Tổng điểm LF', getValue: k => k.longFormScore, isScore: true },
  ...AXES.map(a => ({ label: a.label, getValue: (k: Keyword) => (k as unknown as Record<string, number>)[a.key] ?? 0 })),
  { label: 'YT Long Videos', getValue: k => k.apiData?.longVideosFound ?? '—' },
  { label: 'Avg Views',      getValue: k => k.apiData?.avgLongVideoViews ? (k.apiData.avgLongVideoViews / 1000).toFixed(0) + 'k' : '—' },
  { label: 'Best Ratio',     getValue: k => k.apiData?.bestViewSubRatio ? k.apiData.bestViewSubRatio.toFixed(1) + 'x' : '—' },
  { label: 'Đề xuất',        getValue: k => k.recommendation },
];

export default function CompareModal({ keywords, onClose }: { keywords: Keyword[]; onClose: () => void }) {
  const chartRef   = useRef<HTMLDivElement>(null);
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    const onEsc    = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onEsc);
    return () => { window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onEsc); };
  }, [onClose]);

  const radarData = AXES.map(axis => {
    const entry: Record<string, number | string> = { axis: axis.label };
    keywords.forEach(kw => {
      entry[kw.keyword] = Math.round(((kw as unknown as Record<string, number>)[axis.key] ?? 0) / axis.max * 100);
    });
    return entry;
  });

  const barData = AXES.map(axis => {
    const entry: Record<string, number | string> = { axis: axis.label.slice(0, 6) };
    keywords.forEach(kw => { entry[kw.keyword] = (kw as unknown as Record<string, number>)[axis.key] ?? 0; });
    return entry;
  });

  function isMax(row: RowDef, kw: Keyword): boolean {
    const vals = keywords.map(k => { const v = row.getValue(k); return typeof v === 'number' ? v : parseFloat(String(v)) || 0; });
    const maxVal = Math.max(...vals);
    const num = typeof row.getValue(kw) === 'number' ? row.getValue(kw) as number : parseFloat(String(row.getValue(kw))) || 0;
    return maxVal > 0 && num === maxVal;
  }

  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: '#0d1117', pixelRatio: 2 });
      const a = document.createElement('a'); a.href = dataUrl; a.download = 'keyword_comparison.png'; a.click();
    } catch {}
    setExporting(false);
  }, []);

  const tooltipStyle = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto px-3 py-5"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl"
        style={{ maxWidth: 900, background: '#0d1425', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 100px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-5">
          <h2 className="m-0 text-[1.15rem]">🔍 So sánh {keywords.length} keyword</h2>
          <div className="flex gap-2">
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={handleExport} disabled={exporting}>
              {exporting ? <><span className="spinner" style={{ width: 10, height: 10 }} /> Xuất...</> : '🖼 Export PNG'}
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Color legend pills */}
        <div className="flex gap-2.5 flex-wrap px-7 pt-3">
          {keywords.map((kw, i) => (
            <span key={kw.keyword} className="flex items-center gap-1.5 text-[0.8rem] px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLORS[i]}40` }}>
              <span className="rounded-full shrink-0" style={{ width: 10, height: 10, background: COLORS[i] }} />
              <span className="jp-text max-w-[160px] truncate">{kw.keyword}</span>
              <span className="font-bold" style={{ color: COLORS[i] }}>{kw.longFormScore}</span>
            </span>
          ))}
        </div>

        {/* Chart */}
        <div ref={chartRef} className="px-7 py-5 rounded-xl" style={{ background: '#0d1425' }}>
          {isMobile ? (
            <ChartContainer aspectRatio={16/6} minHeight={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="axis" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  {keywords.map((kw, i) => <Bar key={kw.keyword} dataKey={kw.keyword} fill={COLORS[i]} opacity={0.85} radius={[3,3,0,0]} />)}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <ChartContainer aspectRatio={16/9} minHeight={300}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickCount={4} />
                  {keywords.map((kw, i) => (
                    <Radar key={kw.keyword} name={kw.keyword} dataKey={kw.keyword}
                      stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.18} strokeWidth={2} dot={{ fill: COLORS[i], r: 3 }} />
                  ))}
                  <Legend formatter={(v: string) => <span className="jp-text text-[0.78rem] text-text-secondary">{v.length > 24 ? v.slice(0,24)+'…' : v}</span>} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, n: unknown) => [`${v}%`, String(n)]} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>

        {/* Comparison table */}
        <div className="px-7 pb-7 overflow-x-auto">
          <table className="w-full border-collapse text-[0.83rem]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th className="text-left px-3 py-2 text-text-muted font-medium w-[130px]">Tiêu chí</th>
                {keywords.map((kw, i) => (
                  <th key={kw.keyword} className="text-center px-3 py-2 font-bold" style={{ color: COLORS[i] }}>
                    <div className="jp-text max-w-[140px] truncate mx-auto">{kw.keyword}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, ri) => (
                <tr key={ri} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                }}>
                  <td className="px-3 py-1.5 text-text-secondary font-medium">{row.label}</td>
                  {keywords.map((kw, i) => {
                    const val = row.getValue(kw);
                    const champion = isMax(row, kw);
                    return (
                      <td key={kw.keyword} className="text-center px-3 py-1.5"
                        style={{ fontWeight: champion ? 700 : 400, color: champion ? COLORS[i] : '#e8eaf6' }}>
                        {champion && <span className="mr-1">🏆</span>}
                        {row.isScore
                          ? <span className="px-2 py-0.5 rounded-xl font-bold" style={{ background: `${COLORS[i]}22`, color: COLORS[i] }}>{val}</span>
                          : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
