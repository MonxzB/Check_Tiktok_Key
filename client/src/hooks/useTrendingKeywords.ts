// ============================================================
// hooks/useTrendingKeywords.ts — Trending popup state & fetch
// Phase 17: Trending popup
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import type { TrendingKeyword } from '../types';
import {
  shouldShowTrending,
  fetchTrendingKeywords,
  markTrendingShown,
  canRefreshNow,
  markRefreshed,
} from '../engine/trendingFetcher';

export type TrendingStatus = 'idle' | 'loading' | 'ready' | 'error' | 'no_key';

export interface UseTrendingKeywordsReturn {
  visible: boolean;
  status: TrendingStatus;
  keywords: TrendingKeyword[];
  error: string | null;
  fromCache: boolean;
  /** Call once on app mount to conditionally show the modal */
  checkAndShow: () => void;
  /** Force re-fetch (client-side rate limit: once per 15 min) */
  refresh: () => void;
  /** Close the modal (marks as shown today) */
  close: () => void;
}

export function useTrendingKeywords(params: {
  showTrendingOnLoad: boolean;
  regionCode: string;
  language: string;
  apiKeys: string[];
}): UseTrendingKeywordsReturn {
  const { showTrendingOnLoad, regionCode, language, apiKeys } = params;

  const [visible,   setVisible]   = useState(false);
  const [status,    setStatus]    = useState<TrendingStatus>('idle');
  const [keywords,  setKeywords]  = useState<TrendingKeyword[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const doFetch = useCallback(async () => {
    if (!apiKeys.length) {
      setStatus('no_key');
      return;
    }
    setStatus('loading');
    setError(null);
    const result = await fetchTrendingKeywords({ regionCode, language, apiKeys });
    if (result.error) {
      setStatus('error');
      setError(result.error);
    } else {
      setKeywords(result.keywords);
      setFromCache(result.fromCache);
      setStatus('ready');
    }
  }, [regionCode, language, apiKeys]);

  const checkAndShow = useCallback(() => {
    if (!shouldShowTrending(showTrendingOnLoad)) return;
    setVisible(true);
    markTrendingShown();
    void doFetch();
  }, [showTrendingOnLoad, doFetch]);

  const refresh = useCallback(() => {
    if (!canRefreshNow()) return;
    markRefreshed();
    void doFetch();
  }, [doFetch]);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, status, keywords, error, fromCache, checkAndShow, refresh, close };
}
