// ============================================================
// engine/languages/vi.ts — Vietnamese language pack
// ============================================================
import type { LanguagePack } from './types';

function tokenizeVi(text: string): string[] {
  // Vietnamese uses Latin script with spaces — straightforward split
  return text
    .toLowerCase()
    .replace(/[^a-záàảãạăắặẳẵằâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !VI_STOPWORDS.has(t));
}

const VI_STOPWORDS = new Set([
  'và', 'với', 'cho', 'của', 'là', 'có', 'này', 'đó', 'từ', 'tôi',
  'bạn', 'một', 'các', 'những', 'khi', 'được', 'đã', 'sẽ', 'thì',
  'mà', 'hay', 'hoặc', 'không', 'vào', 'trong', 'nên', 'về',
]);

export const vi: LanguagePack = {
  code: 'vi',
  name: 'Tiếng Việt',
  flag: '🇻🇳',
  regionCode: 'VN',
  languageCode: 'vi',

  defaultSeeds: [
    { text: 'ChatGPT hướng dẫn',        vi: 'Hướng dẫn ChatGPT',        niche: 'AI / ChatGPT' },
    { text: 'ChatGPT tăng năng suất',   vi: 'ChatGPT tăng năng suất',   niche: 'AI / ChatGPT' },
    { text: 'công cụ AI miễn phí',      vi: 'Công cụ AI miễn phí',      niche: 'AI / ChatGPT' },
    { text: 'Excel hướng dẫn',          vi: 'Hướng dẫn Excel',          niche: 'Excel / Office' },
    { text: 'Excel tự động hóa',        vi: 'Tự động hóa Excel',        niche: 'Excel / Office' },
    { text: 'tăng năng suất làm việc',  vi: 'Tăng năng suất làm việc',  niche: 'Công việc' },
    { text: 'làm thêm thu nhập',        vi: 'Làm thêm thu nhập',        niche: 'Công việc' },
    { text: 'cách tiết kiệm tiền',      vi: 'Cách tiết kiệm tiền',      niche: 'Tiết kiệm' },
    { text: 'phương pháp học tập',      vi: 'Phương pháp học tập',      niche: 'Học tập' },
    { text: 'học tiếng Anh',            vi: 'Học tiếng Anh',            niche: 'Học tập' },
    { text: 'lập trình Python',         vi: 'Lập trình Python',         niche: 'Lập trình' },
    { text: 'lập trình web',            vi: 'Lập trình web',            niche: 'Lập trình' },
    { text: 'đầu tư tài chính',         vi: 'Đầu tư tài chính',         niche: 'Kinh doanh' },
    { text: 'thói quen sức khỏe',       vi: 'Thói quen sức khỏe',       niche: 'Sức khỏe' },
    { text: 'tâm lý học đời sống',      vi: 'Tâm lý học đời sống',      niche: 'Tâm lý học' },
    { text: 'kiến thức thú vị',         vi: 'Kiến thức thú vị',         niche: 'Kiến thức / Fact' },
    { text: 'phỏng vấn xin việc',       vi: 'Phỏng vấn xin việc',       niche: 'Phỏng vấn' },
    { text: 'marketing online',         vi: 'Marketing online',          niche: 'Kinh doanh' },
  ],

  longFormSuffixes: [
    'hướng dẫn chi tiết', 'từ A-Z', 'cách làm', 'so sánh',
    'review', 'mẹo hay', 'thực chiến', 'kinh nghiệm',
    'tổng hợp', 'cho người mới', 'hoàn chỉnh',
  ],

  problemMarkers: [
    'lưu ý', 'sai lầm', 'cảnh báo', 'tránh', 'rủi ro',
    'thất bại', 'vấn đề', 'khó khăn',
  ],

  audienceMarkers: [
    'cho người mới', 'cho người đi làm', 'cho sinh viên',
    'cho dân văn phòng', 'cho freelancer', 'cho người kinh doanh',
  ],

  benefitMarkers: [
    'năng suất', 'hiệu quả', 'tiết kiệm thời gian', 'kiếm tiền',
    'thành công', 'miễn phí', 'đơn giản', 'tăng thu nhập',
  ],

  longTailConnectors: ['cách làm', 'hướng dẫn', 'hướng dẫn chi tiết', 'lưu ý'],

  nicheProblems: {
    'AI / ChatGPT':    ['viết lách', 'code', 'email', 'thuyết trình', 'dịch thuật', 'tạo ảnh', 'tự động hóa'],
    'Excel / Office':  ['hàm', 'macro', 'VBA', 'pivot', 'biểu đồ', 'phân tích dữ liệu', 'tự động hóa'],
    'Lập trình':       ['Python', 'JavaScript', 'Git', 'API', 'cơ sở dữ liệu', 'web', 'AI'],
    'Công việc':       ['tăng ca', 'sếp', 'chuyển việc', 'phỏng vấn', 'CV', 'email công việc', 'báo cáo'],
    'Phỏng vấn':       ['giới thiệu bản thân', 'lý do ứng tuyển', 'lý do nghỉ việc', 'câu hỏi ngược', 'trang phục'],
    'Tiết kiệm':       ['chi tiêu ăn uống', 'tiền điện', 'cước điện thoại', 'bảo hiểm', 'subscription'],
    'Học tập':         ['tiếng Anh', 'toán', 'ghi nhớ', 'tập trung', 'ghi chú', 'thi cử', 'chứng chỉ'],
    'Tâm lý học':      ['nhận thức sai lệch', 'thói quen', 'động lực', 'quan hệ', 'tự tin', 'stress'],
    'Kiến thức / Fact':['khoa học', 'lịch sử', 'kinh tế', 'tâm lý', 'vũ trụ', 'sinh học'],
    'Kinh doanh':      ['marketing', 'mạng xã hội', 'thương hiệu', 'thu hút khách hàng', 'doanh thu', 'khởi nghiệp'],
    'Sức khỏe':        ['giấc ngủ', 'chế độ ăn', 'tập thể dục', 'stress', 'tâm lý', 'giảm cân'],
  },

  nicheBenefits: {
    'AI / ChatGPT':    ['tiết kiệm thời gian', 'tự động hóa', 'làm nhanh hơn', 'miễn phí', 'đơn giản', 'chuyên nghiệp'],
    'Excel / Office':  ['tiết kiệm thời gian', 'tự động hóa', 'hiệu quả', 'miễn phí', 'đơn giản', 'nâng kỹ năng'],
    'Lập trình':       ['freelance', 'làm từ xa', 'cơ hội việc làm', 'nâng kỹ năng', 'tự động hóa'],
    'Công việc':       ['thăng chức', 'hiệu quả', 'tiết kiệm thời gian', 'đánh giá cao', 'giảm stress'],
    'Phỏng vấn':       ['có việc làm', 'đậu phỏng vấn', 'ấn tượng tốt', 'lương cao hơn', 'đổi việc thành công'],
    'Tiết kiệm':       ['tiết kiệm 2 triệu/tháng', 'nửa giá', 'miễn phí', 'bắt đầu ngay', 'cắt giảm chi tiêu'],
    'Học tập':         ['điểm cao hơn', 'thi đậu', 'học nhanh', 'hiệu quả', 'thú vị hơn'],
    'Tâm lý học':      ['được yêu mến', 'tự tin hơn', 'cải thiện', 'vượt qua'],
    'Kiến thức / Fact':['thú vị', 'bất ngờ', 'không ngờ', 'choáng váng', 'hiểu ra'],
    'Kinh doanh':      ['tăng doanh thu', 'thu hút khách', 'tự động hóa', 'xây dựng thương hiệu'],
    'Sức khỏe':        ['khỏe mạnh', 'cải thiện', 'hiệu quả', 'dễ dàng', 'duy trì được'],
  },

  riskyMarkers: [
    'anime', 'phim', 'cắt ghép', 'review phim', 'recap',
    'bản quyền', 'vi phạm', 'tổng hợp clip', 'tóm tắt phim',
  ],

  evergreenMarkers: [
    'cách', 'hướng dẫn', 'phương pháp', 'cơ bản', 'nhập môn',
    'giải thích', 'toàn tập', 'bí quyết', 'nguyên lý',
  ],

  searchIntentBoost: [
    'cách', 'hướng dẫn', 'người mới', 'giải thích', 'toàn tập', 'so sánh',
    'review', 'tốt nhất', 'lưu ý', 'sai lầm', 'tránh',
    'phương pháp', 'từng bước', 'mẹo', 'chiến lược',
    'nhập môn', 'tổng hợp', 'bí quyết', 'quy trình',
  ],

  topicDepthSignals: [
    'toàn tập', 'chi tiết', 'nhập môn', 'cơ bản', 'nâng cao',
    'nguyên lý', 'vì sao', 'từng bước', 'quy trình',
    'từ đầu', 'từ A-Z', 'nền tảng',
  ],

  titleTemplates: [
    '{kw} Hướng Dẫn Đầy Đủ - Dành Cho Người Mới',
    'Cách {kw} Đúng Cách - Giải Thích Chi Tiết',
    'Lỗi {kw} Phổ Biến (Và Cách Sửa)',
    '{kw} Thay Đổi Cuộc Sống Của Bạn',
    '{kw} - Tất Cả Những Gì Bạn Cần Biết',
    '{kw} Từ A-Z | Bắt Đầu Từ Con Số 0',
    'Bí Quyết {kw} Từ Chuyên Gia',
    'Điều Không Ai Nói Với Bạn Về {kw}',
  ],

  chapterTemplates: {
    tutorial: [
      'Giới thiệu / Tại sao chủ đề này quan trọng',
      'Khái niệm cơ bản và thuật ngữ',
      'Chuẩn bị và công cụ cần thiết',
      'Các bước thực hiện',
      'Lỗi thường gặp và lưu ý',
      'Ứng dụng và ví dụ thực tế',
      'Tóm tắt và bước tiếp theo',
    ],
    comparison: [
      'Giới thiệu / Mục đích so sánh',
      'Tổng quan các lựa chọn',
      'So sánh tính năng và hiệu suất',
      'So sánh giá và giá trị',
      'So sánh dễ sử dụng',
      'Phù hợp với ai / Không phù hợp với ai',
      'Kết luận và đề xuất',
    ],
    ranking: [
      'Giới thiệu / Tiêu chí chọn lọc',
      'Hạng 5', 'Hạng 4', 'Hạng 3', 'Hạng 2', 'Hạng 1',
      'Tóm tắt và cách chọn phù hợp',
    ],
    default: [
      'Giới thiệu',
      'Kiến thức nền tảng',
      'Phương pháp và các bước cụ thể',
      'Ví dụ thực tế và case study',
      'Lưu ý và lỗi thường gặp',
      'Ứng dụng nâng cao',
      'Tóm tắt',
    ],
  },

  translationMap: {
    'người mới': 'beginner', 'hướng dẫn': 'guide', 'cách': 'how to',
    'so sánh': 'comparison', 'đánh giá': 'review', 'tiết kiệm thời gian': 'time saving',
    'tự động hóa': 'automate', 'hiệu quả': 'efficient', 'miễn phí': 'free',
  },

  tokenize: tokenizeVi,
};
