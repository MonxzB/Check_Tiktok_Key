// ============================================================
// components/MonetizationTab.tsx — Phase 14: Monetization Score
// ============================================================
import React, { useMemo } from 'react';
import type { Keyword } from '../types';
import type { ContentLanguage } from '../engine/languages/index';
import { calculateMonetizationScore } from '../engine/monetizationScore.ts';
import type { MonetizationDimension, MonetizationResult } from '../engine/monetizationScore.ts';

interface MonetizationTabProps {
  keyword: Keyword;
  lang?: ContentLanguage;
}

// ── Tier Badge ────────────────────────────────────────────────
function TierBadge({ tier, color }: { tier: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: `${color}20`,
        border: `3px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.8rem', fontWeight: 900, color,
        boxShadow: `0 0 20px ${color}40`,
        transition: 'all 0.3s',
      }}>
        {tier}
      </div>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tier</span>
    </div>
  );
}

// ── Score Circle ──────────────────────────────────────────────
function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
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
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Monetization</span>
    </div>
  );
}

// ── Dimension Bar ─────────────────────────────────────────────
function DimensionBar({ dim }: { dim: MonetizationDimension }) {
  const barColor = dim.value >= 70 ? '#4ade80'
    : dim.value >= 50 ? '#facc15'
    : dim.value >= 30 ? '#fb923c'
    : '#f87171';

  return (
    <div title={dim.tip} style={{ cursor: 'help' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{dim.label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: barColor }}>{dim.value}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${dim.value}%`,
          background: barColor,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 2 }}>{dim.tip}</div>
    </div>
  );
}

// ── CPM Display ───────────────────────────────────────────────
function CpmCard({ result }: { result: MonetizationResult }) {
  const { estimatedCpm } = result;
  return (
    <div style={{
      background: 'var(--glass)', border: '1px solid var(--glass-border)',
      borderRadius: 10, padding: '12px 16px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Estimated CPM (USD)
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: result.tierColor }}>
          ${estimatedCpm.low.toFixed(1)}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>—</span>
        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: result.tierColor }}>
          ${estimatedCpm.high.toFixed(1)}
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Ước tính dựa trên thị trường + niche. CPM thực tế có thể khác.
      </div>
    </div>
  );
}

// ── Revenue Estimator ─────────────────────────────────────────
function RevenueEstimator({ result }: { result: MonetizationResult }) {
  const scenarios = [
    { label: '1,000 views/tháng',   views: 1_000 },
    { label: '10,000 views/tháng',  views: 10_000 },
    { label: '100,000 views/tháng', views: 100_000 },
  ];
  const { estimatedCpm } = result;

  function calcRevenue(views: number, cpm: number) {
    // Revenue = (views / 1000) * CPM * 0.55 (YouTube takes 45%)
    return ((views / 1000) * cpm * 0.55).toFixed(1);
  }

  return (
    <div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>
        💰 Ước tính doanh thu (sau khi YouTube khấu trừ 45%)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {scenarios.map(s => (
          <div
            key={s.label}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: result.tierColor }}>
              ${calcRevenue(s.views, estimatedCpm.low)} – ${calcRevenue(s.views, estimatedCpm.high)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────
export default function MonetizationTab({ keyword, lang = 'ja' }: MonetizationTabProps) {
  const result = useMemo(
    () => calculateMonetizationScore(keyword, lang),
    [keyword.keyword, lang],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 14 }}>

      {/* Header row: score + tier + readiness badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '14px 16px', background: 'var(--glass)',
        borderRadius: 12, border: '1px solid var(--glass-border)',
      }}>
        <ScoreCircle score={result.totalScore} color={result.tierColor} />
        <TierBadge tier={result.tier} color={result.tierColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            {result.readyForMonetization
              ? '✅ Sẵn sàng monetize'
              : '⚠️ Cần cải thiện trước khi monetize'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Điểm monetization: <strong style={{ color: result.tierColor }}>{result.totalScore}/100</strong>
            {' '}· Niche: <strong>{keyword.niche || 'Unknown'}</strong>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="detail-sub">
        <h3>📊 Chi tiết Monetization Score</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {result.dimensions.map(dim => (
            <DimensionBar key={dim.key} dim={dim} />
          ))}
        </div>
      </div>

      {/* CPM + Revenue estimator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
        <CpmCard result={result} />
        <RevenueEstimator result={result} />
      </div>

      {/* Recommendations */}
      <div className="detail-sub">
        <h3>💡 Khuyến nghị</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {result.recommendations.map((rec, i) => (
            <div
              key={i}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, border: '1px solid var(--glass-border)' }}
            >
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        * Ước tính CPM dựa trên dữ liệu thị trường công khai 2024–2025. Doanh thu thực tế phụ thuộc vào nhiều yếu tố: lượt xem, vị trí địa lý viewer, loại quảng cáo.
      </div>
    </div>
  );
}
