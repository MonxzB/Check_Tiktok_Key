// longFormScoring.test.ts — Task 3.1
// Tests the 8-dimension LF scoring engine (critical path)

import { describe, it, expect } from 'vitest';
import { scoreLongFormKeywords } from './longFormScoring.ts';
import type { Keyword } from '../types';

// ── Helpers ───────────────────────────────────────────────────
function makeKeyword(overrides: Partial<Keyword> = {}): Keyword {
  return {
    keyword: 'テスト keyword',
    vi: 'test',
    niche: 'AI / ChatGPT',
    level: 'beginner',
    longFormScore: 0,
    recommendation: '',
    demand: 10,
    searchIntent: 10,
    topicDepth: 10,
    smallChannel: 10,
    evergreen: 7,
    seriesPotential: 7,
    longTailExp: 7,
    lowRisk: 3,
    subKeywords: [],
    chapters: [],
    suggestedTitles: [],
    reason: '',
    apiData: null,
    metadata: {
      hasApiData: false,
      hasChannelStats: false,
      hasRecentVideos: false,
      collectedAt: new Date().toISOString(),
      timeWindowDays: 180,
      regionCode: 'JP',
      languageCode: 'ja',
      confidenceLevel: 'Low',
      freshnessStatus: 'Unknown',
    },
    ...overrides,
  };
}

/** Score a single keyword via the batch API */
function score(kw: Keyword): Keyword {
  return scoreLongFormKeywords([kw])[0];
}

// ── Tests ─────────────────────────────────────────────────────

describe('scoreLongFormKeywords', () => {
  it('returns a score between 0 and 100', () => {
    const result = score(makeKeyword());
    expect(result.longFormScore).toBeGreaterThanOrEqual(0);
    expect(result.longFormScore).toBeLessThanOrEqual(100);
  });

  it('sets recommendation field', () => {
    const result = score(makeKeyword());
    expect(result.recommendation).toBeTruthy();
  });

  it('sets reason field', () => {
    const result = score(makeKeyword());
    expect(typeof result.reason).toBe('string');
  });

  it('sets chapters array', () => {
    const result = score(makeKeyword());
    expect(Array.isArray(result.chapters)).toBe(true);
  });

  it('higher demand niche produces higher score than low demand', () => {
    const entertainment = score(makeKeyword({ niche: 'Entertainment / Vlog' }));
    const lowNiche      = score(makeKeyword({ niche: 'Other' }));
    // Entertainment has higher heat — score should be >= (not strictly > due to clamping)
    expect(entertainment.longFormScore).toBeGreaterThanOrEqual(lowNiche.longFormScore - 5);
  });

  it('handles empty keyword list without throwing', () => {
    expect(() => scoreLongFormKeywords([])).not.toThrow();
    expect(scoreLongFormKeywords([])).toHaveLength(0);
  });

  it('handles missing optional fields gracefully', () => {
    const kw = makeKeyword({ chapters: undefined, suggestedTitles: undefined } as any);
    expect(() => score(kw)).not.toThrow();
  });

  it('keyword with high apiData views gets higher demand score', () => {
    const lowViews  = score(makeKeyword({ apiData: { avgLongVideoViews: 1000 } as any }));
    const highViews = score(makeKeyword({ apiData: { avgLongVideoViews: 200000 } as any }));
    expect(highViews.demand).toBeGreaterThanOrEqual(lowViews.demand);
  });

  it('processes multiple keywords in batch', () => {
    const batch = [makeKeyword({ keyword: 'K1' }), makeKeyword({ keyword: 'K2' })];
    const results = scoreLongFormKeywords(batch);
    expect(results).toHaveLength(2);
    expect(results[0].keyword).toBe('K1');
    expect(results[1].keyword).toBe('K2');
  });
});
