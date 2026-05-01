// ============================================================
// hooks/useSnapshots.ts — Phase 6: Fetch snapshots + create
// ============================================================
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';
import type { KeywordSnapshotRow, SnapshotInsert } from '../types';
import type { KeywordSnapshot } from '../engine/trendDetection.ts';

export function useSnapshots() {
  const [cache, setCache] = useState<Record<string, KeywordSnapshot[]>>({});
  const [loading, setLoading] = useState(false);

  /** Fetch snapshots for one keyword_id (uses cache) */
  const fetchSnapshots = useCallback(async (keywordId: string): Promise<KeywordSnapshot[]> => {
    if (cache[keywordId]) return cache[keywordId];
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keyword_snapshots')
        .select('*')
        .eq('keyword_id', keywordId)
        .order('captured_at', { ascending: false })
        .limit(90);
      if (error) throw error;
      const snaps = (data as KeywordSnapshotRow[]).map(r => ({
        id: r.id,
        keyword_id: r.keyword_id,
        long_form_score: r.long_form_score,
        avg_views: r.avg_views,
        long_videos_found: r.long_videos_found,
        best_ratio: r.best_ratio,
        api_data: r.api_data,
        captured_at: r.captured_at,
      }));
      setCache(prev => ({ ...prev, [keywordId]: snaps }));
      return snaps;
    } catch { return []; }
    finally { setLoading(false); }
  }, [cache]);

  /** Create a new snapshot after an analyze call */
  const createSnapshot = useCallback(async (insert: SnapshotInsert) => {
    try {
      await supabase.from('keyword_snapshots').insert(insert);
      // Invalidate cache for this keyword
      setCache(prev => {
        const next = { ...prev };
        delete next[insert.keyword_id];
        return next;
      });
    } catch { /* non-critical */ }
  }, []);

  return { fetchSnapshots, createSnapshot, loading };
}
