// ============================================================
// hooks/useCompare.ts — Phase 5: Keyword comparison state
// ============================================================
import { useState, useCallback } from 'react';

const MAX_COMPARE = 4;

export interface UseCompareReturn {
  compareIds: string[];
  toggle: (keyword: string) => void;
  clear: () => void;
  isSelected: (keyword: string) => boolean;
  canAddMore: boolean;
  count: number;
}

export function useCompare(): UseCompareReturn {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggle = useCallback((keyword: string) => {
    setCompareIds(prev => {
      if (prev.includes(keyword)) return prev.filter(x => x !== keyword);
      if (prev.length >= MAX_COMPARE) return prev; // silently ignore 5th
      return [...prev, keyword];
    });
  }, []);

  const clear = useCallback(() => setCompareIds([]), []);

  const isSelected = useCallback((keyword: string) => compareIds.includes(keyword), [compareIds]);

  return {
    compareIds,
    toggle,
    clear,
    isSelected,
    canAddMore: compareIds.length < MAX_COMPARE,
    count: compareIds.length,
  };
}
