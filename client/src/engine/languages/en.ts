// ============================================================
// engine/languages/en.ts — English language pack
// ============================================================
import type { LanguagePack } from './types';

function tokenizeEn(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !EN_STOPWORDS.has(t));
}

const EN_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'how', 'why', 'what', 'when', 'you',
  'your', 'from', 'that', 'this', 'have', 'are', 'was', 'not', 'can',
  'all', 'get', 'its', 'but', 'our', 'use', 'one', 'top',
]);

export const en: LanguagePack = {
  code: 'en',
  name: 'Tiếng Anh',
  flag: '🇺🇸',
  regionCode: 'US',
  languageCode: 'en',

  defaultSeeds: [
    { text: 'ChatGPT tutorial',           vi: 'Hướng dẫn ChatGPT',        niche: 'AI / ChatGPT' },
    { text: 'ChatGPT productivity',       vi: 'ChatGPT tăng năng suất',    niche: 'AI / ChatGPT' },
    { text: 'AI tools for work',          vi: 'Công cụ AI cho công việc',   niche: 'AI / ChatGPT' },
    { text: 'Excel tutorial',             vi: 'Hướng dẫn Excel',           niche: 'Excel / Office' },
    { text: 'Excel automation',           vi: 'Tự động hóa Excel',         niche: 'Excel / Office' },
    { text: 'productivity tips',          vi: 'Mẹo tăng năng suất',        niche: 'Công việc' },
    { text: 'side hustle ideas',          vi: 'Ý tưởng nghề tay trái',     niche: 'Công việc' },
    { text: 'how to save money',          vi: 'Cách tiết kiệm tiền',       niche: 'Tiết kiệm' },
    { text: 'study tips',                 vi: 'Mẹo học tập',               niche: 'Học tập' },
    { text: 'learn English fast',         vi: 'Học tiếng Anh nhanh',       niche: 'Học tập' },
    { text: 'Python for beginners',       vi: 'Python cho người mới',      niche: 'Lập trình' },
    { text: 'JavaScript tutorial',        vi: 'Hướng dẫn JavaScript',      niche: 'Lập trình' },
    { text: 'personal finance',           vi: 'Tài chính cá nhân',         niche: 'Kinh doanh' },
    { text: 'healthy habits',             vi: 'Thói quen lành mạnh',       niche: 'Sức khỏe' },
    { text: 'psychology explained',       vi: 'Tâm lý học giải thích',     niche: 'Tâm lý học' },
    { text: 'business marketing',         vi: 'Marketing kinh doanh',      niche: 'Kinh doanh' },
    { text: 'time management',            vi: 'Quản lý thời gian',         niche: 'Công việc' },
    { text: 'job interview tips',         vi: 'Mẹo phỏng vấn xin việc',   niche: 'Phỏng vấn' },
  ],

  longFormSuffixes: [
    'complete guide', 'tutorial', 'explained', 'comparison', 'review',
    'masterclass', 'tips', 'how to', 'walkthrough', 'deep dive',
    'for beginners', 'full course', 'step by step', 'everything you need to know',
  ],

  problemMarkers: [
    'mistakes', 'pitfalls', 'common errors', 'avoid', 'warning',
    'problems', 'issues', 'challenges', 'stop doing',
  ],

  audienceMarkers: [
    'for beginners', 'for professionals', 'for students', 'advanced',
    'for working adults', 'for freelancers', 'for entrepreneurs',
  ],

  benefitMarkers: [
    'productivity', 'efficiency', 'time saving', 'success', 'income',
    'free', 'easy', 'skill up', 'make money', 'passive income',
  ],

  longTailConnectors: ['how to', 'guide', 'complete guide', 'mistakes to avoid'],

  nicheProblems: {
    'AI / ChatGPT':    ['writing', 'coding', 'email', 'presentation', 'translation', 'image generation', 'automation'],
    'Excel / Office':  ['formulas', 'macros', 'VBA', 'pivot tables', 'charts', 'data analysis', 'automation'],
    'Lập trình':       ['Python', 'JavaScript', 'Git', 'API', 'database', 'web dev', 'AI'],
    'Công việc':       ['overtime', 'boss', 'job change', 'interview', 'resume', 'email', 'report'],
    'Phỏng vấn':       ['self introduction', 'motivation', 'resignation reason', 'questions to ask', 'dress code'],
    'Tiết kiệm':       ['food budget', 'utility bills', 'subscription', 'credit card', 'debt'],
    'Học tập':         ['language learning', 'math', 'memorization', 'focus', 'note-taking', 'exam prep'],
    'Tâm lý học':      ['cognitive bias', 'habits', 'motivation', 'relationships', 'self-esteem', 'stress'],
    'Kiến thức / Fact':['science', 'history', 'economics', 'psychology', 'universe', 'biology'],
    'Kinh doanh':      ['marketing', 'social media', 'branding', 'customer acquisition', 'revenue', 'startup'],
    'Sức khỏe':        ['sleep', 'diet', 'exercise', 'stress', 'mental health', 'weight loss'],
  },

  nicheBenefits: {
    'AI / ChatGPT':    ['save time', 'automate', 'work faster', 'free', 'easy', 'pro level'],
    'Excel / Office':  ['save time', 'automate', 'efficient', 'free', 'easy', 'skill up'],
    'Lập trình':       ['freelance', 'remote work', 'job opportunity', 'skill up', 'automate'],
    'Công việc':       ['promotion', 'efficiency', 'save time', 'better evaluation', 'less stress'],
    'Phỏng vấn':       ['job offer', 'pass', 'great impression', 'higher salary', 'career change'],
    'Tiết kiệm':       ['save $1000/month', 'half price', 'free', 'start now', 'cut expenses'],
    'Học tập':         ['better grades', 'pass exam', 'short time', 'efficient', 'enjoyable'],
    'Tâm lý học':      ['attract people', 'liked by others', 'confidence', 'improve', 'overcome'],
    'Kiến thức / Fact':['amazing', 'interesting', 'mind-blowing', 'shocking', 'makes sense'],
    'Kinh doanh':      ['revenue increase', 'customer acquisition', 'automate', 'brand power'],
    'Sức khỏe':        ['healthy', 'improve', 'effective', 'easy', 'sustainable'],
  },

  riskyMarkers: [
    'anime', 'movie clip', 'reaction', 'compilation', 'fan edit',
    'copyright', 'pirated', 'leaked', 'recap episode', 'full episode',
  ],

  evergreenMarkers: [
    'how to', 'guide', 'tutorial', 'basics', 'introduction',
    'explained', 'complete', 'fundamentals', 'tips', 'principles',
  ],

  searchIntentBoost: [
    'how to', 'tutorial', 'beginner', 'explained', 'complete guide', 'comparison',
    'review', 'ranking', 'best', 'warning', 'mistakes', 'avoid',
    'method', 'step by step', 'tips', 'masterclass',
    'introduction', 'overview', 'deep dive', 'walkthrough',
  ],

  topicDepthSignals: [
    'complete guide', 'in depth', 'introduction', 'basics', 'advanced',
    'how it works', 'why', 'step by step', 'process', 'flow',
    'from scratch', 'from zero', 'fundamentals',
  ],

  titleTemplates: [
    '{kw} Complete Guide - For Beginners',
    'How to {kw} - Step by Step Tutorial',
    '{kw} Mistakes You\'re Making (And How to Fix)',
    '{kw} That Will Change Your Life',
    '{kw} - Everything You Need to Know',
    '{kw} for Beginners | Start from Zero',
    'Expert\'s Guide to {kw}',
    'What Nobody Tells You About {kw}',
  ],

  chapterTemplates: {
    tutorial: [
      'Introduction / Why This Matters',
      'Core Concepts & Terminology',
      'Tools & Prerequisites',
      'Step-by-Step Process',
      'Common Mistakes & Pitfalls',
      'Advanced Tips & Applications',
      'Summary & Next Steps',
    ],
    comparison: [
      'Introduction / Goal of Comparison',
      'Overview of Options',
      'Features & Performance',
      'Price & Value',
      'Ease of Use',
      'Who Each Option Is Best For',
      'Final Verdict & Recommendation',
    ],
    ranking: [
      'Introduction / Selection Criteria',
      '#5', '#4', '#3', '#2', '#1',
      'Summary & How to Choose',
    ],
    default: [
      'Introduction',
      'Background Knowledge',
      'Step-by-Step Method',
      'Real Examples & Case Studies',
      'Common Pitfalls',
      'Advanced Applications',
      'Summary',
    ],
  },

  translationMap: {
    'beginner': 'người mới', 'tutorial': 'hướng dẫn', 'guide': 'hướng dẫn',
    'comparison': 'so sánh', 'review': 'đánh giá', 'save time': 'tiết kiệm thời gian',
    'automate': 'tự động hóa', 'efficient': 'hiệu quả', 'free': 'miễn phí',
  },

  nicheHeatOverride: {
    '100均': 5,       // 100-yen store not relevant for EN market
    'Văn hóa Nhật': 8, // Less relevant for US audience
  },

  tokenize: tokenizeEn,
};
