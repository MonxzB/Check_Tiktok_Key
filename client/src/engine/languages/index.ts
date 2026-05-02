// ============================================================
// engine/languages/index.ts — Registry & helpers
// ============================================================
import type { LanguagePack, ContentLanguage } from './types';
import { ja } from './ja';
import { ko } from './ko';
import { en } from './en';
import { vi } from './vi';

export type { LanguagePack, ContentLanguage };
export type { LanguageSeed } from './types';

export const LANGUAGE_PACKS: Record<ContentLanguage, LanguagePack> = {
  ja, ko, en, vi,
};

export function getLanguagePack(code: ContentLanguage): LanguagePack {
  return LANGUAGE_PACKS[code] ?? LANGUAGE_PACKS.ja;
}

export const SUPPORTED_LANGUAGES: ContentLanguage[] = ['ja', 'ko', 'en', 'vi'];

export const LANGUAGE_OPTIONS: Array<{ code: ContentLanguage; name: string; flag: string }> = [
  { code: 'ja', name: 'Tiếng Nhật',    flag: '🇯🇵' },
  { code: 'ko', name: 'Tiếng Hàn',     flag: '🇰🇷' },
  { code: 'en', name: 'Tiếng Anh',     flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt',    flag: '🇻🇳' },
];
