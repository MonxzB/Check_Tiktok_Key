// ============================================================
// engine/csvUtils.ts — CSV export/import for long-form tool
// ============================================================
import type { Keyword, RefVideo, RefChannel } from '../types';

// ── Keyword CSV headers ───────────────────────────────────────
// Task 2.5:
//   - Headers include unit/scale labels (e.g. "lf_score (0-100)")
//   - When personal scoring enabled: adds personal_score, score_diff, scoring_mode
//   - When disabled: only lf_score (clean export, no confusing empty columns)
//   - score_diff = personal_score − lf_score (helps understand engine adjustments)
const KW_HEADERS_BASE: string[] = [
  'Keyword Japanese', 'Vietnamese Meaning', 'Niche', 'Level',
  'lf_score (0-100)', 'recommendation',
  'demand (0-20)', 'search_intent (0-15)', 'topic_depth (0-15)',
  'small_channel (0-15)', 'evergreen (0-10)', 'series_potential (0-10)',
  'long_tail_exp (0-10)', 'low_risk (0-5)',
  'long_videos_found', 'best_ref_channels', 'best_ref_videos',
  'best_view_sub_ratio', 'suggested_angle',
  'chapters', 'suggested_titles_jp',
  'risk_notes', 'data_sources', 'collected_at',
  'time_window_days', 'region', 'language', 'confidence_level', 'freshness_status',
];

const KW_HEADERS_PERSONAL_EXTRA: string[] = [
  'personal_score (0-100)', 'score_diff (personal−lf)', 'scoring_mode',
];

function buildHeaders(personalScoringEnabled: boolean): string[] {
  if (!personalScoringEnabled) return KW_HEADERS_BASE;
  // Insert personal columns right after lf_score (index 4)
  return [
    ...KW_HEADERS_BASE.slice(0, 5),
    ...KW_HEADERS_PERSONAL_EXTRA,
    ...KW_HEADERS_BASE.slice(5),
  ];
}

function esc(s: unknown): string {
  return '"' + String(s ?? '').replace(/"/g, '""') + '"';
}

/**
 * Task 2.5: Export keywords to CSV with dual-score support.
 *
 * personalScoringEnabled=false  →  only lf_score column (clean, no empty cols)
 * personalScoringEnabled=true   →  adds personal_score, score_diff, scoring_mode
 *   score_diff = personal_score − lf_score
 *   Helps users understand how the ML engine adjusted ranking.
 */
export function exportKeywordsCSV(
  keywords: Keyword[],
  personalScoringEnabled = false,
): string {
  const BOM = '\uFEFF';
  const headers = buildHeaders(personalScoringEnabled);
  const rows: string[] = [headers.join(',')];

  for (const kw of keywords) {
    const api  = kw.apiData  || ({} as Record<string, unknown>);
    const meta = kw.metadata || ({} as Record<string, unknown>);
    const ps   = (kw as any).personalScore as number | undefined;

    // Score columns
    const lfScore      = kw.longFormScore;
    const personalScore = personalScoringEnabled && ps != null ? ps : null;
    const scoreDiff     = personalScore != null ? personalScore - lfScore : null;
    const scoringMode   = personalScore != null ? 'personal' : 'lf';

    // Base row
    const baseRow: (string | number)[] = [
      esc(kw.keyword), esc(kw.vi), esc(kw.niche), kw.level,
      lfScore, esc(kw.recommendation),
      kw.demand, kw.searchIntent, kw.topicDepth,
      kw.smallChannel, kw.evergreen, kw.seriesPotential,
      kw.longTailExp, kw.lowRisk,
      (api as { longVideosFound?: number }).longVideosFound ?? 0,
      esc(((api as { refChannels?: string[] }).refChannels || []).slice(0, 3).join('; ')),
      esc(((api as { refVideoTitles?: string[] }).refVideoTitles || []).slice(0, 3).join('; ')),
      (api as { bestViewSubRatio?: number }).bestViewSubRatio != null
        ? ((api as { bestViewSubRatio: number }).bestViewSubRatio).toFixed(2)
        : '-',
      esc(''),
      esc((kw.chapters || []).join(' | ')),
      esc((kw.suggestedTitles || []).join(' | ')),
      esc(''),
      esc((meta as { dataSourcesUsed?: string }).dataSourcesUsed || 'Rule-based'),
      esc((meta as { collectedAt?: string }).collectedAt || ''),
      (meta as { timeWindowDays?: number }).timeWindowDays ?? '',
      esc((meta as { regionCode?: string }).regionCode || 'JP'),
      esc((meta as { languageCode?: string }).languageCode || 'ja'),
      esc((meta as { confidenceLevel?: string }).confidenceLevel || 'Low'),
      esc((meta as { freshnessStatus?: string }).freshnessStatus || 'Unknown'),
    ];

    if (personalScoringEnabled) {
      // Splice personal columns after lf_score (position 5)
      baseRow.splice(5, 0,
        personalScore ?? lfScore,
        scoreDiff != null ? (scoreDiff > 0 ? `+${scoreDiff.toFixed(1)}` : scoreDiff.toFixed(1)) : '0.0',
        esc(scoringMode),
      );
    }

    rows.push(baseRow.join(','));
  }
  return BOM + rows.join('\n');
}

// ── Other export headers ──────────────────────────────────────
const VIDEO_HEADERS: string[] = [
  'Keyword', 'Video Title', 'Video URL', 'Channel Name', 'Channel URL',
  'Duration', 'Views', 'Likes', 'Comments', 'Published At',
  'Subscribers', 'View/Sub Ratio', 'Long-Form Fit Score', 'Risk Notes',
];

const CHANNEL_HEADERS: string[] = [
  'Keyword', 'Channel Name', 'Channel URL', 'Subscribers', 'Total Views',
  'Video Count', 'Related Long Videos Found', 'Best Related Video',
  'Best Related Video Views', 'Best View/Sub Ratio',
  'Channel Fit Score', 'Reason', 'Risk Notes',
];

export function exportRefVideosCSV(videos: RefVideo[]): string {
  const BOM = '\uFEFF';
  const rows: string[] = [VIDEO_HEADERS.join(',')];
  for (const v of videos) {
    rows.push([
      esc(v.keyword), esc(v.title), esc(v.videoUrl),
      esc(v.channelTitle), esc(v.channelUrl),
      esc(v.durationFormatted || ''), v.viewCount || 0, v.likeCount || 0,
      v.commentCount || 0, esc((v.publishedAt || '').split('T')[0]),
      v.subscriberCount || 0, (v.viewSubRatio || 0).toFixed(2),
      v.longFormFitScore || 0, esc(v.riskNotes || ''),
    ].join(','));
  }
  return BOM + rows.join('\n');
}

export function exportRefChannelsCSV(channels: RefChannel[]): string {
  const BOM = '\uFEFF';
  const rows: string[] = [CHANNEL_HEADERS.join(',')];
  for (const ch of channels) {
    rows.push([
      esc(ch.keyword), esc(ch.channelTitle), esc(ch.channelUrl),
      ch.subscriberCount || 0, ch.viewCount || 0, ch.videoCount || 0,
      ch.relatedLongVideos || 0,
      esc(ch.bestVideoTitle || ''), ch.bestVideoViews || 0,
      (ch.bestViewSubRatio || 0).toFixed(2),
      ch.fitScore || 0, esc(ch.reason || ''), esc(ch.riskNotes || ''),
    ].join(','));
  }
  return BOM + rows.join('\n');
}

// ── CSV Import ────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

export function importKeywordsCSV(text: string): Partial<Keyword>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Schema version detection:
  // v1 (legacy): col[5] = 'recommendation'
  // v2 (Task 2.5): col[5] = 'personal_score (0-100)', col[6] = 'score_diff...', col[7] = 'scoring_mode'
  const headerCols = parseCSVLine(lines[0]);
  const hasPersonalScore = headerCols[5]?.startsWith('personal_score');
  // Column offset: new format has 3 extra cols (personal_score, score_diff, scoring_mode)
  const off = hasPersonalScore ? 3 : 0;

  const results: Partial<Keyword>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCSVLine(lines[i]);
    if (c.length < 6) continue;
    const kw: Partial<Keyword> = {
      keyword: c[0], vi: c[1], niche: c[2] as Keyword['niche'], level: c[3] as Keyword['level'],
      longFormScore: +c[4] || 0, recommendation: c[5 + off],
      demand: +c[6 + off] || 0, searchIntent: +c[7 + off] || 0, topicDepth: +c[8 + off] || 0,
      smallChannel: +c[9 + off] || 0, evergreen: +c[10 + off] || 0,
      seriesPotential: +c[11 + off] || 0, longTailExp: +c[12 + off] || 0,
      lowRisk: +c[13 + off] || 0,
      chapters: c[19 + off] ? c[19 + off].split(' | ') : [],
      suggestedTitles: c[20 + off] ? c[20 + off].split(' | ') : [],
      subKeywords: [],
      reason: '',
      apiData: null,
      metadata: {
        hasApiData: false,
        hasChannelStats: false,
        hasRecentVideos: false,
        collectedAt: c[23 + off] || new Date().toISOString(),
        timeWindowDays: +c[24 + off] || 180,
        regionCode: c[25 + off] || 'JP',
        languageCode: c[26 + off] || 'ja',
        confidenceLevel: (c[27 + off] as 'High' | 'Medium' | 'Low') || 'Low',
        freshnessStatus: (c[28 + off] as 'Fresh' | 'Stale' | 'Old') || 'Old',
      },
    };
    // Restore personal score if present in new format
    if (hasPersonalScore && c[5]) {
      (kw as any).personalScore = +c[5] || undefined;
    }
    results.push(kw);
  }
  return results;
}

export function downloadBlob(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
