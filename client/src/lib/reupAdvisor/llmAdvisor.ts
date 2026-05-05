// ============================================================
// lib/reupAdvisor/llmAdvisor.ts — Phase 19
// Gemini Flash wrapper for Deep Analyze.
// Only called when: user clicks "Deep Analyze" OR rule confidence < 60.
// Token-minimized: compact payload, JSON mode, temp=0.
// ============================================================
import type { VideoMeta, ReupStrategyResult } from './strategyTypes.ts';

// Minimal subset of VideoMeta we send to Gemini (to save tokens)
interface CompactMeta {
  dur: number;        // seconds
  cat: string;        // category name
  catId: string;
  views: number;
  subs: number;
  tags: string[];     // top 5 only
  isOfficial: boolean;
}

function toCompact(meta: VideoMeta): CompactMeta {
  return {
    dur: meta.duration,
    cat: meta.category,
    catId: meta.categoryId,
    views: meta.viewCount,
    subs: meta.channelSubs,
    tags: meta.tags.slice(0, 5),
    isOfficial: meta.isOfficialArtist,
  };
}

// Compact system prompt (~120 tokens)
const SYSTEM_PROMPT = `Bạn là chuyên gia reup video YouTube. Phân tích metadata video và đề xuất chiến lược cắt/edit.
Trả về JSON hợp lệ theo schema sau (không có text ngoài JSON):
{
  "primaryRecommendation": "shorts"|"longform"|"both",
  "confidence": number (0-100),
  "copyrightRisk": number (1-10),
  "strategies": [
    {
      "id": string,
      "name": string,
      "emoji": string,
      "outputType": "shorts"|"longform"|"mixed"|"duet",
      "estimatedClips": number,
      "estimatedClipDuration": number,
      "config": {"trimStart":number,"trimEnd":number,"parts":number,"durationPerPart":number,"breakCut":{"enabled":boolean,"keep":number,"skip":number},"duet":{"enabled":boolean,"layout":"top-bottom","bgVideoCategory":string},"audioSwap":boolean,"customText":[]},
      "pros": [string],
      "cons": [string],
      "safetyScore": number (1-10),
      "effortScore": number (1-10),
      "recommendedFor": [string],
      "reasoning": string (tiếng Việt, ngắn gọn),
      "rank": number
    }
  ]
}
Trả đúng 3-4 strategies. Ưu tiên an toàn bản quyền. KHÔNG khuyến khích vi phạm rõ ràng.`;

export interface LlmAdvisorOptions {
  apiKey: string;       // GEMINI_API_KEY from env
  model?: string;       // default: gemini-2.0-flash-lite
}

export async function callLlmAdvisor(
  meta: VideoMeta,
  opts: LlmAdvisorOptions,
): Promise<Partial<ReupStrategyResult>> {
  const { apiKey, model = 'gemini-2.0-flash-lite' } = opts;

  const compact = toCompact(meta);
  const userMsg = `Video: dur=${compact.dur}s, cat=${compact.cat}(${compact.catId}), views=${compact.views}, subs=${compact.subs}, tags=${compact.tags.join(',')}, official=${compact.isOfficial}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userMsg }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1200,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini trả về response rỗng');

  // Parse JSON (Gemini JSON mode guarantees valid JSON)
  const parsed = JSON.parse(text) as {
    primaryRecommendation: 'shorts' | 'longform' | 'both';
    confidence: number;
    copyrightRisk: number;
    strategies: ReupStrategyResult['strategies'];
  };

  // Validate minimal shape
  if (!Array.isArray(parsed.strategies) || parsed.strategies.length === 0) {
    throw new Error('Gemini trả về strategies rỗng');
  }

  return {
    primaryRecommendation: parsed.primaryRecommendation ?? 'shorts',
    confidence: parsed.confidence ?? 70,
    copyrightRisk: parsed.copyrightRisk ?? 5,
    strategies: parsed.strategies.map((s, i) => ({ ...s, rank: i + 1 })),
    generatedBy: 'llm' as const,
    generatedAt: new Date().toISOString(),
  };
}

// Estimate token cost for display in UI
export function estimateCost(model = 'gemini-2.0-flash-lite'): string {
  // ~350 input + ~500 output tokens per call
  const costs: Record<string, number> = {
    'gemini-2.0-flash-lite': 0.00008,
    'gemini-1.5-flash': 0.00015,
    'gemini-1.5-pro': 0.0025,
  };
  const usd = costs[model] ?? 0.0001;
  return `~$${usd.toFixed(5)}/lần`;
}
