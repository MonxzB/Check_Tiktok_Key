// csvUtils.test.ts — Task 3.1
// Tests CSV export/import round-trip and personal scoring columns

import { describe, it, expect } from 'vitest';
import { exportKeywordsCSV, importKeywordsCSV } from './csvUtils.ts';
import type { Keyword } from '../types';

function makeKw(overrides: Partial<Keyword> = {}): Keyword {
  return {
    keyword: 'テスト', vi: 'test', niche: 'AI / ChatGPT', level: 'beginner',
    longFormScore: 75, recommendation: 'Go',
    demand: 10, searchIntent: 10, topicDepth: 10,
    smallChannel: 10, evergreen: 7, seriesPotential: 7,
    longTailExp: 7, lowRisk: 3,
    subKeywords: [], chapters: ['ch1', 'ch2'],
    suggestedTitles: ['Title A'], reason: '',
    apiData: null,
    metadata: {
      hasApiData: false, hasChannelStats: false, hasRecentVideos: false,
      collectedAt: '2025-01-01T00:00:00.000Z',
      timeWindowDays: 180, regionCode: 'JP', languageCode: 'ja',
      confidenceLevel: 'Low', freshnessStatus: 'Unknown',
    },
    ...overrides,
  };
}

describe('exportKeywordsCSV — base mode', () => {
  it('starts with BOM', () => {
    const csv = exportKeywordsCSV([makeKw()]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('header contains lf_score (0-100) but NOT personal_score', () => {
    const [header] = exportKeywordsCSV([makeKw()]).replace('\uFEFF', '').split('\n');
    expect(header).toContain('lf_score (0-100)');
    expect(header).not.toContain('personal_score');
    expect(header).not.toContain('score_diff');
  });

  it('exports one data row per keyword', () => {
    const csv = exportKeywordsCSV([makeKw(), makeKw({ keyword: 'K2' })]);
    const lines = csv.replace('\uFEFF', '').trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
  });
});

describe('exportKeywordsCSV — personal scoring mode', () => {
  it('header contains personal_score, score_diff, scoring_mode when enabled', () => {
    const kw = makeKw();
    (kw as any).personalScore = 82;
    const [header] = exportKeywordsCSV([kw], true).replace('\uFEFF', '').split('\n');
    expect(header).toContain('personal_score (0-100)');
    expect(header).toContain('score_diff (personal−lf)');
    expect(header).toContain('scoring_mode');
  });

  it('score_diff = personal - lf', () => {
    const kw = makeKw({ longFormScore: 70 });
    (kw as any).personalScore = 80;
    const lines = exportKeywordsCSV([kw], true).replace('\uFEFF', '').split('\n');
    const dataRow = lines[1];
    expect(dataRow).toContain('+10.0');
  });

  it('score_diff is negative when personal < lf', () => {
    const kw = makeKw({ longFormScore: 80 });
    (kw as any).personalScore = 65;
    const lines = exportKeywordsCSV([kw], true).replace('\uFEFF', '').split('\n');
    expect(lines[1]).toContain('-15.0');
  });
});

describe('importKeywordsCSV — round-trip', () => {
  it('correctly reimports exported base keywords', () => {
    const kw = makeKw();
    const csv = exportKeywordsCSV([kw]);
    const [imported] = importKeywordsCSV(csv);
    expect(imported.keyword).toBe('テスト');
    expect(imported.longFormScore).toBe(75);
    expect(imported.chapters).toEqual(['ch1', 'ch2']);
  });

  it('correctly reimports exported personal-scored keywords', () => {
    const kw = makeKw({ longFormScore: 70 });
    (kw as any).personalScore = 85;
    const csv = exportKeywordsCSV([kw], true);
    const [imported] = importKeywordsCSV(csv);
    expect(imported.longFormScore).toBe(70);
    expect((imported as any).personalScore).toBe(85);
  });

  it('handles legacy CSV (no personal columns) without throwing', () => {
    const legacyCsv = exportKeywordsCSV([makeKw()], false); // base format
    expect(() => importKeywordsCSV(legacyCsv)).not.toThrow();
  });
});
