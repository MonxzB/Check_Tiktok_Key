// ============================================================
// engine/thumbnailIdeas.ts — Phase 15: Thumbnail A/B Ideas
// Generates thumbnail concept frameworks based on keyword data
// ============================================================
import type { Keyword } from '../types';
import type { ContentLanguage } from './languages/index';

// ── Types ─────────────────────────────────────────────────────

export type ThumbnailStyle =
  | 'face-reaction'   // Close-up shocked/excited face
  | 'before-after'    // Split-screen transformation
  | 'listicle'        // Number + grid
  | 'text-heavy'      // Big bold text, minimal image
  | 'cinematic'       // Wide shot, movie-poster feel
  | 'tutorial'        // Step-by-step, arrow, circles
  | 'comparison'      // Side-by-side
  | 'mystery'         // Blurred/hidden element + question
  | 'result'          // Show the final outcome first;

export interface ThumbnailConcept {
  id: string;
  style: ThumbnailStyle;
  styleLabel: string;
  headline: string;          // Big text on thumbnail
  subtext?: string;          // Smaller supporting text
  visualDescription: string; // What the image should show
  colorPalette: string[];    // Hex colors that work for this style
  ctaHook: string;           // First 3 seconds of video hook matching this thumbnail
  abVariantOf?: string;      // ID of the concept this is testing against
  estimatedCtr: 'high' | 'medium' | 'low';
  tips: string[];            // Actionable design tips
}

export interface ThumbnailIdeaSet {
  keyword: Keyword;
  concepts: ThumbnailConcept[];
  lang: ContentLanguage;
}

// ── Style metadata ────────────────────────────────────────────
const STYLE_LABELS: Record<ThumbnailStyle, string> = {
  'face-reaction': '😱 Face Reaction',
  'before-after':  '↔️ Before/After',
  'listicle':      '🔢 Listicle',
  'text-heavy':    '💬 Text Heavy',
  'cinematic':     '🎬 Cinematic',
  'tutorial':      '🎯 Tutorial',
  'comparison':    '⚖️ Comparison',
  'mystery':       '❓ Mystery',
  'result':        '✅ Result First',
};

// ── CTR estimates by style ────────────────────────────────────
const STYLE_CTR: Record<ThumbnailStyle, ThumbnailConcept['estimatedCtr']> = {
  'face-reaction': 'high',
  'mystery':       'high',
  'before-after':  'high',
  'result':        'high',
  'listicle':      'medium',
  'comparison':    'medium',
  'tutorial':      'medium',
  'text-heavy':    'medium',
  'cinematic':     'low',
};

// ── Color palettes per style ──────────────────────────────────
const STYLE_COLORS: Record<ThumbnailStyle, string[]> = {
  'face-reaction': ['#FF4B2B', '#FF416C', '#FFFFFF'],
  'before-after':  ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
  'listicle':      ['#f9c74f', '#f3722c', '#FFFFFF', '#023e8a'],
  'text-heavy':    ['#000000', '#FFFF00', '#FFFFFF', '#FF0000'],
  'cinematic':     ['#1c1c1c', '#d4af37', '#8b0000', '#f5f5f5'],
  'tutorial':      ['#00b4d8', '#0077b6', '#FFFFFF', '#caf0f8'],
  'comparison':    ['#4361ee', '#f72585', '#FFFFFF'],
  'mystery':       ['#2d3436', '#6c5ce7', '#FFFFFF', '#fdcb6e'],
  'result':        ['#2d6a4f', '#52b788', '#FFFFFF', '#d8f3dc'],
};

// ── Headline templates by language ────────────────────────────
function getTemplates(
  kw: Keyword,
  lang: ContentLanguage,
): Record<ThumbnailStyle, { headline: string; subtext?: string; visual: string; hook: string }> {
  const k  = kw.keyword;
  const vi = kw.vi ?? kw.keyword;
  const n  = kw.chapters?.length ?? 5;

  // Shorthand for language-specific phrases
  const phrases = {
    shocked:  lang === 'ja' ? '衝撃の結果！' : lang === 'ko' ? '충격적인 결과!' : lang === 'vi' ? 'Kết quả gây sốc!' : 'Shocking Result!',
    before:   lang === 'ja' ? '変わる前' : lang === 'ko' ? '변화 전' : lang === 'vi' ? 'Trước' : 'Before',
    after:    lang === 'ja' ? '変わった後' : lang === 'ko' ? '변화 후' : lang === 'vi' ? 'Sau' : 'After',
    vs:       lang === 'ja' ? '比較' : lang === 'ko' ? '비교' : 'VS',
    secret:   lang === 'ja' ? '秘密' : lang === 'ko' ? '비밀' : lang === 'vi' ? 'Bí quyết' : 'Secret',
    warning:  lang === 'ja' ? '注意！' : lang === 'ko' ? '주의!' : lang === 'vi' ? 'Cảnh báo!' : 'Warning!',
    watching: lang === 'ja' ? '見て！' : lang === 'ko' ? '봐요!' : lang === 'vi' ? 'Xem ngay!' : 'Watch this!',
  };

  return {
    'face-reaction': {
      headline: phrases.shocked,
      subtext: k,
      visual: `Người thật nhìn thẳng vào camera với biểu cảm ngạc nhiên/hào hứng. Background màu đỏ/cam sáng. Chữ "${phrases.shocked}" size lớn góc trên trái.`,
      hook: `Tôi đã thử "${vi}" và kết quả khiến tôi sốc thật sự...`,
    },
    'before-after': {
      headline: `${phrases.before} → ${phrases.after}`,
      subtext: k,
      visual: `Ảnh chia đôi trái-phải. Bên trái: trạng thái ban đầu (xấu/thiếu). Bên phải: kết quả (tốt/hoàn chỉnh). Mũi tên lớn ở giữa.`,
      hook: `${n > 0 ? n : 7} ngày trước tôi không biết gì về "${vi}". Hôm nay tôi muốn chia sẻ sự thay đổi đó...`,
    },
    'listicle': {
      headline: `${n || 7} điều về ${lang === 'ja' || lang === 'ko' ? k : vi}`,
      visual: `Số ${n || 7} lớn bên trái. Bên phải là grid 2-3 ảnh nhỏ preview. Background vàng/cam nổi bật. Chữ trắng đậm.`,
      hook: `Hôm nay tôi sẽ chia sẻ ${n || 7} điều quan trọng nhất về "${vi}" mà ít ai biết.`,
    },
    'text-heavy': {
      headline: `${phrases.warning} ${k}`,
      subtext: lang === 'vi' ? 'Đọc trước khi bắt đầu' : lang === 'ja' ? '始める前に読んで' : 'Read this first',
      visual: `Background đen. Chữ màu vàng/đỏ cực to chiếm 70% ảnh. Không cần ảnh nền phức tạp. Đơn giản = hiệu quả.`,
      hook: `Trước khi bạn bắt đầu "${vi}", hãy dừng lại 3 giây và nghe điều này...`,
    },
    'cinematic': {
      headline: k,
      subtext: lang === 'vi' ? 'Khám phá thế giới' : lang === 'ja' ? '世界を探る' : 'The full story',
      visual: `Wide shot điện ảnh, ánh sáng vàng/tối. Chữ title ở giữa dưới theo phong cách phim. Không có face. Cảm giác epic.`,
      hook: `Đây là câu chuyện đầy đủ về "${vi}"...`,
    },
    'tutorial': {
      headline: `Cách ${lang === 'ja' || lang === 'ko' ? k : vi}`,
      subtext: lang === 'vi' ? `${n || 5} bước đơn giản` : lang === 'ja' ? `${n || 5}つのステップ` : `${n || 5} simple steps`,
      visual: `Screenshot/infographic với các bước đánh số. Mũi tên, vòng tròn highlight các điểm quan trọng. Background xanh dương sáng.`,
      hook: `Trong ${n || 5} bước, tôi sẽ hướng dẫn bạn cách "${vi}" từ đầu đến cuối.`,
    },
    'comparison': {
      headline: `${k} ${phrases.vs}?`,
      visual: `Hai sản phẩm/phương pháp đặt cạnh nhau. Nhãn trái-phải rõ ràng. Background trắng sạch hoặc hai nửa màu khác.`,
      hook: `Bạn đang thắc mắc nên chọn cái nào? Hôm nay tôi sẽ so sánh thực tế...`,
    },
    'mystery': {
      headline: `${phrases.secret} của ${lang === 'ja' || lang === 'ko' ? k : vi}`,
      subtext: '???',
      visual: `Ảnh làm mờ/che 80%. Dấu chấm hỏi to ở giữa. Phần lộ ra vừa đủ để gây tò mò. Màu tối bí ẩn.`,
      hook: `Có một điều về "${vi}" mà hầu hết mọi người chưa biết...`,
    },
    'result': {
      headline: lang === 'vi' ? `Kết quả sau ${n || 7} ngày` : lang === 'ja' ? `${n || 7}日後の結果` : `Results after ${n || 7} days`,
      subtext: k,
      visual: `Ảnh kết quả cuối cùng to, rõ. Số liệu/thành tích nổi bật. Màu xanh lá (thành công). Không cần show process.`,
      hook: `Đây là kết quả sau ${n || 7} ngày thử nghiệm "${vi}". Tôi sẽ không che giấu gì cả...`,
    },
  };
}

// ── Tips per style ────────────────────────────────────────────
const STYLE_TIPS: Record<ThumbnailStyle, string[]> = {
  'face-reaction': [
    'Nhìn thẳng vào camera tạo kết nối mạnh hơn 40% so với nhìn nghiêng',
    'Dùng màu nền tương phản mạnh với màu da để nổi bật',
    'Biểu cảm phải "đọc được" ở kích thước 120×90px (mobile)',
  ],
  'before-after': [
    'Đường chia phải rõ ràng — dùng mũi tên hoặc line trắng dày',
    '"After" luôn đặt bên phải (hướng mắt đọc tự nhiên)',
    'Tạo contrast lớn giữa hai bên để thấy sự khác biệt ngay',
  ],
  'listicle': [
    'Số lẻ (5, 7, 9) click-through rate cao hơn số chẵn ~15%',
    'Font chữ số cần bold, kích thước ít nhất 1/3 chiều cao ảnh',
    'Màu nền vàng/cam có CTR cao nhất trên mobile',
  ],
  'text-heavy': [
    'Tối đa 4-5 từ trên thumbnail — ít hơn = tốt hơn',
    'Dùng font sans-serif, bold, viết hoa hoàn toàn',
    'Test màu chữ: vàng trên đen > trắng trên đỏ > đỏ trên trắng',
  ],
  'cinematic': [
    'Rule of thirds: đặt chủ thể ở 1/3 khung hình, không ở giữa',
    'Ánh sáng vàng golden hour tạo cảm giác premium',
    'Hiệu quả nhất với travel, history, documentary content',
  ],
  'tutorial': [
    'Dùng màu xanh/teal — não bộ liên kết với "học hỏi, an toàn"',
    'Arrows và số bước tăng CTR cho audience mới (không biết channel)',
    'Screenshot thực tế > vector illustration cho tutorial tech',
  ],
  'comparison': [
    'Đặt sản phẩm ưu thích bên phải (vị trí mắt nhìn cuối)',
    'Dùng badge "Winner" hoặc checkmark để tăng rõ ràng',
    'Thumbnail so sánh hoạt động tốt với audience có intent mua hàng',
  ],
  'mystery': [
    'Blur vừa đủ — nếu blur 100% sẽ không ai click',
    'Kết hợp với title có từ "bí quyết", "ít ai biết", "sự thật"',
    'Hiệu quả nhất với educational và lifestyle content',
  ],
  'result': [
    'Show số cụ thể (không phải "tốt hơn" mà là "+47%")',
    'Green/teal = thành công trong não bộ viewer',
    'Kết hợp với title bắt đầu bằng số: "30 ngày: kết quả bất ngờ"',
  ],
};

// ── Main generator ────────────────────────────────────────────

export function generateThumbnailIdeas(
  kw: Keyword,
  lang: ContentLanguage = 'ja',
  count: number = 4,
): ThumbnailIdeaSet {
  const templates = getTemplates(kw, lang);

  // Pick styles based on keyword characteristics
  const priorityStyles: ThumbnailStyle[] = selectBestStyles(kw, count);

  const concepts: ThumbnailConcept[] = priorityStyles.map((style, i) => {
    const t = templates[style];
    return {
      id: `thumb-${i}-${style}`,
      style,
      styleLabel: STYLE_LABELS[style],
      headline: t.headline,
      subtext: t.subtext,
      visualDescription: t.visual,
      colorPalette: STYLE_COLORS[style],
      ctaHook: t.hook,
      estimatedCtr: STYLE_CTR[style],
      tips: STYLE_TIPS[style],
      // Mark pairs 0&1 and 2&3 as A/B variants
      abVariantOf: i % 2 === 1 ? `thumb-${i - 1}-${priorityStyles[i - 1]}` : undefined,
    };
  });

  return { keyword: kw, concepts, lang };
}

function selectBestStyles(kw: Keyword, count: number): ThumbnailStyle[] {
  const allStyles: ThumbnailStyle[] = [
    'face-reaction', 'mystery', 'before-after', 'result',
    'listicle', 'tutorial', 'comparison', 'text-heavy', 'cinematic',
  ];

  // Score each style based on keyword attributes
  const scored = allStyles.map(s => {
    let score = 0;
    if (s === 'face-reaction' && kw.searchIntent >= 10) score += 3;
    if (s === 'mystery' && kw.evergreen >= 7) score += 2;
    if (s === 'before-after' && kw.topicDepth >= 10) score += 3;
    if (s === 'listicle' && (kw.chapters?.length ?? 0) >= 5) score += 3;
    if (s === 'tutorial' && kw.level === 'beginner') score += 3;
    if (s === 'comparison' && kw.longTailExp >= 7) score += 2;
    if (s === 'result' && kw.demand >= 12) score += 2;
    if (s === 'text-heavy' && kw.recommendation === 'DO IT') score += 2;
    if (s === 'cinematic' && kw.evergreen >= 8 && kw.seriesPotential >= 7) score += 2;
    // Always add some base score to ensure variety
    score += Math.random() * 0.5;
    return { style: s, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(x => x.style);
}
