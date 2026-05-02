// ============================================================
// engine/expansion.ts — Long-form keyword expansion (Phase 11: multi-language)
// ============================================================
import type { Keyword, Niche, KeywordLevel, SeedObject } from '../types';
import type { LanguagePack, LanguageSeed, ContentLanguage } from './languages/index';
import { getLanguagePack } from './languages/index';

// ── Legacy imports for backward compat ───────────────────────
import { DEFAULT_SEEDS as LEGACY_JP_SEEDS, JP_VI_MAP } from './constants.js';

// ── Niche classification per language ─────────────────────────
const NICHE_PATTERNS: Array<[RegExp, Niche]> = [
  [/AI|ChatGPT|GPT|生成AI|인공지능|artificial intelligence/i, 'AI / ChatGPT'],
  [/Excel|Word|PowerPoint|Office|VBA|マクロ|엑셀|스프레드시트/,         'Excel / Office'],
  [/Python|プログラミング|コード|アプリ開発|Web開発|coding|javascript|programming|개발|코딩/, 'Lập trình'],
  [/節約|食費|電気代|家計|貯金|tiết kiệm|절약|save money|budget/,      'Tiết kiệm'],
  [/仕事|効率|残業|副業|フリーランス|work|productivity|business|직장|업무/, 'Công việc'],
  [/面接|転職|就活|履歴書|interview|job|career|면접|이직|취업/,          'Phỏng vấn'],
  [/勉強|英語|資格|TOEIC|受験|study|learn|learning|공부|학습/,           'Học tập'],
  [/心理|人間関係|メンタル|習慣|psychology|habit|mental|심리|습관/,      'Tâm lý học'],
  [/雑学|豆知識|歴史|宇宙|科学|knowledge|fact|history|science|과학|역사/, 'Kiến thức / Fact'],
  [/マナー|文化|日本|礼儀|culture|japanese|한국|문화/,                   'Văn hóa Nhật'],
  [/100均|ダイソー|セリア/,                                              '100均'],
  [/健康|睡眠|ダイエット|運動|health|diet|exercise|건강|다이어트/,       'Sức khỏe'],
  [/ビジネス|マーケ|起業|集客|marketing|business|startup|비즈니스|마케팅/, 'Kinh doanh'],
];

export function classifyNiche(kw: string): Niche {
  for (const [re, n] of NICHE_PATTERNS) {
    if (re.test(kw)) return n;
  }
  return 'Công việc';
}

export function classifyLevel(kw: string): KeywordLevel {
  const tokens = kw.trim().split(/\s+/);
  if (tokens.length >= 3) return 'Long-tail';
  if (tokens.length === 2) return 'Mid-tail';
  return 'Broad';
}

export function generateViMeaning(kw: string, pack?: LanguagePack): string {
  const map = pack?.translationMap ?? JP_VI_MAP;
  return kw.split(/\s+/).map(t => map[t] || t).join(' ');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeBlankKeyword(keyword: string, niche: Niche, viMeaning?: string): Keyword {
  return {
    keyword,
    vi: viMeaning || generateViMeaning(keyword),
    niche,
    level: classifyLevel(keyword),
    demand: 0, searchIntent: 0, topicDepth: 0, smallChannel: 0,
    evergreen: 0, seriesPotential: 0, longTailExp: 0, lowRisk: 0,
    longFormScore: 0, recommendation: '', reason: '',
    chapters: [], suggestedTitles: [], subKeywords: [],
    apiData: null,
    metadata: null,
  };
}

interface ExpandOptions {
  maxPerPattern?: number;
}

// ── Main: expand with language pack ───────────────────────────
export function expandKeywordsWithPack(
  seedList: LanguageSeed[],
  pack: LanguagePack,
  options: ExpandOptions = {},
): Keyword[] {
  const results: Keyword[] = [];
  const seen = new Set<string>();
  const maxPerPattern = options.maxPerPattern || 4;

  function addKw(keyword: string, niche: Niche, viMeaning?: string): void {
    const k = keyword.trim();
    if (seen.has(k) || !k) return;
    seen.add(k);
    results.push(makeBlankKeyword(k, niche, viMeaning || generateViMeaning(k, pack)));
  }

  for (const seed of seedList) {
    const text = seed.text.trim();
    if (!text) continue;
    const niche = seed.niche || classifyNiche(text);

    // Seed itself
    addKw(text, niche, seed.vi);

    // Pattern A: seed + long-form suffix
    for (const suf of shuffle(pack.longFormSuffixes).slice(0, maxPerPattern)) {
      if (!text.includes(suf)) addKw(`${text} ${suf}`, niche);
    }

    // Pattern B: seed + problem area
    const probs = pack.nicheProblems[niche] || pack.problemMarkers;
    for (const p of shuffle(probs).slice(0, maxPerPattern)) addKw(`${text} ${p}`, niche);

    // Pattern C: seed + audience
    for (const aud of shuffle(pack.audienceMarkers).slice(0, 3)) addKw(`${text} ${aud}`, niche);

    // Pattern D: seed + benefit
    const bens = pack.nicheBenefits[niche] || pack.benefitMarkers;
    for (const b of shuffle(bens).slice(0, 3)) addKw(`${text} ${b}`, niche);

    // Pattern E: long-tail (problem + connector)
    const ltProbs = shuffle(probs).slice(0, 2);
    for (const p of ltProbs) {
      for (const conn of pack.longTailConnectors.slice(0, 2)) {
        addKw(`${text} ${p} ${conn}`, niche);
      }
    }
  }

  return results;
}

// ── Legacy: backward-compat signature (SeedObject, JP-only) ──
export function expandKeywords(seedList: SeedObject[], options: ExpandOptions = {}): Keyword[] {
  const jaPack = getLanguagePack('ja');
  const mapped: LanguageSeed[] = seedList.map(s => ({
    text: s.jp,
    vi: s.vi,
    niche: s.niche,
  }));
  return expandKeywordsWithPack(mapped, jaPack, options);
}

// ── Parse raw seed lines → LanguageSeed[] ─────────────────────
export function parseSeeds(
  lines: string[],
  lang: ContentLanguage = 'ja',
): LanguageSeed[] {
  const pack = getLanguagePack(lang);
  return lines.map(text => {
    const found = pack.defaultSeeds.find(s => s.text === text);
    return found || {
      text,
      vi: generateViMeaning(text, pack),
      niche: classifyNiche(text),
    };
  });
}

// ── Legacy getSeedObjects (JP only) ──────────────────────────
export function getSeedObjects(lines: string[]): SeedObject[] {
  return lines.map(jp => {
    const found = LEGACY_JP_SEEDS.find(s => s.jp === jp);
    return found || { jp, vi: generateViMeaning(jp), niche: classifyNiche(jp) };
  });
}
