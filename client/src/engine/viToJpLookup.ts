// ============================================================
// engine/viToJpLookup.ts — Vietnamese → Japanese keyword lookup
// Strategy:
//   1. Exact/fuzzy match against DEFAULT_SEEDS[].vi
//   2. Token-level match via reverse JP_VI_MAP
//   3. Niche keyword suggestions when no match
// ============================================================
import { DEFAULT_SEEDS, JP_VI_MAP } from './constants.js';
import type { SeedObject } from '../types';

// ── Build reverse map: Vietnamese token → Japanese token ────
const VI_JP_MAP: Record<string, string> = {};
for (const [jp, vi] of Object.entries(JP_VI_MAP)) {
  const key = vi.toLowerCase().trim();
  if (!VI_JP_MAP[key]) VI_JP_MAP[key] = jp;
}

// ── Normalise Vietnamese text ────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]/g, '')
    .trim();
}

// ── Score: how well does a seed's Vietnamese meaning match input ──
function matchScore(seedVi: string, input: string): number {
  const normSeed  = normalize(seedVi);
  const normInput = normalize(input);
  if (normSeed === normInput) return 100;
  if (normSeed.includes(normInput) || normInput.includes(normSeed)) return 80;
  const inputTokens = normInput.split(/\s+/);
  const seedTokens  = normSeed.split(/\s+/);
  const matched = inputTokens.filter(t => seedTokens.some(st => st.includes(t) || t.includes(st)));
  if (matched.length === 0) return 0;
  return Math.round((matched.length / Math.max(inputTokens.length, 1)) * 60);
}

export interface ViLookupResult {
  jpKeyword: string;
  viMeaning:  string;
  score:      number;   // 0–100, confidence
  source:     'exact' | 'fuzzy' | 'token' | 'niche';
}

// ── Main lookup ───────────────────────────────────────────────
export function lookupViToJp(viInput: string): ViLookupResult[] {
  const results: ViLookupResult[] = [];
  const seen = new Set<string>();

  function add(jp: string, vi: string, score: number, source: ViLookupResult['source']) {
    if (!jp || seen.has(jp)) return;
    seen.add(jp);
    results.push({ jpKeyword: jp, viMeaning: vi, score, source });
  }

  // ── Pass 1: match against DEFAULT_SEEDS[].vi ────────────────
  for (const seed of DEFAULT_SEEDS) {
    const s = matchScore(seed.vi, viInput);
    if (s >= 40) {
      add(seed.jp, seed.vi, s, s >= 80 ? 'exact' : 'fuzzy');
    }
  }

  // ── Pass 2: token-level via reverse JP_VI_MAP ───────────────
  const tokens = normalize(viInput).split(/\s+/);
  const jpTokens: string[] = [];
  for (const tok of tokens) {
    if (VI_JP_MAP[tok]) jpTokens.push(VI_JP_MAP[tok]);
    else {
      // partial match
      const partial = Object.entries(VI_JP_MAP).find(([vi]) => vi.includes(tok) || tok.includes(vi));
      if (partial) jpTokens.push(partial[1]);
    }
  }
  if (jpTokens.length > 0) {
    const composed = jpTokens.join(' ');
    add(composed, viInput, 50, 'token');
  }

  // ── Pass 3: if still no results, suggest niche keywords ─────
  if (results.length === 0) {
    const nicheMappings: Array<[RegExp, string[]]> = [
      [/tiết kiệm|chi tiêu|thu chi|ngân sách/, ['節約術', '家計管理 やり方', '一人暮らし 節約']],
      [/học|thi|tiếng anh|ngoại ngữ/, ['勉強法', '英語 学習法', 'TOEIC 勉強法']],
      [/ai|chatgpt|công cụ/, ['AIツール', 'ChatGPT 使い方', 'ChatGPT 仕事効率化']],
      [/excel|word|office/, ['Excel 使い方', 'Excel 自動化']],
      [/làm việc|hiệu quả|năng suất/, ['仕事効率化', '副業 初心者']],
      [/chuyển việc|tìm việc|nghỉ việc/, ['転職 やり方']],
      [/phỏng vấn|xin việc/, ['面接 完全ガイド']],
      [/tâm lý|cảm xúc|quan hệ/, ['心理学 解説']],
      [/kiến thức|thú vị|lịch sử/, ['雑学']],
      [/nhật|văn hóa nhật/, ['日本 マナー']],
      [/sức khỏe|ăn uống|ngủ/, ['健康 方法']],
      [/lập trình|code|python|javascript/, ['Python 入門']],
      [/kinh doanh|marketing|bán hàng/, ['ビジネス マーケ']],
    ];
    const normIn = normalize(viInput);
    for (const [re, suggestions] of nicheMappings) {
      if (re.test(normIn)) {
        for (const s of suggestions) {
          const seed = DEFAULT_SEEDS.find(d => d.jp === s);
          add(s, seed?.vi ?? s, 30, 'niche');
        }
        break;
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

// ── Batch: convert multi-line Vietnamese text → JP seeds ─────
export function parseViInputToJpSeeds(text: string): SeedObject[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: SeedObject[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const matches = lookupViToJp(line);
    for (const m of matches) {
      if (!seen.has(m.jpKeyword)) {
        seen.add(m.jpKeyword);
        const existing = DEFAULT_SEEDS.find(s => s.jp === m.jpKeyword);
        result.push({
          jp: m.jpKeyword,
          vi: existing?.vi ?? m.viMeaning,
          niche: existing?.niche ?? 'Công việc',
        });
      }
    }
  }
  return result;
}
