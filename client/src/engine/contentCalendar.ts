// ============================================================
// engine/contentCalendar.ts — Phase 13: Content Calendar
// Generates a publishing schedule from scored keywords
// ============================================================
import type { Keyword } from '../types';
import type { ContentLanguage } from './languages/index';

// ── Types ─────────────────────────────────────────────────────

export type PostFrequency = 1 | 2 | 3 | 4;  // videos per week
export type ContentType   = 'long-form' | 'short' | 'community';
export type Priority      = 'urgent' | 'high' | 'medium' | 'low';

export interface CalendarEntry {
  id: string;             // Unique entry ID
  keyword: Keyword;
  suggestedDate: Date;
  contentType: ContentType;
  priority: Priority;
  estimatedScore: number; // LF score at time of scheduling
  title: string;          // Primary suggested title
  chapters: string[];
  notes: string;
  status: 'planned' | 'in-progress' | 'published' | 'skipped';
  // Persistent user overrides
  customDate?: string;    // ISO string
  customTitle?: string;
  userNotes?: string;
}

export interface CalendarOptions {
  startDate?: Date;
  frequency: PostFrequency;  // videos/week
  lang: ContentLanguage;
  minScore: number;          // Only include kws with score >= this
  maxWeeks: number;          // Calendar horizon in weeks
}

export interface CalendarWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  entries: CalendarEntry[];
}

export interface ContentCalendar {
  weeks: CalendarWeek[];
  totalEntries: number;
  publishingDays: number[];  // Day-of-week indices (0=Sun…6=Sat)
  options: CalendarOptions;
}

// ── Priority Mapping ──────────────────────────────────────────
function scoreToPriority(score: number): Priority {
  if (score >= 85) return 'urgent';
  if (score >= 70) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
}

// ── Publishing day selection ──────────────────────────────────
// Best days: Mon(1), Wed(3), Fri(5), Sat(6)
const PUBLISH_DAY_SETS: Record<PostFrequency, number[]> = {
  1: [3],          // Wednesday
  2: [1, 4],       // Mon + Thu
  3: [1, 3, 5],    // Mon + Wed + Fri
  4: [1, 2, 4, 6], // Mon + Tue + Thu + Sat
};

function getNextPublishDate(from: Date, publishDays: number[]): Date {
  const d = new Date(from);
  d.setHours(10, 0, 0, 0); // 10:00 AM
  let attempts = 0;
  while (!publishDays.includes(d.getDay())) {
    d.setDate(d.getDate() + 1);
    if (++attempts > 7) break;
  }
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ── Week builder ──────────────────────────────────────────────
function buildWeek(weekNumber: number, startDate: Date): CalendarWeek {
  return {
    weekNumber,
    startDate,
    endDate: addDays(startDate, 6),
    entries: [],
  };
}

// ── Entry builder ─────────────────────────────────────────────
function buildEntry(kw: Keyword, date: Date, idx: number): CalendarEntry {
  const title = kw.suggestedTitles?.[0] ?? kw.keyword;
  const contentType: ContentType =
    kw.longFormScore >= 75 ? 'long-form' :
    kw.longFormScore >= 50 ? 'long-form' : 'short';

  return {
    id: `cal-${idx}-${kw.keyword.replace(/\s+/g, '_').slice(0, 20)}`,
    keyword: kw,
    suggestedDate: new Date(date),   // always a real Date object
    contentType,
    priority: scoreToPriority(kw.longFormScore),
    estimatedScore: kw.longFormScore,
    title: String(title ?? kw.keyword),
    chapters: Array.isArray(kw.chapters) ? kw.chapters.slice(0, 5) : [],
    notes: kw.reason ?? '',
    status: 'planned',
  };
}

// ── Main generator ────────────────────────────────────────────
export function generateCalendar(
  keywords: Keyword[],
  options: CalendarOptions,
): ContentCalendar {
  const {
    startDate = new Date(),
    frequency,
    minScore,
    maxWeeks,
  } = options;

  const publishDays = PUBLISH_DAY_SETS[frequency];

  // Filter & sort by score desc
  const eligible = [...keywords]
    .filter(k => k.longFormScore >= minScore)
    .sort((a, b) => b.longFormScore - a.longFormScore);

  // Build week containers
  const weeks: CalendarWeek[] = [];
  const weekStart = new Date(startDate);
  weekStart.setHours(0, 0, 0, 0);
  // Align to start of week (Monday)
  const dow = weekStart.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + daysToMon);

  for (let w = 0; w < maxWeeks; w++) {
    weeks.push(buildWeek(w + 1, addDays(weekStart, w * 7)));
  }

  // Assign entries to slots
  let cursor = new Date(startDate);
  let entryIdx = 0;

  for (const kw of eligible) {
    // Find next available publish date from cursor
    cursor = getNextPublishDate(cursor, publishDays);
    const weekIdx = Math.floor(
      (cursor.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (weekIdx >= maxWeeks || weekIdx < 0) break;

    const entry = buildEntry(kw, cursor, entryIdx++);
    weeks[weekIdx].entries.push(entry);

    // Advance cursor by days-per-slot
    const daysPerSlot = Math.floor(7 / frequency);
    cursor = addDays(cursor, daysPerSlot);
  }

  return {
    weeks: weeks.filter(w => w.entries.length > 0), // Only non-empty weeks
    totalEntries: entryIdx,
    publishingDays: publishDays,   // Fix: was 'publishingDays' (shorthand for undefined var)
    options,
  };
}

// ── Calendar export as Markdown schedule ──────────────────────
export function exportCalendarMd(cal: ContentCalendar): string {
  const lines: string[] = ['# 📅 Content Calendar\n'];
  for (const week of cal.weeks) {
    const weekLabel = `Week ${week.weekNumber}: ${formatDate(week.startDate)} – ${formatDate(week.endDate)}`;
    lines.push(`## ${weekLabel}\n`);
    for (const e of week.entries) {
      const day = e.customDate
        ? formatDate(new Date(e.customDate))
        : formatDate(e.suggestedDate);
      const priBadge = e.priority === 'urgent' ? '🔴' : e.priority === 'high' ? '🟠' : e.priority === 'medium' ? '🟡' : '⚪';
      lines.push(`### ${priBadge} ${day} — ${e.customTitle ?? e.title}`);
      lines.push(`- **Keyword**: ${e.keyword.keyword}`);
      lines.push(`- **Score**: ${e.estimatedScore}/100`);
      lines.push(`- **Type**: ${e.contentType}`);
      if (e.chapters.length > 0) {
        lines.push('- **Chapters**:');
        e.chapters.forEach((ch, i) => lines.push(`  ${i + 1}. ${ch}`));
      }
      if (e.userNotes) lines.push(`- **Notes**: ${e.userNotes}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

// ── Persistence helpers (localStorage) ───────────────────────
const CALENDAR_STATUS_KEY = 'ytlf_calendar_status';
const CALENDAR_NOTES_KEY  = 'ytlf_calendar_notes';
const CALENDAR_TITLES_KEY = 'ytlf_calendar_titles';
const CALENDAR_DATES_KEY  = 'ytlf_calendar_dates';

type StatusMap = Record<string, CalendarEntry['status']>;
type StringMap = Record<string, string>;

export function saveEntryStatus(id: string, status: CalendarEntry['status']): void {
  try {
    const map: StatusMap = JSON.parse(localStorage.getItem(CALENDAR_STATUS_KEY) ?? '{}');
    map[id] = status;
    localStorage.setItem(CALENDAR_STATUS_KEY, JSON.stringify(map));
  } catch {}
}

export function saveEntryNote(id: string, note: string): void {
  try {
    const map: StringMap = JSON.parse(localStorage.getItem(CALENDAR_NOTES_KEY) ?? '{}');
    map[id] = note;
    localStorage.setItem(CALENDAR_NOTES_KEY, JSON.stringify(map));
  } catch {}
}

export function saveEntryTitle(id: string, title: string): void {
  try {
    const map: StringMap = JSON.parse(localStorage.getItem(CALENDAR_TITLES_KEY) ?? '{}');
    map[id] = title;
    localStorage.setItem(CALENDAR_TITLES_KEY, JSON.stringify(map));
  } catch {}
}

export function saveEntryDate(id: string, date: string): void {
  try {
    const map: StringMap = JSON.parse(localStorage.getItem(CALENDAR_DATES_KEY) ?? '{}');
    map[id] = date;
    localStorage.setItem(CALENDAR_DATES_KEY, JSON.stringify(map));
  } catch {}
}

export function loadCalendarOverrides(): {
  statuses: StatusMap;
  notes: StringMap;
  titles: StringMap;
  dates: StringMap;
} {
  try {
    return {
      statuses: JSON.parse(localStorage.getItem(CALENDAR_STATUS_KEY) ?? '{}'),
      notes:    JSON.parse(localStorage.getItem(CALENDAR_NOTES_KEY)  ?? '{}'),
      titles:   JSON.parse(localStorage.getItem(CALENDAR_TITLES_KEY) ?? '{}'),
      dates:    JSON.parse(localStorage.getItem(CALENDAR_DATES_KEY)  ?? '{}'),
    };
  } catch {
    return { statuses: {}, notes: {}, titles: {}, dates: {} };
  }
}

/** Apply saved overrides to freshly generated calendar entries */
export function applyOverrides(cal: ContentCalendar): ContentCalendar {
  const { statuses, notes, titles, dates } = loadCalendarOverrides();
  return {
    ...cal,
    weeks: cal.weeks.map(w => ({
      ...w,
      entries: w.entries.map(e => ({
        ...e,
        status:      statuses[e.id] ?? e.status,
        userNotes:   notes[e.id]    ?? e.userNotes,
        customTitle: titles[e.id]   ?? e.customTitle,
        customDate:  dates[e.id]    ?? e.customDate,
      })),
    })),
  };
}
