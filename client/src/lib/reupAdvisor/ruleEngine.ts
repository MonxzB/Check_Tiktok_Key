// ============================================================
// lib/reupAdvisor/ruleEngine.ts — Phase 19 Decision Tree
// Pure function — no side effects, fully testable.
// ============================================================
import type {
  VideoMeta, Strategy, ReupStrategyResult, DurationBucket, CutConfig,
} from './strategyTypes.ts';

// ── Duration buckets ──────────────────────────────────────────
function getDurationBucket(sec: number): DurationBucket {
  if (sec < 180) return 'micro';     // < 3 min
  if (sec < 600) return 'short';     // 3–10 min
  if (sec < 1200) return 'medium';   // 10–20 min
  if (sec < 3600) return 'long';     // 20–60 min
  return 'epic';                     // > 60 min
}

// ── Copyright risk assessment ─────────────────────────────────
function assessCopyrightRisk(meta: VideoMeta): number {
  let risk = 3; // baseline
  if (meta.viewCount > 1_000_000) risk += 2;
  else if (meta.viewCount > 100_000) risk += 1;
  if (meta.channelSubs > 1_000_000) risk += 3;
  else if (meta.channelSubs > 100_000) risk += 2;
  else if (meta.channelSubs > 10_000) risk += 1;
  if (meta.isOfficialArtist) risk += 3;
  if (meta.categoryId === '10') risk += 2; // Music
  const daysSincePublish = (Date.now() - new Date(meta.publishedAt).getTime()) / 86400000;
  if (daysSincePublish < 30) risk += 1; // very fresh, algo still scanning
  return Math.min(risk, 10);
}

// ── Base CutConfig factory ────────────────────────────────────
function makeConfig(overrides: Partial<CutConfig> = {}): CutConfig {
  return {
    trimStart: 0,
    trimEnd: 0,
    parts: 1,
    durationPerPart: 60,
    breakCut: { enabled: false, keep: 10, skip: 2 },
    duet: { enabled: false, layout: 'top-bottom', bgVideoCategory: 'minecraft-parkour' },
    audioSwap: false,
    customText: [],
    ...overrides,
  };
}

// ── Strategy builders ─────────────────────────────────────────

function buildShortsSpamSafe(meta: VideoMeta): Strategy {
  const clips = Math.floor(meta.duration / 55);
  return {
    id: 'shorts-spam-safe',
    name: 'Shorts Spam — Safe Mode',
    emoji: '✂️',
    outputType: 'shorts',
    estimatedClips: Math.min(clips, 15),
    estimatedClipDuration: 55,
    config: makeConfig({
      trimStart: 10,
      trimEnd: 15,
      parts: Math.min(clips, 15),
      durationPerPart: 55,
      breakCut: { enabled: true, keep: 55, skip: 5 },
    }),
    pros: ['Nhiều clip nhất', 'Đẩy reach nhanh', 'Phù hợp account mới'],
    cons: ['Chất lượng không đồng đều', 'Cần re-upload nhiều'],
    safetyScore: 6,
    effortScore: 4,
    recommendedFor: ['new-account', 'high-volume', 'gaming', 'vlog'],
    reasoning: `Video ${Math.floor(meta.duration / 60)} phút → cắt thành ~${Math.min(clips, 15)} clip Shorts 55 giây. Bỏ 10s đầu/15s cuối để tránh intro/outro bị nhận diện.`,
    rank: 1,
  };
}

function buildShortsSpamAggressive(meta: VideoMeta): Strategy {
  const clips = Math.floor(meta.duration / 45);
  return {
    id: 'shorts-spam-aggressive',
    name: 'Shorts Spam — Aggressive',
    emoji: '⚡',
    outputType: 'shorts',
    estimatedClips: Math.min(clips, 20),
    estimatedClipDuration: 45,
    config: makeConfig({
      trimStart: 5,
      trimEnd: 10,
      parts: Math.min(clips, 20),
      durationPerPart: 45,
      breakCut: { enabled: true, keep: 45, skip: 3 },
    }),
    pros: ['Tối đa số clip', 'Nhanh nhất'],
    cons: ['Rủi ro cao hơn', 'Clip ngắn hơn → ít watch time'],
    safetyScore: 4,
    effortScore: 3,
    recommendedFor: ['high-volume', 'disposable-account'],
    reasoning: `Cắt tối đa ~${Math.min(clips, 20)} clip 45 giây. Phá cắt nhẹ để qua Content ID.`,
    rank: 2,
  };
}

function buildLongformSplit(meta: VideoMeta): Strategy {
  const parts = Math.ceil(meta.duration / 900); // ~15 min per part
  const partDur = Math.floor(meta.duration / parts);
  return {
    id: 'longform-split',
    name: 'Long-form — Chia tập',
    emoji: '🎬',
    outputType: 'longform',
    estimatedClips: parts,
    estimatedClipDuration: partDur,
    config: makeConfig({
      trimStart: 15,
      trimEnd: 20,
      parts,
      durationPerPart: partDur,
      breakCut: { enabled: false, keep: 0, skip: 0 },
      customText: Array.from({ length: parts }, (_, i) => `Tập ${i + 1}/${parts}`),
    }),
    pros: ['Giữ nguyên chất lượng', 'Watch time cao', 'Ít bị flag'],
    cons: ['Ít clip hơn', 'Cần edit thêm intro/outro'],
    safetyScore: 7,
    effortScore: 7,
    recommendedFor: ['established-account', 'tutorial', 'podcast'],
    reasoning: `Video dài → chia ${parts} tập ~${Math.floor(partDur / 60)} phút. Bỏ 15s đầu/20s cuối của toàn bộ video.`,
    rank: 2,
  };
}

function buildBreakCutMedium(meta: VideoMeta, keep = 10, skip = 2): Strategy {
  const clips = Math.floor(meta.duration / (keep + skip));
  return {
    id: 'break-cut-medium',
    name: 'Phá cắt — Medium',
    emoji: '🔀',
    outputType: 'mixed',
    estimatedClips: 1,
    estimatedClipDuration: Math.floor(meta.duration * (keep / (keep + skip))),
    config: makeConfig({
      trimStart: 10,
      trimEnd: 15,
      parts: 1,
      durationPerPart: Math.floor(meta.duration * (keep / (keep + skip))),
      breakCut: { enabled: true, keep, skip },
    }),
    pros: ['1 file duy nhất', 'Qua được basic Content ID', 'Ít công sức'],
    cons: ['Có thể bị giật nội dung', 'Không phù hợp video có storyline'],
    safetyScore: 6,
    effortScore: 2,
    recommendedFor: ['any-account', 'gaming', 'reaction'],
    reasoning: `Giữ ${keep}s, bỏ ${skip}s xen kẽ → tạo ~${clips} đoạn ghép. Tổng thời lượng còn ~${Math.floor(meta.duration * keep / (keep + skip) / 60)} phút.`,
    rank: 3,
  };
}

function buildDuet(meta: VideoMeta): Strategy {
  return {
    id: 'duet-minecraft',
    name: 'Duet — Minecraft Parkour',
    emoji: '🎮',
    outputType: 'duet',
    estimatedClips: Math.floor(meta.duration / 58),
    estimatedClipDuration: 58,
    config: makeConfig({
      trimStart: 0,
      trimEnd: 0,
      parts: Math.floor(meta.duration / 58),
      durationPerPart: 58,
      duet: { enabled: true, layout: 'top-bottom', bgVideoCategory: 'minecraft-parkour' },
    }),
    pros: ['An toàn nhất với kênh lớn', 'Khó bị Content ID', 'Giao diện thân thiện'],
    cons: ['Cần file background video', 'Không giữ full màn hình gốc'],
    safetyScore: 9,
    effortScore: 5,
    recommendedFor: ['high-risk-source', 'official-artist', 'new-account'],
    reasoning: 'Ghép background Minecraft parkour bên dưới/trên video gốc. Content ID chỉ match audio → thêm voiceover hoặc swap để an toàn hơn.',
    rank: 1,
  };
}

function buildAudioSwap(meta: VideoMeta): Strategy {
  return {
    id: 'audio-swap',
    name: 'Audio Swap — Nhạc thay thế',
    emoji: '🎵',
    outputType: 'shorts',
    estimatedClips: Math.floor(meta.duration / 55),
    estimatedClipDuration: 55,
    config: makeConfig({
      trimStart: 0,
      trimEnd: 0,
      parts: Math.floor(meta.duration / 55),
      durationPerPart: 55,
      audioSwap: true,
    }),
    pros: ['Bypass Content ID audio', 'Giữ nguyên visual'],
    cons: ['BUỘC PHẢI dùng nhạc royalty-free', 'Có thể lạ với audience'],
    safetyScore: 8,
    effortScore: 6,
    recommendedFor: ['music-video', 'official-artist'],
    reasoning: 'Thay toàn bộ audio bằng nhạc royalty-free. BẮT BUỘC với video Music — không thể reup nguyên bản.',
    rank: 1,
  };
}

function buildHighlightExtract(meta: VideoMeta): Strategy {
  return {
    id: 'highlight-extract',
    name: 'Highlight — Cắt đỉnh cao',
    emoji: '🏆',
    outputType: 'mixed',
    estimatedClips: 3,
    estimatedClipDuration: 120,
    config: makeConfig({
      trimStart: 0,
      trimEnd: 0,
      parts: 3,
      durationPerPart: 120,
      selectRange: { enabled: true, fromSecond: 0, toSecond: meta.duration },
      customText: ['Đỉnh 1', 'Đỉnh 2', 'Đỉnh 3'],
    }),
    pros: ['Chất lượng cao nhất', 'Giữ được context', 'Phù hợp Gaming/Sports'],
    cons: ['Cần xem video trước để chọn đoạn', 'Tốn thời gian nhất'],
    safetyScore: 7,
    effortScore: 9,
    recommendedFor: ['gaming', 'sports', 'established-account'],
    reasoning: 'Xem toàn bộ video, chọn 3 khoảnh khắc đỉnh nhất → cắt thủ công. Cho kết quả tốt nhất nhưng tốn công nhất.',
    rank: 3,
  };
}

// ── Main rule engine ──────────────────────────────────────────
export function runRuleEngine(meta: VideoMeta): ReupStrategyResult {
  const bucket = getDurationBucket(meta.duration);
  const copyrightRisk = assessCopyrightRisk(meta);
  const categoryId = meta.categoryId;
  const isMusic = categoryId === '10';
  const isGaming = categoryId === '20';
  const isSports = categoryId === '17';
  const isEducation = categoryId === '27' || categoryId === '28';
  const isNews = categoryId === '25';
  const isPodcastVlog = categoryId === '22' || categoryId === '24'; // People & Blogs | Entertainment
  const isHighRisk = copyrightRisk >= 7 || meta.isOfficialArtist;

  const strategies: Strategy[] = [];
  let primaryRec: 'shorts' | 'longform' | 'both' = 'shorts';
  let confidence = 70;

  // ── MUSIC: must audio swap or duet ─────────────────────────
  if (isMusic) {
    strategies.push(buildAudioSwap(meta));
    strategies.push(buildDuet(meta));
    return finalize(strategies, meta, 'shorts', 95, copyrightRisk, 'rules');
  }

  // ── MICRO (< 3 min): only duet or audio swap ───────────────
  if (bucket === 'micro') {
    strategies.push(buildDuet(meta));
    strategies.push(buildBreakCutMedium(meta, 5, 1));
    if (isHighRisk) strategies.push(buildAudioSwap(meta));
    return finalize(strategies, meta, 'shorts', 80, copyrightRisk, 'rules');
  }

  // ── HIGH RISK: force duet first ────────────────────────────
  if (isHighRisk) {
    strategies.push(buildDuet(meta));
    if (bucket === 'short' || bucket === 'medium') {
      strategies.push(buildShortsSpamSafe(meta));
      strategies.push(buildBreakCutMedium(meta, 8, 2));
    } else {
      strategies.push(buildLongformSplit(meta));
      strategies.push(buildBreakCutMedium(meta, 10, 2));
    }
    confidence = 85;
  }
  // ── GAMING / SPORTS: phá cắt OK ────────────────────────────
  else if (isGaming || isSports) {
    if (bucket === 'short' || bucket === 'medium') {
      strategies.push(buildShortsSpamSafe(meta));
      strategies.push(buildShortsSpamAggressive(meta));
      strategies.push(buildBreakCutMedium(meta, 5, 2));
      strategies.push(buildHighlightExtract(meta));
    } else {
      strategies.push(buildHighlightExtract(meta));
      strategies.push(buildLongformSplit(meta));
      strategies.push(buildShortsSpamSafe(meta));
      strategies.push(buildBreakCutMedium(meta, 5, 2));
      primaryRec = 'both';
    }
    confidence = 88;
  }
  // ── EDUCATION / TUTORIAL: no break-cut, only split ─────────
  else if (isEducation) {
    if (bucket === 'short') {
      strategies.push(buildShortsSpamSafe(meta));
      strategies.push(buildBreakCutMedium(meta, 10, 1)); // gentle
    } else {
      strategies.push(buildLongformSplit(meta));
      strategies.push(buildShortsSpamSafe(meta));
      primaryRec = bucket === 'long' || bucket === 'epic' ? 'longform' : 'both';
    }
    strategies.push(buildDuet(meta));
    confidence = 82;
  }
  // ── NEWS: cắt mạnh đầu/đuôi ────────────────────────────────
  else if (isNews) {
    const newsMeta = { ...meta, duration: meta.duration - 60 }; // assume 30s intro + 30s outro
    strategies.push(buildBreakCutMedium(newsMeta, 8, 2));
    strategies.push(buildShortsSpamSafe(newsMeta));
    strategies.push(buildDuet(meta));
    confidence = 75;
  }
  // ── PODCAST / VLOG: gentle cut ─────────────────────────────
  else if (isPodcastVlog) {
    strategies.push(buildBreakCutMedium(meta, 12, 1));
    strategies.push(buildLongformSplit(meta));
    strategies.push(buildShortsSpamSafe(meta));
    primaryRec = 'both';
    confidence = 78;
  }
  // ── DEFAULT: medium bucket ─────────────────────────────────
  else {
    if (bucket === 'short' || bucket === 'medium') {
      strategies.push(buildShortsSpamSafe(meta));
      strategies.push(buildBreakCutMedium(meta, 10, 2));
      strategies.push(buildDuet(meta));
    } else {
      strategies.push(buildLongformSplit(meta));
      strategies.push(buildShortsSpamSafe(meta));
      strategies.push(buildBreakCutMedium(meta, 10, 2));
      strategies.push(buildDuet(meta));
      primaryRec = 'both';
    }
    confidence = 72;
  }

  return finalize(strategies, meta, primaryRec, confidence, copyrightRisk, 'rules');
}

// ── Finalize: rank + deduplicate ──────────────────────────────
function finalize(
  strategies: Strategy[],
  meta: VideoMeta,
  primaryRec: 'shorts' | 'longform' | 'both',
  confidence: number,
  copyrightRisk: number,
  generatedBy: 'rules' | 'llm' | 'hybrid',
): ReupStrategyResult {
  // Score each strategy: safetyScore*0.6 + normalised_clips*0.4
  const maxClips = Math.max(...strategies.map(s => s.estimatedClips), 1);
  const scored = strategies.map((s, i) => ({
    ...s,
    rank: i + 1,
    _sort: s.safetyScore * 0.6 + (s.estimatedClips / maxClips) * 10 * 0.4,
  }));
  scored.sort((a, b) => b._sort - a._sort);

  // Assign final ranks
  const ranked = scored.slice(0, 5).map((s, i) => {
    const { _sort: _ignored, ...clean } = s;
    void _ignored;
    return { ...clean, rank: i + 1 };
  });

  return {
    videoMeta: meta,
    primaryRecommendation: primaryRec,
    confidence,
    copyrightRisk,
    strategies: ranked,
    generatedBy,
    generatedAt: new Date().toISOString(),
  };
}
