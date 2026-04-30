// ============================================================
// hooks/useKeywords.js — Long-form keyword state management
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import { expandKeywords, getSeedObjects } from '../engine/expansion.js';
import { scoreLongFormKeywords } from '../engine/longFormScoring.js';
import { exportKeywordsCSV, importKeywordsCSV, downloadBlob } from '../engine/csvUtils.js';
import { buildMetadata } from '../engine/dataMetadata.js';

const STORAGE_KEY = 'ytlf_keywords';

function loadFromStorage() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; }
  catch { return []; }
}
function saveToStorage(kws) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(kws)); } catch {}
}

export function useKeywords(toast) {
  const [keywords, setKeywords] = useState(() => loadFromStorage());

  useEffect(() => { saveToStorage(keywords); }, [keywords]);

  const expand = useCallback((seedText) => {
    const lines = seedText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast('Vui lòng nhập ít nhất 1 seed keyword', 'error'); return; }
    const seeds = getSeedObjects(lines);
    const expanded = expandKeywords(seeds);
    const scored = scoreLongFormKeywords(expanded).map(kw => ({
      ...kw,
      metadata: buildMetadata({ hasApiData: false }),
    }));
    setKeywords(scored);
    toast(`Đã tạo & chấm điểm ${scored.length} keyword long-form`, 'success');
  }, [toast]);

  const score = useCallback(() => {
    if (!keywords.length) { toast('Chưa có keyword nào', 'error'); return; }
    setKeywords(prev => scoreLongFormKeywords([...prev]));
    toast('Đã chấm điểm xong!', 'success');
  }, [keywords, toast]);

  const clear = useCallback(() => {
    setKeywords([]);
    toast('Đã xoá tất cả', 'success');
  }, [toast]);

  const exportCsv = useCallback((filtered) => {
    if (!filtered.length) { toast('Chưa có dữ liệu để xuất', 'error'); return; }
    downloadBlob(exportKeywordsCSV(filtered), 'youtube_longform_keywords.csv');
    toast('Đã xuất CSV!', 'success');
  }, [toast]);

  const importCsv = useCallback((text) => {
    const imported = importKeywordsCSV(text);
    if (!imported.length) { toast('File CSV không hợp lệ', 'error'); return; }
    setKeywords(prev => {
      const existing = new Set(prev.map(k => k.keyword));
      const newKws = imported.filter(k => !existing.has(k.keyword));
      return [...prev, ...newKws];
    });
    toast(`Đã nhập ${imported.length} keyword từ CSV`, 'success');
  }, [toast]);

  // Called after YouTube API analysis returns data
  const updateApiData = useCallback((keyword, apiData, metadata) => {
    setKeywords(prev => prev.map(k => {
      if (k.keyword !== keyword) return k;
      const updated = { ...k, apiData, metadata };
      // Re-score with API data
      const [rescored] = scoreLongFormKeywords([updated]);
      return rescored;
    }));
  }, []);

  return { keywords, expand, score, clear, exportCsv, importCsv, updateApiData };
}
