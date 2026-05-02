/**
 * ChartContainer.tsx — Task 2.3
 *
 * Proper fix for Recharts "width(-1) height(-1)" warning.
 *
 * Root cause: ResponsiveContainer reads its parent's offsetWidth/offsetHeight
 * synchronously on mount. If the parent has no explicit size yet (e.g. inside
 * a lazy-loaded tab or a modal), the measurement returns 0 or -1.
 *
 * Fix: Use ResizeObserver to measure the actual rendered width, then pass
 * an explicit pixel height derived from aspectRatio. Children are NOT rendered
 * until the container has a real measured width (size.width > 0), so
 * ResponsiveContainer always sees a valid parent.
 *
 * Usage:
 *   <ChartContainer aspectRatio={16/9} minHeight={300}>
 *     <ResponsiveContainer width="100%" height="100%">
 *       <LineChart .../>
 *     </ResponsiveContainer>
 *   </ChartContainer>
 */

import { useEffect, useRef, useState } from 'react';
import React from 'react';

interface ChartContainerProps {
  /** Width-to-height ratio. Defaults to 16/9. */
  aspectRatio?: number;
  /** Minimum height in px regardless of container width. Defaults to 220. */
  minHeight?: number;
  /** Optional className on the wrapper div. */
  className?: string;
  children: React.ReactNode;
}

export function ChartContainer({
  aspectRatio = 16 / 9,
  minHeight = 220,
  className,
  children,
}: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: minHeight });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width <= 0) return;
      const height = Math.max(width / aspectRatio, minHeight);
      setSize({ width, height });
    });

    observer.observe(el);

    // Trigger immediately in case the element already has a size
    const width = el.clientWidth;
    if (width > 0) {
      setSize({ width, height: Math.max(width / aspectRatio, minHeight) });
    }

    return () => observer.disconnect();
  }, [aspectRatio, minHeight]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: '100%', height: size.height }}
    >
      {/* Only render children once we have a real width measurement */}
      {size.width > 0 ? children : null}
    </div>
  );
}

export default ChartContainer;
