// ============================================================
// engine/languages/ko.ts — Korean language pack
// ============================================================
import type { LanguagePack } from './types';

function tokenizeKo(text: string): string[] {
  // Split on spaces + Korean punctuation
  return text
    .replace(/[【】「」『』（）｜\-\/\|,，。！？…·]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
}

export const ko: LanguagePack = {
  code: 'ko',
  name: 'Tiếng Hàn',
  flag: '🇰🇷',
  regionCode: 'KR',
  languageCode: 'ko',

  defaultSeeds: [
    { text: 'AI 도구',          vi: 'Công cụ AI',              niche: 'AI / ChatGPT' },
    { text: 'ChatGPT 사용법',   vi: 'Cách dùng ChatGPT',       niche: 'AI / ChatGPT' },
    { text: 'ChatGPT 업무활용', vi: 'ChatGPT tăng hiệu suất',  niche: 'AI / ChatGPT' },
    { text: '엑셀 사용법',      vi: 'Cách dùng Excel',         niche: 'Excel / Office' },
    { text: '엑셀 자동화',      vi: 'Tự động hóa Excel',       niche: 'Excel / Office' },
    { text: '업무효율화',       vi: 'Tăng hiệu quả công việc', niche: 'Công việc' },
    { text: '부업 시작하기',    vi: 'Bắt đầu nghề tay trái',   niche: 'Công việc' },
    { text: '이직 방법',        vi: 'Cách chuyển việc',        niche: 'Công việc' },
    { text: '면접 완벽가이드',  vi: 'Hướng dẫn phỏng vấn',    niche: 'Phỏng vấn' },
    { text: '절약 방법',        vi: 'Mẹo tiết kiệm',           niche: 'Tiết kiệm' },
    { text: '자취 절약',        vi: 'Sống một mình tiết kiệm', niche: 'Tiết kiệm' },
    { text: '공부 방법',        vi: 'Phương pháp học',         niche: 'Học tập' },
    { text: '영어 공부법',      vi: 'Cách học tiếng Anh',      niche: 'Học tập' },
    { text: '심리학 해설',      vi: 'Giải thích tâm lý học',   niche: 'Tâm lý học' },
    { text: '파이썬 입문',      vi: 'Nhập môn Python',        niche: 'Lập trình' },
    { text: '재테크 시작',      vi: 'Bắt đầu đầu tư',          niche: 'Kinh doanh' },
    { text: '건강 루틴',        vi: 'Thói quen sức khoẻ',      niche: 'Sức khỏe' },
    { text: '다이어트 방법',    vi: 'Cách giảm cân',           niche: 'Sức khỏe' },
  ],

  longFormSuffixes: [
    '완벽 가이드', '총정리', '방법', '비교', '리뷰',
    '분석', '꿀팁', '루틴', '강의', '실전',
    '사용법', '시작하는 법', '입문', '정리',
  ],

  problemMarkers: [
    '주의사항', '실패', '문제점', '단점', '함정', '실수', '경고',
  ],

  audienceMarkers: [
    '초보자', '입문', '직장인', '학생', '전문가', '주부', '20대', '30대',
  ],

  benefitMarkers: [
    '생산성', '효율', '시간절약', '돈벌기', '성공',
    '무료', '쉬운', '스킬업', '수익창출',
  ],

  longTailConnectors: ['방법', '하는 법', '완벽 가이드', '주의사항'],

  nicheProblems: {
    'AI / ChatGPT':    ['회의록', '자료작성', '이메일', '발표', '번역', '코드', '이미지생성'],
    'Excel / Office':  ['함수', '매크로', '피벗', '차트', '데이터분석', '자동화'],
    'Lập trình':       ['파이썬', '자바스크립트', 'Git', 'API', '데이터베이스', '웹개발'],
    'Công việc':       ['야근', '상사', '이직', '면접', '이력서', '이메일', '보고서'],
    'Phỏng vấn':       ['자기소개', '지원동기', '퇴사이유', '역질문', '복장', '매너'],
    'Tiết kiệm':       ['식비', '전기세', '통신비', '보험', '구독', '편의점'],
    'Học tập':         ['영어', '수학', '암기', '집중력', '노트', '시험', '자격증'],
    'Tâm lý học':      ['인지편향', '습관', '동기부여', '인간관계', '자존감', '스트레스'],
    'Kinh doanh':      ['마케팅', 'SNS', '브랜딩', '고객유치', '매출', '창업'],
    'Sức khỏe':        ['수면', '식단', '운동', '스트레스', '멘탈', '다이어트'],
  },

  nicheBenefits: {
    'AI / ChatGPT':    ['시간절약', '자동화', '업무효율', '무료', '쉬운', '프로급'],
    'Excel / Office':  ['시간절약', '자동화', '효율화', '무료', '쉬운', '스킬업'],
    'Lập trình':       ['부업', '프리랜서', '취업', '스킬업', '자동화'],
    'Công việc':       ['승진', '효율화', '시간절약', '평가상승', '스트레스감소'],
    'Tiết kiệm':       ['월10만원', '반값', '무료', '당장가능', '생활비절감'],
    'Học tập':         ['성적향상', '합격', '단기간', '효율적', '재미있게'],
    'Sức khỏe':        ['건강', '개선', '효과적', '쉬운', '지속가능'],
    'Kinh doanh':      ['매출상승', '고객유치', '자동화', '브랜드력'],
  },

  riskyMarkers: [
    '애니메이션', '드라마', '편집본', '리액션', '짤', '합성',
    '저작권', '무단', '모음', '몰아보기',
  ],

  evergreenMarkers: [
    '방법', '사용법', '하는 법', '기초', '입문',
    '해설', '가이드', '기본', '팁', '원리',
  ],

  searchIntentBoost: [
    '방법', '사용법', '초보자', '해설', '완벽 가이드', '비교',
    '리뷰', '랭킹', '추천', '주의', '실패', 'NG',
    '원리', '시작하는 법', '선택법', '활용법',
    '입문', '정리', '꿀팁', '순서', '포인트',
  ],

  topicDepthSignals: [
    '완벽 가이드', '철저 해설', '입문', '기초', '응용',
    '원리', '왜', '단계', '순서', '흐름',
    '제로부터', '기본부터',
  ],

  titleTemplates: [
    '{kw} 완벽 가이드 - 초보도 이해하는',
    '{kw} 올바른 방법 철저 해설',
    '직장인이 모르면 손해인 {kw}',
    '{kw}로 달라지는! 실전 활용법',
    '【{kw}】 실패하지 않는 방법과 팁',
    '{kw} 입문 | 제로부터 시작하는 방법',
    '전문가가 알려주는 {kw} 사용법',
    '모르면 손해인 {kw}의 모든 것',
  ],

  chapterTemplates: {
    tutorial: [
      '소개 / 왜 이 주제가 중요한가',
      '기본 개념 및 용어 설명',
      '필요한 준비 및 도구',
      '단계별 절차',
      '자주 하는 실수 및 주의사항',
      '응용 및 활용 예',
      '정리 및 다음 단계',
    ],
    comparison: [
      '소개 / 비교 목적',
      '비교 대상 개요',
      '기능 및 성능 비교',
      '가격 및 가성비 비교',
      '사용 편의성 비교',
      '어울리는 사람 / 어울리지 않는 사람',
      '결론 및 추천',
    ],
    ranking: [
      '소개 / 선정 기준',
      '5위', '4위', '3위', '2위', '1위',
      '정리 및 추천 선택법',
    ],
    default: [
      '소개',
      '기초 지식',
      '구체적인 방법 및 절차',
      '실례 및 케이스 스터디',
      '주의사항 및 자주 하는 실수',
      '응용 및 발전',
      '정리',
    ],
  },

  translationMap: {
    '초보자': 'người mới', '입문': 'nhập môn', '직장인': 'người đi làm',
    '학생': 'học sinh', '전문가': 'chuyên gia', '방법': 'cách',
    '사용법': 'cách dùng', '완벽 가이드': 'hướng dẫn đầy đủ',
    '비교': 'so sánh', '추천': 'đề xuất', '시간절약': 'tiết kiệm thời gian',
    '자동화': 'tự động hóa', '효율화': 'tăng hiệu quả',
    '무료': 'miễn phí', '쉬운': 'đơn giản',
  },

  tokenize: tokenizeKo,
};
