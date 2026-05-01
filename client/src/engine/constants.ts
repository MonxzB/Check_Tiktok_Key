// ============================================================
// engine/constants.ts — YouTube Long-Form Key Finder constants
// ============================================================
import type { Niche, SeedObject } from '../types';

export const APP_TITLE = 'YouTube Long-Form Key Finder';
export const APP_NOTICE = 'Tool này chỉ dùng để nghiên cứu keyword, video tham khảo và kênh tham khảo cho nội dung gốc long-form. Điểm số chỉ đúng theo dữ liệu được lấy tại thời điểm phân tích.';

// ── Default Seeds (long-form friendly) ────────────────────────
export const DEFAULT_SEEDS: SeedObject[] = [
  { jp: 'AIツール',          vi: 'Công cụ AI',              niche: 'AI / ChatGPT' },
  { jp: 'ChatGPT 使い方',    vi: 'Cách dùng ChatGPT',       niche: 'AI / ChatGPT' },
  { jp: 'ChatGPT 仕事効率化', vi: 'ChatGPT tăng hiệu suất',  niche: 'AI / ChatGPT' },
  { jp: 'Excel 使い方',      vi: 'Cách dùng Excel',         niche: 'Excel / Office' },
  { jp: 'Excel 自動化',      vi: 'Tự động hóa Excel',       niche: 'Excel / Office' },
  { jp: '仕事効率化',        vi: 'Tăng hiệu quả công việc', niche: 'Công việc' },
  { jp: '副業 初心者',       vi: 'Nghề tay trái người mới', niche: 'Công việc' },
  { jp: '転職 やり方',       vi: 'Cách chuyển việc',        niche: 'Công việc' },
  { jp: '面接 完全ガイド',   vi: 'Hướng dẫn phỏng vấn',    niche: 'Phỏng vấn' },
  { jp: '節約術',            vi: 'Mẹo tiết kiệm',           niche: 'Tiết kiệm' },
  { jp: '一人暮らし 節約',   vi: 'Sống một mình tiết kiệm', niche: 'Tiết kiệm' },
  { jp: '家計管理 やり方',   vi: 'Cách quản lý chi tiêu',   niche: 'Tiết kiệm' },
  { jp: '勉強法',            vi: 'Phương pháp học',         niche: 'Học tập' },
  { jp: '英語 学習法',       vi: 'Cách học tiếng Anh',      niche: 'Học tập' },
  { jp: 'TOEIC 勉強法',      vi: 'Cách học TOEIC',         niche: 'Học tập' },
  { jp: '心理学 解説',       vi: 'Giải thích tâm lý học',   niche: 'Tâm lý học' },
  { jp: '雑学',              vi: 'Kiến thức tổng hợp',      niche: 'Kiến thức / Fact' },
  { jp: '日本 マナー',       vi: 'Phép lịch sự Nhật Bản',   niche: 'Văn hóa Nhật' },
  { jp: '100均 活用法',      vi: 'Cách dùng đồ 100 yên',   niche: '100均' },
  { jp: 'Python 入門',       vi: 'Nhập môn Python',        niche: 'Lập trình' },
];

// ── Long-Form Niches ──────────────────────────────────────────
export const NICHES: Niche[] = [
  'AI / ChatGPT',
  'Excel / Office',
  'Lập trình',
  'Công việc',
  'Phỏng vấn',
  'Tiết kiệm',
  'Học tập',
  'Tâm lý học',
  'Kiến thức / Fact',
  'Văn hóa Nhật',
  '100均',
  'Sức khỏe',
  'Kinh doanh',
];

// ── Search Intent Boost Words ─────────────────────────────────
export const SEARCH_INTENT_BOOST: string[] = [
  'やり方', '使い方', '初心者', '解説', '完全ガイド', '比較',
  'レビュー', 'ランキング', 'おすすめ', '注意', '失敗', 'NG',
  '方法', '仕組み', 'なぜ', '始め方', '選び方', '活用法',
  '入門', 'まとめ', '徹底解説', 'コツ', '手順', 'ポイント',
];

// ── Topic Depth Signals ───────────────────────────────────────
export const TOPIC_DEPTH_SIGNALS: string[] = [
  '完全ガイド', '徹底解説', '入門', '基礎', '応用',
  '仕組み', 'なぜ', 'ステップ', '手順', '流れ',
  '初心者から上級者', 'ゼロから', '基本から', '一から',
];

// ── Risky Markers ─────────────────────────────────────────────
export const RISKY_MARKERS: string[] = [
  'アニメ', 'ドラマ', '映画', 'アイドル', 'スポーツ',
  'テレビ', 'TV', '芸能人', 'ジャニーズ', '漫画全話',
  '切り抜き', '名場面', '推し活', '著作権', '転載',
  'まとめ動画', '〇〇の話', 'コピペ',
];

// ── Evergreen Signals ────────────────────────────────────────
export const EVERGREEN_SIGNALS: string[] = [
  '方法', '使い方', 'やり方', '基礎', '入門',
  '解説', 'ガイド', '基本', 'コツ', '仕組み',
];

// ── Niche Heat ────────────────────────────────────────────────
export const NICHE_HEAT: Record<Niche, number> = {
  'AI / ChatGPT':    20,
  'Excel / Office':  17,
  'Lập trình':       15,
  'Công việc':       16,
  'Phỏng vấn':       15,
  'Tiết kiệm':       16,
  'Học tập':         15,
  'Tâm lý học':      14,
  'Kiến thức / Fact':13,
  'Văn hóa Nhật':    13,
  '100均':           13,
  'Sức khỏe':        14,
  'Kinh doanh':      15,
};

// ── Expansion Data ────────────────────────────────────────────
export const LONG_FORM_SUFFIXES: string[] = [
  '使い方', 'やり方', '完全ガイド', '初心者向け', '徹底解説',
  '比較', 'ランキング', 'おすすめ', '注意点', '失敗しない',
  '活用法', '始め方', '選び方', '仕組み', 'コツ',
];

export const AUDIENCES: string[] = [
  '社会人', '初心者', '学生', '主婦', '20代', '30代',
  '一人暮らし', '大学生', 'フリーランス', '副業初心者',
];

export const NICHE_PROBLEMS: Record<Niche, string[]> = {
  'AI / ChatGPT':    ['議事録', '資料作成', 'メール作成', 'プレゼン', '翻訳', 'コード', 'Excel', '画像生成'],
  'Excel / Office':  ['関数', 'マクロ', 'VBA', 'ピボット', 'グラフ', 'データ分析', '自動化', '集計'],
  'Lập trình':       ['Python', 'JavaScript', 'Git', 'API', 'データベース', 'Web開発', 'AI'],
  'Công việc':       ['残業', '上司', '転職', '面接', '履歴書', 'メール', '報告書', 'プレゼン'],
  'Phỏng vấn':       ['自己紹介', '志望動機', '退職理由', '逆質問', '服装', 'マナー', 'NG回答'],
  'Tiết kiệm':       ['食費', '電気代', '通信費', '保険', 'サブスク', 'コンビニ', '自炊'],
  'Học tập':         ['英語', '数学', '暗記', '集中力', 'ノート', '試験', 'TOEIC', '資格'],
  'Tâm lý học':      ['認知バイアス', '習慣', 'モチベーション', '人間関係', '自己肯定感', 'ストレス'],
  'Kiến thức / Fact':['人体', '宇宙', '歴史', '経済', '心理', '科学', '日本'],
  'Văn hóa Nhật':    ['マナー', '敬語', '文化', '習慣', '食事', '祭り', 'ビジネス'],
  '100均':           ['キッチン', '収納', '掃除', '文房具', '美容', '旅行', 'ガジェット'],
  'Sức khỏe':        ['睡眠', '食事', '運動', 'ストレス', 'メンタル', 'ダイエット'],
  'Kinh doanh':      ['マーケティング', 'SNS', 'ブランディング', '集客', '売上', '起業'],
};

export const NICHE_BENEFITS: Record<Niche, string[]> = {
  'AI / ChatGPT':    ['時短', '自動化', '仕事効率化', '無料', '簡単', 'プロ級'],
  'Excel / Office':  ['時短', '自動化', '効率化', '無料', '簡単', 'スキルアップ'],
  'Lập trình':       ['副業', 'フリーランス', '就職', 'スキルアップ', '自動化'],
  'Công việc':       ['昇進', '効率化', '時短', '評価アップ', 'ストレス減'],
  'Phỏng vấn':       ['内定', '合格', '好印象', '年収アップ', '転職成功'],
  'Tiết kiệm':       ['月1万円', '半額', '無料', 'すぐできる', '生活費削減'],
  'Học tập':         ['成績アップ', '合格', '短期間', '効率的', '楽しく'],
  'Tâm lý học':      ['モテる', '好かれる', '自信', '改善', '克服'],
  'Kiến thức / Fact':['驚き', '面白い', '知らなかった', '衝撃', '納得'],
  'Văn hóa Nhật':    ['安心', '快適', 'トラブル回避', '好印象'],
  '100均':           ['便利', 'おしゃれ', 'コスパ最強', '節約'],
  'Sức khỏe':        ['健康', '改善', '効果的', '簡単', '継続できる'],
  'Kinh doanh':      ['売上アップ', '集客', '自動化', 'ブランド力'],
};

// ── Vietnamese meanings ───────────────────────────────────────
export const JP_VI_MAP: Record<string, string> = {
  '社会人': 'người đi làm', '初心者': 'người mới', '学生': 'học sinh',
  '主婦': 'nội trợ', '20代': 'tuổi 20', '30代': 'tuổi 30',
  '一人暮らし': 'sống một mình', '大学生': 'sinh viên',
  'フリーランス': 'freelancer', '副業初心者': 'người mới làm thêm',
  '使い方': 'cách dùng', 'やり方': 'cách làm', '完全ガイド': 'hướng dẫn đầy đủ',
  '初心者向け': 'dành cho người mới', '徹底解説': 'giải thích chi tiết',
  '比較': 'so sánh', 'ランキング': 'xếp hạng', 'おすすめ': 'đề xuất',
  '注意点': 'điểm cần chú ý', '失敗しない': 'không thất bại',
  '活用法': 'cách tận dụng', '始め方': 'cách bắt đầu',
  '選び方': 'cách chọn', '仕組み': 'cơ chế', 'コツ': 'bí quyết',
  '時短': 'tiết kiệm thời gian', '自動化': 'tự động hóa',
  '効率化': 'tăng hiệu quả', '無料': 'miễn phí', '簡単': 'đơn giản',
  'AIツール': 'công cụ AI', 'ChatGPT': 'ChatGPT',
  '節約術': 'mẹo tiết kiệm', '勉強法': 'phương pháp học',
  '副業': 'nghề tay trái', '転職': 'chuyển việc', '面接': 'phỏng vấn',
  '議事録': 'biên bản họp', '資料作成': 'tạo tài liệu',
  'Excel': 'Excel', 'Python': 'Python',
};

// ── Chapter Templates ─────────────────────────────────────────
export type ChapterType = 'tutorial' | 'comparison' | 'ranking' | 'default';

export const CHAPTER_TEMPLATES: Record<ChapterType, string[]> = {
  tutorial: [
    'はじめに / なぜこのトピックが重要か',
    '基本的な概念・用語解説',
    '必要な準備・ツール',
    'ステップごとの手順',
    'よくある失敗・注意点',
    '応用・活用例',
    'まとめ・次のステップ',
  ],
  comparison: [
    'はじめに / 比較の目的',
    '比較する選択肢の概要',
    '機能・性能比較',
    '価格・コスパ比較',
    '使いやすさ比較',
    '向いている人・向いていない人',
    '結論・おすすめ',
  ],
  ranking: [
    'はじめに / 選定基準',
    '第5位',
    '第4位',
    '第3位',
    '第2位',
    '第1位',
    'まとめ・おすすめの選び方',
  ],
  default: [
    'はじめに',
    '基礎知識',
    '具体的な方法・手順',
    '実例・ケーススタディ',
    '注意点・よくある失敗',
    '応用・発展',
    'まとめ',
  ],
};

// ── Title Templates ───────────────────────────────────────────
export const TITLE_TEMPLATES: string[] = [
  '{kw}【完全ガイド】初心者でもわかる',
  '{kw}の正しいやり方を徹底解説',
  '社会人が知らないと損する{kw}',
  '{kw}で変わる！実践的な活用法',
  '【{kw}】失敗しない方法とコツ',
  '{kw}入門｜ゼロから始める方法',
  'プロが教える{kw}の使い方',
  '知らないと損する{kw}の全て',
];
