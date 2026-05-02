import React, { useMemo } from 'react';
import type { Keyword } from '../types';
import type { ContentLanguage } from '../engine/languages/index';
import { calculateMonetizationScore } from '../engine/monetizationScore.ts';
import type { MonetizationDimension, MonetizationResult } from '../engine/monetizationScore.ts';

interface MonetizationTabProps { keyword: Keyword; lang?: ContentLanguage; }

function TierBadge({ tier, color }: { tier: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-[1.8rem] font-black"
        style={{ background: `${color}20`, border: `3px solid ${color}`, color, boxShadow: `0 0 20px ${color}40` }}>
        {tier}
      </div>
      <span className="text-[0.68rem] text-text-muted">Tier</span>
    </div>
  );
}

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px', transition: 'stroke-dashoffset 0.6s' }} />
        <text x={36} y={40} textAnchor="middle" fontSize={15} fontWeight={700} fill={color}>{score}</text>
      </svg>
      <span className="text-[0.68rem] text-text-muted">Monetization</span>
    </div>
  );
}

function DimensionBar({ dim }: { dim: MonetizationDimension }) {
  const barColor = dim.value >= 70 ? '#4ade80' : dim.value >= 50 ? '#facc15' : dim.value >= 30 ? '#fb923c' : '#f87171';
  return (
    <div title={dim.tip} className="cursor-help">
      <div className="flex justify-between mb-1">
        <span className="text-[0.78rem]">{dim.label}</span>
        <span className="text-[0.78rem] font-semibold" style={{ color: barColor }}>{dim.value}</span>
      </div>
      <div className="h-1.5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded transition-all duration-500" style={{ width: `${dim.value}%`, background: barColor }} />
      </div>
      <div className="text-[0.66rem] text-text-muted mt-0.5">{dim.tip}</div>
    </div>
  );
}

function CpmCard({ result }: { result: MonetizationResult }) {
  const { estimatedCpm } = result;
  return (
    <div className="rounded-[10px] px-4 py-3 flex flex-col gap-1.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-[0.72rem] text-text-muted uppercase tracking-wide">Estimated CPM (USD)</div>
      <div className="flex gap-2 items-baseline">
        <span className="text-[1.4rem] font-bold" style={{ color: result.tierColor }}>${estimatedCpm.low.toFixed(1)}</span>
        <span className="text-text-muted">—</span>
        <span className="text-[1.4rem] font-bold" style={{ color: result.tierColor }}>${estimatedCpm.high.toFixed(1)}</span>
      </div>
      <div className="text-[0.72rem] text-text-muted">Ước tính dựa trên thị trường + niche. CPM thực tế có thể khác.</div>
    </div>
  );
}

function RevenueEstimator({ result }: { result: MonetizationResult }) {
  const scenarios = [
    { label: '1,000 views/tháng',   views: 1_000   },
    { label: '10,000 views/tháng',  views: 10_000  },
    { label: '100,000 views/tháng', views: 100_000 },
  ];
  const calc = (v: number, cpm: number) => ((v / 1000) * cpm * 0.55).toFixed(1);
  return (
    <div>
      <div className="text-[0.78rem] text-text-secondary font-semibold mb-2">💰 Ước tính doanh thu (sau khi YouTube khấu trừ 45%)</div>
      <div className="flex flex-col gap-1.5">
        {scenarios.map(s => (
          <div key={s.label} className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[0.78rem] text-text-muted">{s.label}</span>
            <span className="text-[0.82rem] font-semibold" style={{ color: result.tierColor }}>
              ${calc(s.views, result.estimatedCpm.low)} – ${calc(s.views, result.estimatedCpm.high)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonetizationTab({ keyword, lang = 'ja' }: MonetizationTabProps) {
  const result = useMemo(() => calculateMonetizationScore(keyword, lang), [keyword.keyword, lang]);
  return (
    <div className="flex flex-col gap-4 mt-3.5">
      <div className="flex items-center gap-5 px-4 py-3.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <ScoreCircle score={result.totalScore} color={result.tierColor} />
        <TierBadge tier={result.tier} color={result.tierColor} />
        <div className="flex-1">
          <div className="font-bold text-[0.95rem] mb-1">
            {result.readyForMonetization ? '✅ Sẵn sàng monetize' : '⚠️ Cần cải thiện trước khi monetize'}
          </div>
          <div className="text-[0.78rem] text-text-muted leading-relaxed">
            Điểm monetization: <strong style={{ color: result.tierColor }}>{result.totalScore}/100</strong>
            {' '}· Niche: <strong>{keyword.niche || 'Unknown'}</strong>
          </div>
        </div>
      </div>
      <div className="detail-sub">
        <h3>📊 Chi tiết Monetization Score</h3>
        <div className="flex flex-col gap-3 mt-2">
          {result.dimensions.map(dim => <DimensionBar key={dim.key} dim={dim} />)}
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        <CpmCard result={result} />
        <RevenueEstimator result={result} />
      </div>
      <div className="detail-sub">
        <h3>💡 Khuyến nghị</h3>
        <div className="flex flex-col gap-2 mt-2">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="px-3 py-2 rounded-lg text-[0.82rem] text-text-secondary leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>{rec}</div>
          ))}
        </div>
      </div>
      <div className="text-[0.68rem] text-text-muted text-center leading-relaxed">
        * Ước tính CPM dựa trên dữ liệu thị trường công khai 2024–2025.
      </div>
    </div>
  );
}
