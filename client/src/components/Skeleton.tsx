// ============================================================
// components/Skeleton.tsx — Phase 16.5: Skeleton Loading States
// ============================================================
import React from 'react';

// ── Base shimmer ───────────────────────────────────────────────
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 6,
};

function Bone({ w, h, style }: { w?: string | number; h?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ ...shimmerStyle, width: w ?? '100%', height: h ?? 14, ...style }} />
  );
}

// ── Keyword Table Skeleton ─────────────────────────────────────
export function KeywordTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--glass-border)', marginBottom: 4 }}>
        <Bone w="3%" h={12} />
        <Bone w="30%" h={12} />
        <Bone w="10%" h={12} />
        <Bone w="10%" h={12} />
        <Bone w="8%" h={12} />
        <Bone w="8%" h={12} />
        <Bone w="15%" h={12} />
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 10, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}
        >
          <Bone w="3%" h={12} style={{ borderRadius: 3 }} />
          <Bone w={`${24 + (i % 3) * 8}%`} h={13} />
          <Bone w="10%" h={20} style={{ borderRadius: 10 }} />
          <Bone w="10%" h={12} />
          <Bone w="8%" h={22} style={{ borderRadius: 4 }} />
          <Bone w="8%" h={22} style={{ borderRadius: 4 }} />
          <Bone w={`${12 + (i % 2) * 6}%`} h={12} />
        </div>
      ))}
    </div>
  );
}

// ── Stats Bar Skeleton ─────────────────────────────────────────
export function StatsBarSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      {[120, 90, 110, 80].map((w, i) => (
        <div key={i} style={{ flex: 1, padding: 12, background: 'var(--glass)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
          <Bone w="60%" h={10} style={{ marginBottom: 8 }} />
          <Bone w="40%" h={20} />
        </div>
      ))}
    </div>
  );
}

// ── Generic Card Skeleton ──────────────────────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ padding: 16, background: 'var(--glass)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} w={i === 0 ? '60%' : `${85 - i * 10}%`} h={i === 0 ? 16 : 12} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

// ── Video Table Skeleton ───────────────────────────────────────
export function VideoTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
          {/* Thumbnail placeholder */}
          <Bone w={80} h={45} style={{ borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w={`${60 + (i % 3) * 12}%`} h={13} />
            <Bone w="40%" h={10} />
          </div>
          <Bone w={50} h={20} style={{ borderRadius: 8, flexShrink: 0 }} />
          <Bone w={60} h={20} style={{ borderRadius: 8, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
