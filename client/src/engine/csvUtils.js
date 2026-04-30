// ============================================================
// engine/csvUtils.js — CSV export/import for long-form tool
// ============================================================

// ── Keyword CSV (28 columns) ──────────────────────────────────
const KW_HEADERS = [
  'Keyword Japanese', 'Vietnamese Meaning', 'Niche', 'Level',
  'Long-Form Score', 'Recommendation',
  'Demand Score', 'Search Intent Score', 'Topic Depth Score',
  'Small Channel Score', 'Evergreen Score', 'Series Potential Score',
  'Long-Tail Expansion Score', 'Low Risk Score',
  'Long Videos Found', 'Best Reference Channels', 'Best Reference Videos',
  'Best View/Sub Ratio', 'Suggested Long Video Angle',
  'Suggested Chapters', 'Suggested Japanese Titles',
  'Risk Notes', 'Data Sources Used', 'Collected At',
  'Time Window (days)', 'Region', 'Language', 'Confidence Level', 'Freshness Status',
];

// ── Reference Videos CSV ──────────────────────────────────────
const VIDEO_HEADERS = [
  'Keyword', 'Video Title', 'Video URL', 'Channel Name', 'Channel URL',
  'Duration', 'Views', 'Likes', 'Comments', 'Published At',
  'Subscribers', 'View/Sub Ratio', 'Long-Form Fit Score', 'Risk Notes',
];

// ── Reference Channels CSV ────────────────────────────────────
const CHANNEL_HEADERS = [
  'Keyword', 'Channel Name', 'Channel URL', 'Subscribers', 'Total Views',
  'Video Count', 'Related Long Videos Found', 'Best Related Video',
  'Best Related Video Views', 'Best View/Sub Ratio',
  'Channel Fit Score', 'Reason', 'Risk Notes',
];

function esc(s) {
  return '"' + String(s ?? '').replace(/"/g, '""') + '"';
}

export function exportKeywordsCSV(keywords) {
  const BOM = '\uFEFF';
  const rows = [KW_HEADERS.join(',')];
  for (const kw of keywords) {
    const api = kw.apiData || {};
    const meta = kw.metadata || {};
    rows.push([
      esc(kw.keyword), esc(kw.vi), esc(kw.niche), kw.level,
      kw.longFormScore, esc(kw.recommendation),
      kw.demand, kw.searchIntent, kw.topicDepth,
      kw.smallChannel, kw.evergreen, kw.seriesPotential,
      kw.longTailExp, kw.lowRisk,
      api.longVideosFound ?? 0,
      esc((api.refChannels || []).slice(0, 3).join('; ')),
      esc((api.refVideoTitles || []).slice(0, 3).join('; ')),
      api.bestViewSubRatio?.toFixed(2) ?? '-',
      esc(kw.suggestedAngle || ''),
      esc((kw.chapters || []).join(' | ')),
      esc((kw.suggestedTitles || []).join(' | ')),
      esc(kw.riskNotes || ''),
      esc(meta.dataSourcesUsed || 'Rule-based'),
      esc(meta.collectedAt || ''),
      meta.timeWindowDays ?? '',
      esc(meta.regionCode || 'JP'),
      esc(meta.languageCode || 'ja'),
      esc(meta.confidenceLevel || 'Low'),
      esc(meta.freshnessStatus || 'Unknown'),
    ].join(','));
  }
  return BOM + rows.join('\n');
}

export function exportRefVideosCSV(videos) {
  const BOM = '\uFEFF';
  const rows = [VIDEO_HEADERS.join(',')];
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

export function exportRefChannelsCSV(channels) {
  const BOM = '\uFEFF';
  const rows = [CHANNEL_HEADERS.join(',')];
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
function parseCSVLine(line) {
  const result = []; let current = ''; let inQuotes = false;
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

export function importKeywordsCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCSVLine(lines[i]);
    if (c.length < 6) continue;
    results.push({
      keyword: c[0], vi: c[1], niche: c[2], level: c[3],
      longFormScore: +c[4] || 0, recommendation: c[5],
      demand: +c[6] || 0, searchIntent: +c[7] || 0, topicDepth: +c[8] || 0,
      smallChannel: +c[9] || 0, evergreen: +c[10] || 0,
      seriesPotential: +c[11] || 0, longTailExp: +c[12] || 0,
      lowRisk: +c[13] || 0,
      chapters: c[19] ? c[19].split(' | ') : [],
      suggestedTitles: c[20] ? c[20].split(' | ') : [],
      riskNotes: c[21] || '',
      apiData: null,
      metadata: {
        dataSourcesUsed: c[22], collectedAt: c[23],
        timeWindowDays: +c[24] || 180, regionCode: c[25] || 'JP',
        languageCode: c[26] || 'ja', confidenceLevel: c[27] || 'Low',
        freshnessStatus: c[28] || 'Unknown',
      },
    });
  }
  return results;
}

export function downloadBlob(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
