// ============================================================
// hooks/useSettings.ts — Persistent settings via localStorage
// ============================================================
import { useState, useCallback } from 'react';
import type { UserSettings, RegionCode, LanguageCode, OrderBy } from '../types';

const STORAGE_KEY = 'ytlf_settings';

export interface ExtendedSettings extends UserSettings {
  cacheDays: number;
  activeKeyIndex: number;
  // Phase 17: Trending popup
  showTrendingOnLoad: boolean;
  trendingRegionCode: RegionCode;
  // Phase 18: TikTok Channel Manager
  hideCalendar: boolean;
}

const DEFAULTS: ExtendedSettings = {
  minDurationMin: 8,
  timeWindowDays: 180,
  maxResults: 25,
  hideRisky: true,
  cacheDays: 7,
  regionCode: 'JP' as RegionCode,
  languageCode: 'ja' as LanguageCode,
  orderBy: 'relevance' as OrderBy,
  apiKeys: [],
  activeKeyIndex: 0,
  // Phase 17
  showTrendingOnLoad: true,
  trendingRegionCode: 'JP' as RegionCode,
  // Phase 18
  hideCalendar: false,
};

function load(): ExtendedSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

function save(settings: ExtendedSettings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export interface UseSettingsReturn {
  settings: ExtendedSettings;
  updateSettings: (patch: Partial<ExtendedSettings>) => void;
  resetSettings: () => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettingsState] = useState<ExtendedSettings>(load);

  const updateSettings = useCallback((patch: Partial<ExtendedSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULTS });
    save({ ...DEFAULTS });
  }, []);

  return { settings, updateSettings, resetSettings };
}
