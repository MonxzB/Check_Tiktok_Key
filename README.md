# 🎌 YouTube Long-Form Key Finder v3

> **Công cụ nghiên cứu keyword YouTube chuyên sâu cho nội dung tiếng Nhật, Hàn, Anh, Việt**  
> Tích hợp AI scoring, YouTube Data API, Content Calendar, Monetization Analysis và nhiều hơn nữa.

---

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Các Phase phát triển](#các-phase-phát-triển)
- [Tech Stack](#tech-stack)
- [Supabase Migrations](#supabase-migrations)

---

## Tổng quan

YouTube Long-Form Key Finder v3 là công cụ SaaS giúp content creator nghiên cứu và tối ưu hóa keyword cho video YouTube dài (10-20+ phút). Công cụ tích hợp:

- **Thuật toán chấm điểm LF (Long-Form Score)** độc quyền với 8 chiều đánh giá
- **YouTube Data API v3** để xác minh dữ liệu thực tế
- **Multi-workspace** để phân tách dự án theo niche/ngôn ngữ
- **Content Calendar** tự động lên lịch đăng bài từ keyword đã score
- **Monetization Score** ước tính tiềm năng doanh thu CPM
- **Thumbnail A/B Ideas** gợi ý concept thumbnail kèm hook 3 giây

---

## Tính năng chính

### 🔑 Tab 1: Long-Form Keywords

#### Seed Input & Expansion
- Nhập seed keywords (hỗ trợ tiếng Nhật, Hàn, Anh, Việt)
- Engine tự động expand thành 50-200 keyword variants qua các template pattern
- Hỗ trợ multi-language: `ja` 🇯🇵 / `ko` 🇰🇷 / `en` 🇺🇸 / `vi` 🇻🇳

#### Long-Form Scoring Engine (8 chiều)
| Chiều | Max | Mô tả |
|-------|-----|--------|
| Demand | 20 | Nhu cầu tìm kiếm ước tính |
| Search Intent | 15 | Người xem muốn giải thích, so sánh, hướng dẫn |
| Topic Depth | 15 | Chủ đề đủ sâu cho video 5-20+ phút |
| Small Channel | 15 | Kênh nhỏ/trung có cơ hội cạnh tranh |
| Evergreen | 10 | Nội dung còn giá trị sau nhiều tháng |
| Series Potential | 10 | Có thể làm nhiều video liên tiếp |
| Long-tail Exp. | 10 | Có thể mở rộng ra nhiều sub-topic |
| Low Risk | 5 | An toàn bản quyền |

**Tổng điểm: /100** — Recommendation: `DO IT` / `MAYBE` / `SKIP`

#### Personalized Scoring (ML Feedback Loop)
- Người dùng đánh giá video performance (views/likes/subs gain)
- Engine học từ feedback để điều chỉnh trọng số scoring
- `usePersonalScoring` hook + `personalizedScoring.ts` engine

#### Niche Heatmap
- Treemap visualization theo niche
- Click cell để filter keyword table theo niche
- Hiển thị avg score và số keyword per niche

#### Stats Bar
- Tổng keyword · Avg score · Số keyword đáng làm (≥70) · Đã có YT data · Niche phổ biến

#### Panel Grid — Top 10 & Avoid
- Top 10 keyword nên làm (score cao nhất)
- Keyword nên né (quá rộng, cạnh tranh cao)

#### Branch Section
- Gom nhóm keyword theo niche + level (beginner/intermediate/advanced)
- Hierarchical view cho content planning

#### Keyword Table
- Sort theo bất kỳ cột
- Filter: minScore / niche / level / intent / evergreen / risk / recommendation
- Persistent sort & filter state (localStorage)
- Bulk YouTube Analysis (queue nhiều keyword cùng lúc)
- Compare mode: chọn 2-4 keyword để radar chart so sánh
- Export CSV, Import CSV
- Empty state khi filter không có kết quả

#### Action Bar
- Score / Filter / Export / Import / Clear
- Tooltips + keyboard shortcuts (Shift+F: toggle filter, R: reset)

---

### ▶️ Tab 2: YouTube Research

#### YouTube Connection
- Kết nối YouTube Data API v3 qua OAuth hoặc API Key
- Multi-key rotation: thêm nhiều API keys, tự động xoay vòng khi quota hết
- Quota tracker với progress bar
- Server status check

#### Keyword Analysis
- Tìm video long-form thực tế theo keyword
- Phân tích: longVideosFound / avgViews / bestViewSubRatio / hasSmallChannelOpp
- Tự động ghi data vào Keyword object → cải thiện LF Score

#### Reference Videos Table
- Danh sách video thực tế từ YouTube
- Filter theo duration, views, channel size
- Export CSV

#### Reference Channels Table
- Kênh liên quan đến keyword
- Track channel (lưu vào Competitor tracker)
- Export CSV

---

### 📁 Tab 3: CSV / History

- Export toàn bộ keyword ra CSV (UTF-8 BOM cho Excel)
- Export YouTube videos / channels riêng
- Import CSV để restore session cũ
- History log các lần export

---

### 👥 Tab 4: Competitors

- Track danh sách kênh đối thủ
- Xem subscriber count, channel URL
- Tích hợp với YouTube Research để add channel nhanh

---

### 🎯 Tab 5: Gap Analysis

- Phân tích keyword gap so với YouTube data
- Xác định keyword đối thủ đang làm tốt nhưng mình chưa có
- `GapAnalysisTab` + `useYoutubeConnection` hook

---

### 📅 Tab 6: Content Calendar (Phase 13)

#### Tính năng
- **Auto-schedule**: Tự động xếp keyword vào lịch theo priority (score cao → lên đầu)
- **Frequency settings**: 1x / 2x / 3x / 4x video/tuần
- **Min score filter**: Chỉ lên lịch keyword đạt ≥50/60/70/80 điểm
- **Horizon**: 4 / 8 / 12 tuần
- **Week columns**: Horizontal scroll, mỗi cột = 1 tuần

#### Entry Card
- Priority badge: 🔴 Urgent (≥85) · 🟠 High (70-84) · 🟡 Medium (55-69) · ⚪ Low
- Status cycling: Kế hoạch → Đang làm → Đã đăng → Bỏ qua
- Inline edit title + notes
- Chapters preview
- Persistent state (localStorage)

#### Export
- Xuất Markdown schedule để paste vào Notion/Obsidian

---

### ⚙️ Tab 7: Cài đặt

- YouTube API Keys management (multi-key)
- Content language selection
- Personalized Scoring controls (enable/disable, reset weights)
- Theme & display preferences

---

### 💰 DetailModal Tab: Monetize (Phase 14)

Mở khi click vào keyword trong table → tab "💰 Monetize"

#### Monetization Score (6 chiều)
| Chiều | Weight | Mô tả |
|-------|--------|--------|
| Search Demand | 25% | Nhu cầu tìm kiếm |
| Avg Views (YT) | 20% | Views thực tế từ API |
| Evergreen | 20% | Thu nhập thụ động dài hạn |
| Series Potential | 15% | Subscriber retention |
| Topic Depth | 10% | CPM cao hơn với nội dung sâu |
| Copyright Safety | 10% | Không bị claim |

#### CPM Estimates by Market
| Market | CPM Range |
|--------|-----------|
| 🇯🇵 Japan | $4.0 – $12.0 |
| 🇰🇷 Korea | $2.5 – $8.0 |
| 🇺🇸 English | $3.0 – $15.0 |
| 🇻🇳 Vietnam | $0.5 – $2.5 |

#### Niche CPM Multipliers
Finance/Investment: 3.5-4x · Tech: 2.5x · Health: 2x · Entertainment: 0.7x

#### Revenue Estimator
- 3 scenarios: 1k / 10k / 100k views/tháng
- Tính sau khi trừ 45% YouTube cut

---

### 🎨 DetailModal Tab: Thumbnail A/B (Phase 15)

#### 9 Thumbnail Styles
| Style | CTR | Mô tả |
|-------|-----|--------|
| 😱 Face Reaction | 🔥 Cao | Close-up shocked/excited face |
| ❓ Mystery | 🔥 Cao | Blurred + question mark |
| ↔️ Before/After | 🔥 Cao | Split-screen transformation |
| ✅ Result First | 🔥 Cao | Show outcome upfront |
| 🔢 Listicle | 📊 TB | Number + grid |
| ⚖️ Comparison | 📊 TB | Side-by-side |
| 🎯 Tutorial | 📊 TB | Steps + arrows |
| 💬 Text Heavy | 📊 TB | Bold text, minimal image |
| 🎬 Cinematic | 🎨 Ổn | Movie-poster wide shot |

#### Cho mỗi concept
- Headline text (ngôn ngữ phù hợp JP/KR/EN/VI)
- Visual description: hướng dẫn design chi tiết
- Color palette swatches
- Hook 3 giây đầu video (copy button)
- 3 Design Tips actionable
- A/B variant pairing (concept 1A vs 1B, concept 2A vs 2B)

---

### 🎯 DetailModal Tab: SEO (Phase 12)

- Title optimization suggestions
- Keyword density analysis
- Description template
- Tags recommendations
- So sánh với reference videos

---

### 📈 DetailModal Tab: Trend (Phase 10)

- Line chart: LF Score theo thời gian (snapshots)
- Avg Views theo thời gian
- Filter: 7d / 30d / 90d / All
- Trend direction: ↑ Rising / → Stable / ↓ Declining

---

### 📊 DetailModal Tab: Feedback (Phase 9)

- Đánh giá performance sau khi đăng video
- Rating: views gain / likes rate / subscriber gain
- Dữ liệu feed vào ML Personalized Scoring

---

## UX Features (Phase 16)

### Skeleton Loading
- `KeywordTableSkeleton`: shimmer animation thay cho bảng trống
- `StatsBarSkeleton`: placeholder stats trong khi load

### Empty States
- **NoKeywords**: Hướng dẫn nhập seed keyword
- **NoResults**: Khi filter không tìm thấy kết quả
- **NoYoutubeData**: Khi chưa có YT API data

### Persistent UI State
- Tab đang mở, filter settings, sort column được lưu localStorage
- Không mất state khi refresh trang

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Shift+F` | Toggle filter bar |
| `R` | Reset filters |
| `Escape` | Đóng modal |

### Tooltips
- Tất cả button có `data-tooltip` attribute
- Keyboard shortcut hints hiển thị trong ActionBar

---

## Cài đặt & Chạy

### Prerequisites
- Node.js 18+
- Supabase account (miễn phí)
- YouTube Data API v3 key (optional)

### 1. Clone & Install

```bash
git clone <repo-url>
cd tiktok-keyword-tool-v2

# Install client
cd client && npm install

# Install server
cd ../server && npm install
```

### 2. Environment Variables

**`client/.env`**
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**`server/.env`**
```env
YOUTUBE_API_KEY=AIza...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=3001
```

### 3. Supabase Migrations

```bash
# Chạy toàn bộ migrations theo thứ tự
supabase db push
# hoặc thủ công qua Supabase SQL Editor
```

### 4. Chạy Development

```bash
# Terminal 1: Client (Vite + React)
cd client && npm run dev
# → http://localhost:5173

# Terminal 2: Server (Express + YouTube API proxy)
cd server && npm run dev
# → http://localhost:3001
```

### 5. Build Production

```bash
cd client && npm run build
# Output: client/dist/
```

---

## Cấu trúc dự án

```
tiktok-keyword-tool-v2/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DetailModal.tsx      # Keyword detail popup (6 tabs)
│   │   │   ├── KeywordTable.tsx     # Sortable/filterable table
│   │   │   ├── ContentCalendarTab.tsx  # Phase 13
│   │   │   ├── MonetizationTab.tsx  # Phase 14
│   │   │   ├── ThumbnailTab.tsx     # Phase 15
│   │   │   ├── SeoTab.tsx           # Phase 12
│   │   │   ├── GapAnalysisTab.tsx   # Phase 11
│   │   │   ├── CompetitorTab.tsx    # Phase 7
│   │   │   ├── NicheHeatmap.tsx     # Treemap visualization
│   │   │   ├── Skeleton.tsx         # Phase 16 loading
│   │   │   ├── EmptyState.tsx       # Phase 16 empty states
│   │   │   ├── CalendarErrorBoundary.tsx
│   │   │   └── auth/                # Login/Signup/Auth gate
│   │   ├── engine/
│   │   │   ├── longFormScoring.ts   # Core scoring algorithm
│   │   │   ├── expansion.ts         # Keyword expansion templates
│   │   │   ├── contentCalendar.ts   # Phase 13 calendar logic
│   │   │   ├── monetizationScore.ts # Phase 14 CPM estimation
│   │   │   ├── thumbnailIdeas.ts    # Phase 15 thumbnail concepts
│   │   │   ├── seoAnalyzer.ts       # Phase 12 SEO scoring
│   │   │   ├── personalizedScoring.ts  # ML feedback loop
│   │   │   ├── trendDetection.ts    # Snapshot trend analysis
│   │   │   ├── quotaTracker.ts      # YouTube API quota mgmt
│   │   │   └── languages/           # JP/KR/EN/VI keyword packs
│   │   │       ├── ja.ts            # Japanese patterns
│   │   │       ├── ko.ts            # Korean patterns
│   │   │       ├── en.ts            # English patterns
│   │   │       └── vi.ts            # Vietnamese patterns
│   │   ├── hooks/
│   │   │   ├── useKeywords.ts       # Main keyword state
│   │   │   ├── useYoutube.ts        # YouTube API integration
│   │   │   ├── useSettings.ts       # App settings
│   │   │   ├── useWorkspaces.ts     # Multi-workspace
│   │   │   ├── usePersonalScoring.ts
│   │   │   ├── usePersistentState.ts  # localStorage wrapper
│   │   │   ├── useSnapshots.ts      # Score history
│   │   │   └── useToast.ts          # Notification system
│   │   ├── lib/
│   │   │   └── supabase.ts          # Singleton Supabase client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── App.tsx                  # Root component
│   │   └── index.css                # Global styles + design system
│   └── vite.config.ts               # Code splitting config
├── server/                          # Express API proxy
│   ├── routes/
│   │   ├── youtube.ts               # YouTube Data API proxy
│   │   └── oauth.ts                 # OAuth flow
│   └── index.ts                     # Server entry
└── supabase/
    └── migrations/
        ├── 001_workspaces.sql       # Workspaces + keywords
        ├── 002_snapshots.sql        # Score history
        ├── 003_competitor_tracker.sql
        ├── 004_youtube_connections.sql
        ├── 005_keyword_feedbacks.sql
        └── 006_multi_language.sql   # contentLanguage column
```

---

## Các Phase phát triển

| Phase | Tính năng | Status |
|-------|-----------|--------|
| 1 | Core LF Scoring Engine | ✅ Done |
| 2 | Keyword Expansion Templates | ✅ Done |
| 3 | Multi-workspace (Supabase) | ✅ Done |
| 4 | YouTube Data API Integration | ✅ Done |
| 5 | Bulk Analysis Queue | ✅ Done |
| 6 | Snapshot & Trend Detection | ✅ Done |
| 7 | Competitor Channel Tracker | ✅ Done |
| 8 | Niche Heatmap (Treemap) | ✅ Done |
| 9 | ML Feedback Loop (Personal Scoring) | ✅ Done |
| 10 | Trend Chart in DetailModal | ✅ Done |
| 10.5 | Gap Analysis Tab (YouTube channel connect) | ✅ Done |
| 11 | Multi-language Support (JP/KR/EN/VI) | ✅ Done |
| 12 | SEO Score Tab | ✅ Done |
| 13 | Content Calendar | ✅ Done |
| 14 | Monetization Score | ✅ Done |
| 15 | Thumbnail A/B Ideas | ✅ Done |
| 16 | UX Polish (Skeleton/Empty/Keyboard) | ✅ Done |
| 16.5 | localStorage Workspace Scoping | ✅ Done |
| 17 | Performance Monitoring Dashboard | 🔲 Planned |

---

## Tech Stack

### Frontend
| Library | Version | Dùng cho |
|---------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool + dev server |
| Recharts | 2 | Charts (Radar, Line, Treemap) |
| @supabase/supabase-js | 2 | Auth + Database |
| html-to-image | latest | Export PNG |

### Backend
| Library | Version | Dùng cho |
|---------|---------|---------|
| Express | 4 | API proxy server |
| TypeScript | 5 | Type safety |
| node-fetch | 3 | YouTube API calls |

### Infrastructure
- **Supabase**: PostgreSQL + Auth + Realtime
- **Vite manualChunks**: Code splitting (recharts, vendor, lazy tabs)
- **localStorage**: Persistent UI state + Calendar overrides

---

## Supabase Migrations

```sql
-- 001: Core workspaces + keywords table
-- 002: Keyword snapshots (score history)
-- 003: Competitor channel tracker
-- 004: YouTube OAuth connections
-- 005: User keyword feedbacks (ML training data)
-- 006: contentLanguage column for multi-language
```

Chạy theo thứ tự hoặc dùng `supabase db push` nếu có Supabase CLI.

---

## Keyboard Shortcuts

| Key | Action | Tab |
|-----|--------|-----|
| `Shift + F` | Toggle filter bar | Keywords |
| `R` | Reset all filters | Keywords |
| `Escape` | Đóng modal/dialog | Toàn cục |

---

## Notes

- **GoTrueClient**: Supabase client dùng `globalThis` singleton để tránh duplicate instances khi Vite code-split
- **Recharts**: Tất cả `ResponsiveContainer` dùng pixel height (không phải `100%`) để tránh 0-size warning
- **ContentCalendarTab**: Lazy-loaded + Error Boundary để isolate crashes
- **DetailModal tabs**: Tất cả tab phụ (SEO, Monetize, Thumbnail) lazy-loaded với Suspense

---

*Made with ❤️ for Japanese YouTube Content Creators*
