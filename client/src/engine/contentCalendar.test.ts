// contentCalendar.test.ts — Task 3.1
// Tests priority logic, frequency, min score, series grouping (Task 2.4)

import { describe, it, expect } from 'vitest';
import { generateCalendar } from './contentCalendar.ts';
import type { Keyword } from '../types';
import type { CalendarOptions } from './contentCalendar.ts';

// ── Helpers ───────────────────────────────────────────────────
function kw(keyword: string, longFormScore: number, extras: Partial<Keyword> = {}): Keyword {
  return {
    keyword,
    vi: keyword,
    niche: 'AI / ChatGPT',
    level: 'beginner',
    longFormScore,
    recommendation: 'Go',
    demand: 10, searchIntent: 10, topicDepth: 10,
    smallChannel: 10, evergreen: 5, seriesPotential: 5,
    longTailExp: 5, lowRisk: 3,
    subKeywords: [], chapters: [], suggestedTitles: [],
    reason: '', apiData: null,
    metadata: {
      hasApiData: false, hasChannelStats: false, hasRecentVideos: false,
      collectedAt: new Date().toISOString(),
      timeWindowDays: 180, regionCode: 'JP', languageCode: 'ja',
      confidenceLevel: 'Low', freshnessStatus: 'Unknown',
    },
    ...extras,
  };
}

const BASE_OPTS: CalendarOptions = {
  startDate: new Date('2025-01-06'), // Monday
  frequency: 1,
  lang: 'ja',
  minScore: 0,
  maxWeeks: 12,
};

// ── Tests ─────────────────────────────────────────────────────

describe('generateCalendar — minScore filter', () => {
  it('excludes keywords below minScore', () => {
    const keywords = [kw('A', 80), kw('B', 40), kw('C', 70)];
    const cal = generateCalendar(keywords, { ...BASE_OPTS, minScore: 60 });
    const scheduled = cal.weeks.flatMap(w => w.entries).map(e => e.keyword.keyword);
    expect(scheduled).toContain('A');
    expect(scheduled).toContain('C');
    expect(scheduled).not.toContain('B');
  });

  it('returns empty weeks when nothing passes minScore', () => {
    const keywords = [kw('A', 30)];
    const cal = generateCalendar(keywords, { ...BASE_OPTS, minScore: 50 });
    expect(cal.totalEntries).toBe(0);
    expect(cal.weeks).toHaveLength(0);
  });
});

describe('generateCalendar — priority: trending > evergreen (Task 2.4)', () => {
  it('schedules trending 80 before evergreen 85', () => {
    const trending  = kw('Trending', 80, { trendDirection: 'rising' } as any);
    const evergreen = kw('Evergreen', 85, { evergreen: 9, trendDirection: 'stable' } as any);
    const cal = generateCalendar([evergreen, trending], { ...BASE_OPTS, minScore: 0 });
    const order = cal.weeks.flatMap(w => w.entries).map(e => e.keyword.keyword);
    // Trending gets +10 bonus → effective priority 90 > evergreen's (85 - 5) = 80
    expect(order.indexOf('Trending')).toBeLessThan(order.indexOf('Evergreen'));
  });
});

describe('generateCalendar — series grouping (Task 2.4)', () => {
  it('groups 3 same-niche high-seriesPotential keywords consecutively', () => {
    const opts: CalendarOptions = { ...BASE_OPTS, frequency: 1, maxWeeks: 6 };
    const s1 = kw('Series1', 75, { seriesPotential: 8, niche: 'AI / ChatGPT', level: 'beginner' });
    const s2 = kw('Series2', 74, { seriesPotential: 8, niche: 'AI / ChatGPT', level: 'beginner' });
    const s3 = kw('Series3', 73, { seriesPotential: 8, niche: 'AI / ChatGPT', level: 'beginner' });
    const other = kw('Other', 90, { seriesPotential: 2 });

    const cal = generateCalendar([other, s1, s2, s3], opts);
    const entries = cal.weeks.flatMap(w => w.entries);
    const seriesEntries = entries.filter(e => e.keyword.keyword.startsWith('Series'));

    // All 3 series members should be scheduled
    expect(seriesEntries.length).toBe(3);

    // They should be in consecutive week positions
    const positions = seriesEntries.map(e => entries.indexOf(e));
    const sorted = [...positions].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i] - sorted[i - 1]).toBe(1); // consecutive
    }
  });
});

describe('generateCalendar — frequency', () => {
  it('schedules 2 entries per week with frequency=2', () => {
    const keywords = Array.from({ length: 8 }, (_, i) => kw(`K${i}`, 70));
    const cal = generateCalendar(keywords, { ...BASE_OPTS, frequency: 2, maxWeeks: 4 });
    const perWeek = cal.weeks.map(w => w.entries.length);
    perWeek.forEach(count => expect(count).toBeLessThanOrEqual(2));
  });
});
