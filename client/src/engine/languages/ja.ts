// ============================================================
// engine/languages/ja.ts — Japanese language pack
// Refactored from engine/constants.ts
// ============================================================
import type { LanguagePack } from './types';

/** Simple whitespace/punct tokenizer for Japanese.
 *  Splits on spaces and common CJK punctuation.
 *  Works well enough for our tag-extraction use-case.
 */
function tokenizeJa(text: string): string[] {
  // Split on spaces + common separators, filter short tokens
  return text
    .replace(/[【】「」『』（）｜\-\/\|,、。！？…]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
}

export const ja: LanguagePack = {
  code: 'ja',
  name: 'Tiếng Nhật',
  flag: '🇯🇵',
  regionCode: 'JP',
  languageCode: 'ja',

  defaultSeeds: [
    // 🎣 Fishing
    { text: '釣り 初心者',         vi: 'Câu cá cho người mới',      niche: 'Câu cá' },
    { text: '渓流釣り やり方',     vi: 'Cách câu cá suối',          niche: 'Câu cá' },
    { text: 'ルアー 選び方',       vi: 'Cách chọn mồi giả',         niche: 'Câu cá' },
    // 🍳 Cooking
    { text: '簡単 料理 レシピ',    vi: 'Công thức nấu ăn đơn giản', niche: 'Nấu ăn' },
    { text: '一人暮らし 自炊',     vi: 'Nấu ăn một mình',           niche: 'Nấu ăn' },
    { text: '節約 レシピ',         vi: 'Công thức tiết kiệm',        niche: 'Nấu ăn' },
    // 🏕️ Outdoor / Camping
    { text: 'キャンプ 初心者',     vi: 'Cắm trại cho người mới',    niche: 'Outdoor' },
    { text: 'ソロキャンプ 道具',   vi: 'Đồ cắm trại một mình',      niche: 'Outdoor' },
    { text: '登山 準備',           vi: 'Chuẩn bị leo núi',          niche: 'Outdoor' },
    // 🛠️ DIY / Home
    { text: 'DIY 初心者',          vi: 'DIY cho người mới',         niche: 'DIY' },
    { text: '部屋 収納 アイデア',  vi: 'Ý tưởng sắp xếp phòng',    niche: 'DIY' },
    { text: '100均 DIY',           vi: 'DIY từ đồ 100 yên',         niche: '100均' },
    // ✈️ Travel
    { text: '国内旅行 おすすめ',   vi: 'Du lịch trong nước Nhật',   niche: 'Du lịch' },
    { text: '格安旅行 やり方',     vi: 'Du lịch tiết kiệm',         niche: 'Du lịch' },
    { text: '一人旅 初心者',       vi: 'Du lịch một mình',          niche: 'Du lịch' },
    // 🐕 Pets
    { text: '犬 しつけ 方法',      vi: 'Cách dạy chó',              niche: 'Thú cưng' },
    { text: '猫 飼い方 初心者',    vi: 'Nuôi mèo cho người mới',   niche: 'Thú cưng' },
    // 🌱 Gardening
    { text: 'ベランダ 家庭菜園',   vi: 'Trồng rau trên ban công',   niche: 'Làm vườn' },
    { text: '観葉植物 育て方',     vi: 'Cách trồng cây cảnh',       niche: 'Làm vườn' },
    // 💪 Health / Fitness
    { text: '自宅トレーニング',    vi: 'Tập thể dục tại nhà',       niche: 'Sức khỏe' },
    { text: 'ダイエット 方法',     vi: 'Phương pháp giảm cân',      niche: 'Sức khỏe' },
  ],

  longFormSuffixes: [
    '使い方', 'やり方', '完全ガイド', '初心者向け', '徹底解説',
    '比較', 'ランキング', 'おすすめ', '注意点', '失敗しない',
    '活用法', '始め方', '選び方', '仕組み', 'コツ',
  ],

  problemMarkers: [
    '注意点', '失敗', '問題', 'デメリット', '落とし穴', 'NG', 'ミス',
  ],

  audienceMarkers: [
    '社会人', '初心者', '学生', '主婦', '20代', '30代',
    '一人暮らし', '大学生', 'フリーランス', '副業初心者',
  ],

  benefitMarkers: [
    '時短', '自動化', '仕事効率化', '無料', '簡単', 'プロ級',
    '生産性', 'スキルアップ', '副業収入', '節約',
  ],

  longTailConnectors: ['やり方', '方法', '完全ガイド', '注意点'],

  nicheProblems: {
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
  },

  nicheBenefits: {
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
  },

  riskyMarkers: [
    'アニメ', 'ドラマ', '映画', 'アイドル', 'スポーツ',
    'テレビ', 'TV', '芸能人', 'ジャニーズ', '漫画全話',
    '切り抜き', '名場面', '推し活', '著作権', '転載',
    'まとめ動画', '〇〇の話', 'コピペ',
  ],

  evergreenMarkers: [
    '方法', '使い方', 'やり方', '基礎', '入門',
    '解説', 'ガイド', '基本', 'コツ', '仕組み',
  ],

  searchIntentBoost: [
    'やり方', '使い方', '初心者', '解説', '完全ガイド', '比較',
    'レビュー', 'ランキング', 'おすすめ', '注意', '失敗', 'NG',
    '方法', '仕組み', 'なぜ', '始め方', '選び方', '活用法',
    '入門', 'まとめ', '徹底解説', 'コツ', '手順', 'ポイント',
  ],

  topicDepthSignals: [
    '完全ガイド', '徹底解説', '入門', '基礎', '応用',
    '仕組み', 'なぜ', 'ステップ', '手順', '流れ',
    '初心者から上級者', 'ゼロから', '基本から', '一から',
  ],

  titleTemplates: [
    '{kw}【完全ガイド】初心者でもわかる',
    '{kw}の正しいやり方を徹底解説',
    '社会人が知らないと損する{kw}',
    '{kw}で変わる！実践的な活用法',
    '【{kw}】失敗しない方法とコツ',
    '{kw}入門｜ゼロから始める方法',
    'プロが教える{kw}の使い方',
    '知らないと損する{kw}の全て',
  ],

  chapterTemplates: {
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
      '第5位', '第4位', '第3位', '第2位', '第1位',
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
  },

  translationMap: {
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
    'AIツール': 'công cụ AI', '節約術': 'mẹo tiết kiệm',
    '勉強法': 'phương pháp học', '副業': 'nghề tay trái',
    '転職': 'chuyển việc', '面接': 'phỏng vấn',
  },

  tokenize: tokenizeJa,
};
