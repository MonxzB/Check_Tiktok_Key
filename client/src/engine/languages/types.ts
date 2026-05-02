// ============================================================
// engine/languages/types.ts — Language pack interface
// ============================================================
import type { Niche } from '../../types';

export type ContentLanguage = 'ja' | 'ko' | 'en' | 'vi';

export interface LanguageSeed {
  text: string;
  vi: string;     // Vietnamese translation for display
  niche?: Niche;  // Optional: classifyNiche() fills if missing
}

export interface LanguagePack {
  code: ContentLanguage;
  name: string;       // "Tiếng Nhật"
  flag: string;       // "🇯🇵"
  regionCode: string; // YouTube regionCode default
  languageCode: string; // YouTube languageCode default

  // Default seed keywords
  defaultSeeds: LanguageSeed[];

  // Expansion patterns
  longFormSuffixes: string[];    // Pattern A: seed + suffix
  problemMarkers: string[];      // Pattern B: topic problems
  audienceMarkers: string[];     // Pattern C: target audience
  benefitMarkers: string[];      // Pattern D: benefits
  longTailConnectors: string[];  // Pattern E: long-tail connectors

  // Per-niche overrides
  nicheProblems: Partial<Record<Niche, string[]>>;
  nicheBenefits: Partial<Record<Niche, string[]>>;

  // Detection
  riskyMarkers: string[];
  evergreenMarkers: string[];
  searchIntentBoost: string[];
  topicDepthSignals: string[];

  // Chapter & title templates
  titleTemplates: string[];
  chapterTemplates: {
    tutorial: string[];
    comparison: string[];
    ranking: string[];
    default: string[];
  };

  // Translation map for display
  translationMap: Record<string, string>;

  // Niche heat override (JP-specific niches differ from EN)
  nicheHeatOverride?: Partial<Record<Niche, number>>;

  // Tokenizer
  tokenize: (text: string) => string[];
}
