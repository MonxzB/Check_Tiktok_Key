// ============================================================
// hooks/useSettings.js — Persistent settings via localStorage
// ============================================================
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ytlf_settings';

const DEFAULTS = {
  minDurationMin: 8,
  timeWindowDays: 180,
  maxResults: 25,
  hideRisky: true,
  cacheDays: 7,
  regionCode: 'JP',
  languageCode: 'ja',
  orderBy: 'relevance',
  apiKeys: [],            // User-managed YouTube API keys (array of strings)
  activeKeyIndex: 0,      // Which key is currently active
};

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

function save(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

export function useSettings() {
  const [settings, setSettingsState] = useState(load);

  const updateSettings = useCallback((patch) => {
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
