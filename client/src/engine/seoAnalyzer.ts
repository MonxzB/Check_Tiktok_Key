// ============================================================
// engine/seoAnalyzer.ts — Phase 12: SEO Score Analysis
// Analyzes a keyword's SEO potential using top video data
// ============================================================
import type { Keyword } from '../types';
import type { RefVideo } from '../types';
import type { LanguagePack, ContentLanguage } from './languages/index';
import { getLanguagePack } from './languages/index';

// ── Types ─────────────────────────────────────────────────────

export interface TitleAnalysis {
  length: number;
  optimalMin: number;
  optimalMax: number;
  ideal: number;
  status: 'too_short' | 'optimal' | 'too_long';
  recommendations: Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
  }>;
}

export interface TagSuggestion {
  tag: string;
  source: 'keyword' | 'top_video' | 'related';
  frequency: number;   // Number of top videos using this token
  recommended: boolean;// True if in top 15
}

export interface KeywordDensity {
  token: string;
  count: number;       // Total occurrences across all titles
  videoCount: number;  // Number of videos containing token
  density: number;     // Percentage vs total tokens
}

export interface SuggestedTitle {
  title: string;
  length: number;
  source: 'template' | 'ai';
}

export interface SeoAnalysis {
  titleAnalysis: TitleAnalysis;
  suggestedTitles: SuggestedTitle[];
  suggestedTags: TagSuggestion[];
  descriptionTemplate: string;
  keywordDensity: KeywordDensity[];
  overallScore: number;   // 0-100
  hasData: boolean;       // False = no refVideos analyzed yet
}

// ── Title length limits by language ───────────────────────────
const TITLE_LIMITS: Record<ContentLanguage, { min: number; max: number; ideal: number }> = {
  ja: { min: 25, max: 70, ideal: 45 },
  ko: { min: 25, max: 70, ideal: 45 },
  en: { min: 40, max: 70, ideal: 60 },
  vi: { min: 40, max: 70, ideal: 60 },
};

// ── Description templates by language ─────────────────────────
const DESCRIPTION_TEMPLATES: Record<ContentLanguage, string> = {
  ja: `🎯 この動画では「{keyword}」について徹底解説します。

📌 タイムスタンプ:
00:00 イントロ
{chapter_template}

✅ この動画でわかること:
・{keyword}の基本的な使い方
・よくある失敗とその対処法
・実践的な活用テクニック

🔗 関連動画:
[関連動画をここに]

---
#{{keyword_tag}} #{niche_tag} #YouTube #解説`,

  ko: `🎯 이 영상에서는 「{keyword}」에 대해 철저히 해설합니다.

📌 타임스탬프:
00:00 인트로
{chapter_template}

✅ 이 영상에서 배울 수 있는 것:
・{keyword}의 기본 사용법
・자주 하는 실수와 해결법
・실전 활용 테크닉

🔗 관련 영상:
[관련 영상을 여기에]

---
#{keyword_tag} #{niche_tag} #YouTube #해설`,

  en: `🎯 In this video, I'll cover everything you need to know about {keyword}.

📌 Timestamps:
00:00 Intro
{chapter_template}

✅ What you'll learn:
• How to use {keyword} effectively
• Common mistakes and how to avoid them
• Pro tips and advanced techniques

🔗 Related videos:
[Add related videos here]

---
#{keyword_tag} #{niche_tag} #Tutorial #HowTo`,

  vi: `🎯 Trong video này, tôi sẽ chia sẻ tất cả về {keyword}.

📌 Mục lục:
00:00 Giới thiệu
{chapter_template}

✅ Bạn sẽ học được:
• Cách dùng {keyword} hiệu quả
• Những lỗi thường gặp và cách khắc phục
• Mẹo chuyên nghiệp và kỹ thuật nâng cao

🔗 Video liên quan:
[Thêm video liên quan vào đây]

---
#{keyword_tag} #{niche_tag} #HướngDẫn #Tutorial`,
};

// ── Helpers ───────────────────────────────────────────────────

function analyzeTitleLength(keyword: string, lang: ContentLanguage): TitleAnalysis {
  const limits = TITLE_LIMITS[lang] ?? TITLE_LIMITS.ja;
  const len = keyword.length;
  const recs: TitleAnalysis['recommendations'] = [];

  let status: TitleAnalysis['status'];
  if (len < limits.min) {
    status = 'too_short';
    recs.push({ type: 'warning', message: `Title ngắn (${len} ký tự). Thêm từ khóa phụ để đạt ${limits.min}+ ký tự.` });
  } else if (len > limits.max) {
    status = 'too_long';
    recs.push({ type: 'error', message: `Title quá dài (${len} ký tự). YouTube cắt sau ${limits.max} ký tự.` });
  } else {
    status = 'optimal';
    recs.push({ type: 'success', message: `Độ dài tốt (${len} ký tự). Trong khoảng tối ưu ${limits.min}–${limits.max}.` });
  }

  // CJK density check for JA/KO
  if (lang === 'ja' || lang === 'ko') {
    const cjkCount = (keyword.match(/[\u3040-\u9fff]/g) ?? []).length;
    const cjkRatio = cjkCount / len;
    if (cjkRatio > 0.6) {
      recs.push({ type: 'success', message: 'Nhiều ký tự CJK — tốt cho SEO tìm kiếm JP/KR.' });
    }
  }

  // Number inclusion (year)
  if (/20\d\d/.test(keyword)) {
    recs.push({ type: 'success', message: 'Có năm trong title — tăng CTR.' });
  }

  return { length: len, optimalMin: limits.min, optimalMax: limits.max, ideal: limits.ideal, status, recommendations: recs };
}

function generateSuggestedTitles(keyword: string, pack: LanguagePack): SuggestedTitle[] {
  return pack.titleTemplates.slice(0, 5).map(tmpl => {
    const title = tmpl.replace('{kw}', keyword);
    return { title, length: title.length, source: 'template' as const };
  });
}

function extractTags(
  keyword: string,
  refVideos: RefVideo[],
  pack: LanguagePack,
): TagSuggestion[] {
  // Step 1: Start with keyword tokens
  const kwTokens = pack.tokenize(keyword);

  // Step 2: Tokenize all ref video titles
  const tokenVideoMap = new Map<string, Set<string>>();

  for (const v of refVideos) {
    const tokens = pack.tokenize(v.title || '');
    for (const t of tokens) {
      if (!tokenVideoMap.has(t)) tokenVideoMap.set(t, new Set());
      tokenVideoMap.get(t)!.add(v.videoId);
    }
  }

  // Step 3: Score each token
  const tagged: TagSuggestion[] = [];

  // Add keyword tokens first
  for (const t of kwTokens) {
    tagged.push({
      tag: t,
      source: 'keyword',
      frequency: tokenVideoMap.get(t)?.size ?? 0,
      recommended: true,
    });
  }

  // Add video tokens
  for (const [token, vids] of tokenVideoMap.entries()) {
    if (kwTokens.includes(token)) continue; // Already added
    if (token.length < 2 || token.length > 30) continue;
    tagged.push({
      tag: token,
      source: 'top_video',
      frequency: vids.size,
      recommended: false,
    });
  }

  // Step 4: Sort by frequency desc, then mark top 15 as recommended
  tagged.sort((a, b) => b.frequency - a.frequency || (a.source === 'keyword' ? -1 : 1));
  tagged.slice(0, 15).forEach(t => { t.recommended = true; });

  return tagged.slice(0, 30); // Return max 30 suggestions
}

function calcKeywordDensity(refVideos: RefVideo[], pack: LanguagePack): KeywordDensity[] {
  const tokenCount = new Map<string, number>();
  const tokenVideoCount = new Map<string, number>();
  let totalTokens = 0;

  for (const v of refVideos) {
    const tokens = pack.tokenize(v.title || '');
    const seen = new Set<string>();
    for (const t of tokens) {
      tokenCount.set(t, (tokenCount.get(t) ?? 0) + 1);
      totalTokens++;
      if (!seen.has(t)) {
        tokenVideoCount.set(t, (tokenVideoCount.get(t) ?? 0) + 1);
        seen.add(t);
      }
    }
  }

  const result: KeywordDensity[] = [];
  for (const [token, count] of tokenCount.entries()) {
    if (token.length < 2) continue;
    result.push({
      token,
      count,
      videoCount: tokenVideoCount.get(token) ?? 0,
      density: totalTokens > 0 ? Math.round((count / totalTokens) * 100 * 10) / 10 : 0,
    });
  }

  return result
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function buildDescriptionTemplate(
  keyword: string,
  chapters: string[],
  tags: TagSuggestion[],
  lang: ContentLanguage,
): string {
  const template = DESCRIPTION_TEMPLATES[lang] ?? DESCRIPTION_TEMPLATES.ja;
  const chapterText = chapters
    .map((ch, i) => `${String(i * 3).padStart(2, '0')}:${i === 0 ? '00' : String(i * 3 % 60).padStart(2, '0')} ${ch}`)
    .join('\n');

  const topTags = tags.filter(t => t.recommended).slice(0, 5);
  const keywordTag = keyword.replace(/\s+/g, '_');
  const nicheTag = topTags[0]?.tag.replace(/\s+/g, '_') ?? 'YouTube';

  return template
    .replace('{keyword}', keyword)
    .replace('{chapter_template}', chapterText || '[チャプターを追加]')
    .replace('{keyword_tag}', keywordTag)
    .replace('{niche_tag}', nicheTag);
}

function calcOverallScore(
  titleAnalysis: TitleAnalysis,
  tags: TagSuggestion[],
  density: KeywordDensity[],
  hasData: boolean,
): number {
  if (!hasData) return 0;
  let score = 50;

  // Title length score
  if (titleAnalysis.status === 'optimal') score += 20;
  else if (titleAnalysis.status === 'too_short') score += 5;
  else score += 0;

  // Tag richness
  const richTags = tags.filter(t => t.frequency >= 2).length;
  score += Math.min(richTags * 3, 20);

  // Density variety
  const densityScore = Math.min(density.length * 2, 10);
  score += densityScore;

  return Math.min(100, score);
}

// ── Main entry point ──────────────────────────────────────────

export function analyzeSeo(
  keyword: Keyword,
  refVideos: RefVideo[],
  lang?: ContentLanguage,
): SeoAnalysis {
  const language = lang ?? keyword.contentLanguage ?? 'ja';
  const pack = getLanguagePack(language);
  const hasData = refVideos.length > 0;

  const titleAnalysis = analyzeTitleLength(keyword.keyword, language);
  const suggestedTitles = generateSuggestedTitles(keyword.keyword, pack);
  const suggestedTags = extractTags(keyword.keyword, refVideos, pack);
  const keywordDensity = hasData ? calcKeywordDensity(refVideos, pack) : [];
  const descriptionTemplate = buildDescriptionTemplate(
    keyword.keyword,
    keyword.chapters ?? [],
    suggestedTags,
    language,
  );
  const overallScore = calcOverallScore(titleAnalysis, suggestedTags, keywordDensity, hasData);

  return {
    titleAnalysis,
    suggestedTitles,
    suggestedTags,
    descriptionTemplate,
    keywordDensity,
    overallScore,
    hasData,
  };
}
