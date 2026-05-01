import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import { toPng } from 'html-to-image';
import type { Keyword } from '../types';

// ── Constants ────────────────────────────────────────────────
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const AXES = [
  { key: 'demand',          label: 'Demand',          max: 20 },
  { key: 'searchIntent',    label: 'Search Intent',   max: 15 },
  { key: 'topicDepth',      label: 'Topic Depth',     max: 15 },
  { key: 'smallChannel',    label: 'Small Channel',   max: 15 },
  { key: 'evergreen',       label: 'Evergreen',       max: 10 },
  { key: 'seriesPotential', label: 'Series',          max: 10 },
  { key: 'longTailExp',     label: 'Long-tail',       max: 10 },
  { key: 'lowRisk',         label: 'Low Risk',        max: 5  },
];

type RowDef = {
  label: string;
  getValue: (kw: Keyword) => number | string;
  isScore?: boolean;
};

const TABLE_ROWS: RowDef[] = [
  { label: 'Tổng điểm LF', getValue: k => k.longFormScore, isScore: true },
  ...AXES.map(a => ({
    label: a.label,
    getValue: (k: Keyword) => (k as unknown as Record<string, number>)[a.key] ?? 0,
  })),
  { label: 'YT Long Videos', getValue: k => k.apiData?.longVideosFound ?? '—' },
  { label: 'Avg Views',      getValue: k => k.apiData?.avgLongVideoViews ? (k.apiData.avgLongVideoViews / 1000).toFixed(0) + 'k' : '—' },
  { label: 'Best Ratio',     getValue: k => k.apiData?.bestViewSubRatio ? k.apiData.bestViewSubRatio.toFixed(1) + 'x' : '—' },
  { label: 'Đề xuất',        getValue: k => k.recommendation },
];

interface CompareModalProps {
  keywords: Keyword[];  // already filtered to compareIds
  onClose: () => void;
}

export default function CompareModal({ keywords, onClose }: CompareModalProps) {
  const chartRef   = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { window.removeEventListener('resize', fn); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  // ── Radar data ───────────────────────────────────────────────
  const radarData = AXES.map(axis => {
    const entry: Record<string, number | string> = { axis: axis.label };
    keywords.forEach(kw => {
      const raw = (kw as unknown as Record<string, number>)[axis.key] ?? 0;
      // Normalize to 0–100 for visual parity
      entry[kw.keyword] = Math.round((raw / axis.max) * 100);
    });
    return entry;
  });

  // ── Bar data (mobile) ────────────────────────────────────────
  const barData = AXES.map(axis => {
    const entry: Record<string, number | string> = { axis: axis.label.slice(0, 6) };
    keywords.forEach(kw => {
      entry[kw.keyword] = (kw as unknown as Record<string, number>)[axis.key] ?? 0;
    });
    return entry;
  });

  // ── Find max for trophy ──────────────────────────────────────
  function isMax(row: RowDef, kw: Keyword): boolean {
    const vals = keywords.map(k => {
      const v = row.getValue(k);
      return typeof v === 'number' ? v : parseFloat(String(v)) || 0;
    });
    const maxVal = Math.max(...vals);
    const v = row.getValue(kw);
    const num = typeof v === 'number' ? v : parseFloat(String(v)) || 0;
    return maxVal > 0 && num === maxVal;
  }

  // ── Export PNG ───────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: '#0d1117', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'keyword_comparison.png';
      a.click();
    } catch {}
    setExporting(false);
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '20px 12px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 16, width: '100%', maxWidth: 900, boxShadow: '0 32px 100px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 0' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
            🔍 So sánh {keywords.length} keyword
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? <><span className="spinner" style={{ width: 10, height: 10 }} /> Xuất...</> : '🖼 Export PNG'}
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Keyword color legend pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 28px 0' }}>
          {keywords.map((kw, i) => (
            <span key={kw.keyword} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20, border: `1px solid ${COLORS[i]}40` }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
              <span className="jp-text" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.keyword}</span>
              <span style={{ color: COLORS[i], fontWeight: 700 }}>{kw.longFormScore}</span>
            </span>
          ))}
        </div>

        {/* Chart section */}
        <div ref={chartRef} style={{ padding: '20px 28px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
          {isMobile ? (
            // Mobile: Bar chart
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="axis" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  {keywords.map((kw, i) => (
                    <Bar key={kw.keyword} dataKey={kw.keyword} fill={COLORS[i]} opacity={0.85} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // Desktop: Radar chart
            <div style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90} domain={[0, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                    tickCount={4}
                  />
                  {keywords.map((kw, i) => (
                    <Radar
                      key={kw.keyword}
                      name={kw.keyword}
                      dataKey={kw.keyword}
                      stroke={COLORS[i]}
                      fill={COLORS[i]}
                      fillOpacity={0.18}
                      strokeWidth={2}
                      dot={{ fill: COLORS[i], r: 3 }}
                    />
                  ))}
                  <Legend
                    formatter={(value: string) => (
                      <span className="jp-text" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{value.length > 24 ? value.slice(0, 24) + '…' : value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
                    formatter={(value: unknown, name: unknown) => [`${value}%`, String(name)]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Comparison table */}
        <div style={{ padding: '0 28px 28px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, width: 130 }}>Tiêu chí</th>
                {keywords.map((kw, i) => (
                  <th key={kw.keyword} style={{ textAlign: 'center', padding: '8px 12px', color: COLORS[i], fontWeight: 700 }}>
                    <div className="jp-text" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }}>{kw.keyword}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.label}</td>
                  {keywords.map((kw, i) => {
                    const val = row.getValue(kw);
                    const champion = isMax(row, kw);
                    return (
                      <td key={kw.keyword} style={{ textAlign: 'center', padding: '7px 12px', fontWeight: champion ? 700 : 400, color: champion ? COLORS[i] : 'var(--text)' }}>
                        {champion && <span style={{ marginRight: 4 }}>🏆</span>}
                        {row.isScore ? (
                          <span style={{ background: `${COLORS[i]}22`, color: COLORS[i], padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{val}</span>
                        ) : val}
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
