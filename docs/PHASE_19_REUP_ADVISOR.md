# Phase 19: Reup Strategy Advisor

## Tổng quan

Tab **✂️ Reup Strategy** giúp creator phân tích video YouTube và nhận đề xuất chiến lược cắt/edit phù hợp để đăng lại trên TikTok/YouTube Shorts.

### Kiến trúc hai lớp

```
Layer 1: Rule Engine (client-side, instant, miễn phí)
  ├── Quyết định dựa trên: duration bucket, category, view count, channel size
  ├── Trả về 3-5 strategies trong < 10ms
  └── Confidence < 60% → tự động gợi ý Deep Analyze

Layer 2: Gemini AI (server-side, ~$0.00008/call)
  ├── Chỉ gọi khi user bấm "🤖 Deep Analyze"
  ├── Payload tối giản: 7 fields (~150 tokens input)
  ├── JSON mode + temperature=0 → output deterministic ~400 tokens
  └── Kết quả override layer 1
```

---

## Cách dùng

### Quick Analyze
1. Paste link YouTube vào ô input
2. Bấm **⚡ Quick Analyze** (hoặc Enter)
3. Server fetch metadata video (2 YouTube API units)
4. Rule engine chạy client-side → trả về strategies ngay

### Deep Analyze (cần GEMINI_API_KEY)
1. Sau khi Quick Analyze xong, bấm **🤖 Deep Analyze**
2. Server gọi Gemini 2.0 Flash Lite với compact payload
3. Strategies được replace bằng phiên bản AI

### Lưu và đánh giá
- Bấm **✅ Dùng chiến lược này** → lưu vào Supabase workspace
- Đánh giá sao (1-5) → feedback đi vào ML loop local

### Export config
- Mở **▼ Xem Config JSON** → **📋 Copy** hoặc **💾 .json**
- JSON format tương thích với external video editor tool

---

## Thêm rule mới vào Rule Engine

File: `client/src/lib/reupAdvisor/ruleEngine.ts`

```typescript
// 1. Tạo builder function mới
function buildMyNewStrategy(meta: VideoMeta): Strategy {
  return {
    id: 'my-new-strategy',
    name: 'Chiến lược mới',
    emoji: '🆕',
    outputType: 'shorts',
    estimatedClips: Math.floor(meta.duration / 60),
    estimatedClipDuration: 60,
    config: makeConfig({
      trimStart: 5, trimEnd: 10, parts: Math.floor(meta.duration / 60),
      durationPerPart: 60,
      breakCut: { enabled: true, keep: 60, skip: 3 },
    }),
    pros: ['...'],
    cons: ['...'],
    safetyScore: 7,
    effortScore: 4,
    recommendedFor: ['gaming', 'new-account'],
    reasoning: 'Mô tả bằng tiếng Việt...',
    rank: 1,
  };
}

// 2. Thêm vào hàm runRuleEngine() trong block điều kiện phù hợp
if (isGaming && bucket === 'medium') {
  strategies.push(buildMyNewStrategy(meta)); // ← thêm đây
}
```

### Duration buckets
| Bucket | Thời lượng |
|--------|-----------|
| `micro` | < 3 phút |
| `short` | 3–10 phút |
| `medium` | 10–20 phút |
| `long` | 20–60 phút |
| `epic` | > 60 phút |

### Category IDs quan trọng
| ID | Category |
|----|---------|
| `10` | Music |
| `17` | Sports |
| `20` | Gaming |
| `22` | People & Blogs |
| `24` | Entertainment |
| `25` | News |
| `27` | Education |
| `28` | Science & Technology |

---

## Điều chỉnh LLM Prompt

File server: `api/reup-advisor/deep.js`  
Constant: `SYSTEM_PROMPT`

**Lưu ý tiết kiệm token:**
- Giữ system prompt < 200 tokens
- KHÔNG thêm examples vào system prompt (tốn nhiều token nhất)
- User message chỉ gồm 7 fields compact, KHÔNG gửi full JSON
- `responseMimeType: 'application/json'` — loại bỏ markdown wrapper (~20 tokens saved)
- `maxOutputTokens: 1200` — giới hạn cứng để không overrun

**Thêm rule vào prompt:**
```javascript
const SYSTEM_PROMPT = `...
Quy tắc bổ sung:
- Nếu categoryId=20 (Gaming) và duration>600: ưu tiên break-cut với keep=5,skip=2
`;
```

---

## Cost Estimate

| Model | Input ~350 tokens | Output ~500 tokens | Total/call |
|-------|------------------|--------------------|-----------|
| gemini-2.0-flash-lite | $0.000026 | $0.00006 | **~$0.00009** |
| gemini-1.5-flash | $0.000053 | $0.000150 | ~$0.0002 |
| gemini-1.5-pro | $0.00175 | $0.0030 | ~$0.005 |

→ **1000 Deep Analyze = ~$0.09** với Flash Lite

---

## Vercel Environment Variables cần thêm

```
GEMINI_API_KEY = AIzaSy...   # từ aistudio.google.com/app/apikey
# YT_API_KEY đã có sẵn từ Phase trước
```

---

## Files created

| File | Mô tả |
|------|-------|
| `supabase/migrations/013_reup_strategies.sql` | DB schema |
| `client/src/lib/reupAdvisor/strategyTypes.ts` | TypeScript types |
| `client/src/lib/reupAdvisor/ruleEngine.ts` | Decision tree |
| `client/src/lib/reupAdvisor/configMapper.ts` | Strategy → JSON export |
| `client/src/lib/reupAdvisor/scoringIntegration.ts` | ML feedback loop |
| `client/src/lib/reupAdvisor/llmAdvisor.ts` | Gemini wrapper |
| `client/src/hooks/useReupStrategy.ts` | State management |
| `api/reup-advisor/index.js` | Serverless: fetch YT metadata |
| `api/reup-advisor/deep.js` | Serverless: Gemini call |
| `client/src/components/reupStrategy/ConfigExporter.tsx` | JSON export UI |
| `client/src/components/reupStrategy/StrategyCard.tsx` | Strategy card |
| `client/src/components/reupStrategy/VideoAnalyzer.tsx` | URL input |
| `client/src/components/reupStrategy/StrategyComparisonModal.tsx` | Compare modal |
| `client/src/components/reupStrategy/ReupStrategyTab.tsx` | Main tab |
