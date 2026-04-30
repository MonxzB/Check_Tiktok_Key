# 🎌 YouTube Long-Form Key Finder

Công cụ nghiên cứu keyword YouTube long-form tiếng Nhật, giúp tìm và đánh giá keyword phù hợp cho video 5–20+ phút.

## Tech Stack

- **Frontend**: React 18 + Vite 6 (port 5173)
- **Backend**: Node.js + Express (port 3001) — YouTube API proxy
- **API**: YouTube Data API v3

---

## Cách chạy

### 1. Cài dependencies (1 lần đầu)
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Cấu hình YouTube API Key
```bash
cd server
copy .env.example .env
# Mở file .env và điền: YT_API_KEY=your_key_here
```

Lấy API key tại: https://console.cloud.google.com → YouTube Data API v3

### 3. Khởi động

**Terminal 1 — Backend:**
```bash
cd server && npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd client && npm run dev
# → http://localhost:5173
```

---

## Tính năng

### 📋 Long-Form Keywords
- Nhập seed keyword tiếng Nhật → tự động mở rộng thành 50–200 biến thể long-form
- Chấm điểm 8 chiều (tối đa 100 điểm)
- Gợi ý chapters tiếng Nhật (5–8 chương)
- Gợi ý tiêu đề tiếng Nhật (3 options)
- Lọc theo niche, cấp độ, search intent, evergreen, rủi ro

### ▶️ YouTube Research
- Phân tích keyword bằng YouTube Data API
- Tìm video long-form (≥8 phút mặc định)
- Lọc Shorts tự động (#shorts, duration ≤60s)
- Tính toán View/Sub Ratio cho cơ hội kênh nhỏ
- Phát hiện nội dung rủi ro (anime cut, reup, TV clip...)

### 📺 Kênh Tham Khảo
- Danh sách kênh có video long-form liên quan
- Channel Fit Score: đánh giá độ phù hợp
- Highlight kênh nhỏ có View/Sub ratio cao

### 📁 CSV / History
- Xuất keywords (28 cột) → `youtube_longform_keywords.csv`
- Xuất reference videos → `youtube_ref_videos.csv`
- Xuất reference channels → `youtube_ref_channels.csv`
- Nhập CSV để restore session

---

## Hệ thống chấm điểm Long-Form Score (0–100)

| Chiều | Max | Ý nghĩa |
|---|---|---|
| Long-Form Demand | 20 | Video long-form cho key này có views tốt không? |
| Search Intent | 15 | Người dùng tìm hướng dẫn / giải thích / so sánh? |
| Topic Depth | 15 | Chủ đề đủ sâu cho video 5–20+ phút? |
| Small Channel Opportunity | 15 | Kênh nhỏ có cơ hội không? |
| Evergreen | 10 | Chủ đề còn giá trị sau nhiều tháng? |
| Series Potential | 10 | Có thể làm nhiều tập liên tiếp? |
| Long-tail Expansion | 10 | Mở rộng được nhiều sub-topic? |
| Low Risk | 5 | An toàn bản quyền (5=an toàn, 0=rủi ro) |

**Recommendation:**
- **85–100**: Rất đáng làm long video
- **70–84**: Có thể làm long video
- **55–69**: Test nhẹ long video
- **40–54**: Cân nhắc
- **< 40**: Bỏ qua

---

## Độ tươi dữ liệu (Freshness)

| Label | Ý nghĩa |
|---|---|
| 🟢 Fresh | Thu thập trong 7 ngày qua |
| 🔵 Recent | Thu thập trong 30 ngày qua |
| 🟡 Stale | Thu thập 30–90 ngày trước |
| 🔴 Very stale | Thu thập >90 ngày trước |

Mức độ tin cậy:
- **High**: Có API data + ≥3 long videos + channel stats + video gần đây
- **Medium**: Có API data nhưng ít kết quả
- **Low**: Chỉ rule-based, không có API data

---

## API Quota

Mỗi lần phân tích 1 keyword tiêu tốn ~3–5 API calls:
1. Search videos: 100 units
2. Get video details: 1 unit/video
3. Get channel details: 1 unit/channel

YouTube Data API free quota: **10,000 units/ngày**

---

## Lưu ý bảo mật

- `YT_API_KEY` chỉ lưu trong `server/.env` — **không lộ ra browser**
- **Không commit `.env` lên GitHub**
- Server-side cache 7 ngày — tiết kiệm quota khi test lại cùng keyword

---

## Cấu trúc project

```
tiktok-keyword-tool-v2/
├── server/
│   ├── index.js            ← Express server
│   ├── routes/youtube.js   ← YouTube API proxy (duration filter, scoring)
│   └── .env                ← API key (không commit)
└── client/
    └── src/
        ├── engine/
        │   ├── constants.js       ← Seeds, niches, boost words
        │   ├── expansion.js       ← Keyword expansion
        │   ├── longFormScoring.js ← 8-dimension scoring
        │   ├── durationUtils.js   ← ISO 8601 duration parser
        │   ├── dataMetadata.js    ← Freshness, confidence
        │   └── csvUtils.js        ← CSV import/export
        ├── hooks/
        │   ├── useKeywords.js
        │   ├── useYoutube.js
        │   └── useSettings.js
        └── components/           ← 17 React components
```

---

## Disclaimer

> Tool này chỉ dùng để **nghiên cứu keyword**, **video tham khảo** và **kênh tham khảo** cho nội dung gốc long-form.
> Điểm số chỉ đúng theo dữ liệu được lấy tại thời điểm phân tích.
> Luôn tạo nội dung gốc của riêng bạn. Không copy, reup hoặc sử dụng nội dung từ video/kênh tham khảo.
