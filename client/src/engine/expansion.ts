// ============================================================
// engine/expansion.ts — Long-form keyword expansion
// ============================================================
import type { Keyword, Niche, KeywordLevel, SeedObject } from '../types';
import {
  AUDIENCES, LONG_FORM_SUFFIXES, NICHE_PROBLEMS, NICHE_BENEFITS,
  JP_VI_MAP, DEFAULT_SEEDS,
} from './constants.js';

export function classifyNiche(kw: string): Niche {
  const map: Array<[RegExp, Niche]> = [
    [/AI|ChatGPT|GPT|生成AI/i,              'AI / ChatGPT'],
    [/Excel|Word|PowerPoint|Office|VBA|マクロ/, 'Excel / Office'],
    [/Python|プログラミング|コード|アプリ開発|Web開発/, 'Lập trình'],
    [/節約|食費|電気代|家計|貯金/,           'Tiết kiệm'],
    [/仕事|効率|残業|副業|フリーランス/,     'Công việc'],
    [/面接|転職|就活|履歴書/,               'Phỏng vấn'],
    [/勉強|英語|資格|TOEIC|受験/,           'Học tập'],
    [/心理|人間関係|メンタル|習慣/,         'Tâm lý học'],
    [/雑学|豆知識|歴史|宇宙|科学/,         'Kiến thức / Fact'],
    [/マナー|文化|日本|礼儀/,              'Văn hóa Nhật'],
    [/100均|ダイソー|セリア/,              '100均'],
    [/健康|睡眠|ダイエット|運動/,          'Sức khỏe'],
    [/ビジネス|マーケ|起業|集客/,          'Kinh doanh'],
  ];
  for (const [re, n] of map) {
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

export function generateViMeaning(kw: string): string {
  return kw.split(/\s+/).map(t => JP_VI_MAP[t] || t).join(' ');
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
    // Scores (filled by longFormScoring)
    demand: 0, searchIntent: 0, topicDepth: 0, smallChannel: 0,
    evergreen: 0, seriesPotential: 0, longTailExp: 0, lowRisk: 0,
    longFormScore: 0, recommendation: '', reason: '',
    chapters: [], suggestedTitles: [], subKeywords: [],
    // API data (filled after YouTube analysis)
    apiData: null,
    metadata: null,
  };
}

interface ExpandOptions {
  maxPerPattern?: number;
}

export function expandKeywords(seedList: SeedObject[], options: ExpandOptions = {}): Keyword[] {
  const results: Keyword[] = [];
  const seen = new Set<string>();
  const maxPerPattern = options.maxPerPattern || 4;

  function addKw(keyword: string, niche: Niche, viMeaning?: string): void {
    const k = keyword.trim();
    if (seen.has(k) || !k) return;
    seen.add(k);
    results.push(makeBlankKeyword(k, niche, viMeaning));
  }

  for (const seed of seedList) {
    const jp = seed.jp.trim();
    if (!jp) continue;
    const niche = seed.niche || classifyNiche(jp);

    // Seed itself
    addKw(jp, niche, seed.vi);

    // Pattern A: seed + long-form suffix
    for (const suf of shuffle(LONG_FORM_SUFFIXES).slice(0, maxPerPattern)) {
      if (!jp.includes(suf)) addKw(`${jp} ${suf}`, niche);
    }

    // Pattern B: seed + problem area
    const probs = NICHE_PROBLEMS[niche] || NICHE_PROBLEMS['Công việc'];
    for (const p of shuffle(probs).slice(0, maxPerPattern)) addKw(`${jp} ${p}`, niche);

    // Pattern C: seed + audience
    for (const aud of shuffle(AUDIENCES).slice(0, 3)) addKw(`${jp} ${aud}`, niche);

    // Pattern D: seed + benefit
    const bens = NICHE_BENEFITS[niche] || [];
    for (const b of shuffle(bens).slice(0, 3)) addKw(`${jp} ${b}`, niche);

    // Pattern E: long-tail (problem + suffix)
    const ltProbs = shuffle(probs).slice(0, 2);
    const ltSufs = ['やり方', '方法', '完全ガイド', '注意点'];
    for (const p of ltProbs) {
      for (const s of ltSufs.slice(0, 2)) {
        addKw(`${jp} ${p} ${s}`, niche);
      }
    }
  }

  return results;
}

export function getSeedObjects(lines: string[]): SeedObject[] {
  return lines.map(jp => {
    const found = DEFAULT_SEEDS.find(s => s.jp === jp);
    return found || { jp, vi: generateViMeaning(jp), niche: classifyNiche(jp) };
  });
}
