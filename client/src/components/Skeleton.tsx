// ============================================================
// components/Skeleton.tsx — Phase 16.5 (Tailwind)
// ============================================================
import React from 'react';

// ── Base shimmer bone ──────────────────────────────────────────
function Bone({
  w = '100%',
  h = 14,
  className = '',
  style,
}: {
  w?: string | number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-md animate-shimmer ${className}`}
      style={{
        width: w,
        height: h,
        background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

// ── Keyword Table Skeleton ─────────────────────────────────────
export function KeywordTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex gap-2.5 py-2.5 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Bone w="3%" h={12} /> <Bone w="30%" h={12} /> <Bone w="10%" h={12} />
        <Bone w="10%" h={12} /> <Bone w="8%" h={12} /> <Bone w="8%" h={12} /> <Bone w="15%" h={12} />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2.5 py-2.5 items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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
    <div className="flex gap-3 mb-3">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex-1 p-3 rounded-[10px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Bone w="60%" h={10} className="mb-2" />
          <Bone w="40%" h={20} />
        </div>
      ))}
    </div>
  );
}

// ── Generic Card Skeleton ──────────────────────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} w={i === 0 ? '60%' : `${85 - i * 10}%`} h={i === 0 ? 16 : 12} className="mb-2.5" />
      ))}
    </div>
  );
}

// ── Video Table Skeleton ───────────────────────────────────────
export function VideoTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3 items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <Bone w={80} h={45} style={{ borderRadius: 6, flexShrink: 0 }} />
          <div className="flex-1 flex flex-col gap-1.5">
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
