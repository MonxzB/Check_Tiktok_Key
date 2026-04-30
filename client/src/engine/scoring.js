// ============================================================
// ENGINE/SCORING.JS
// ============================================================
import { NICHE_HEAT, HIGH_RETENTION, RISKY_MARKERS, TITLE_TEMPLATES } from './constants.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreDemand(kw) {
  let score = 8;
  const heat = NICHE_HEAT[kw.niche] || 12;
  score += Math.floor((heat - 12) * 1.5);
  const demandMods = ["おすすめ","ランキング","やり方","使い方","方法"];
  for (const m of demandMods) { if (kw.keyword.includes(m)) { score += 3; break; } }
  if (kw.level === "Long-tail") score -= 2;
  if (kw.level === "Mid-tail") score += 1;
  if (kw.level === "Broad") score += 3;
  return clamp(score, 0, 20);
}

function scoreSmallAccount(kw) {
  let score = 10;
  if (kw.level === "Broad") score -= 7;
  if (kw.level === "Mid-tail") score += 2;
  if (kw.level === "Long-tail") score += 6;
  const specificNiches = ["100均 / đồ tiện ích","Phỏng vấn / chuyển việc","Du lịch Nhật"];
  if (specificNiches.includes(kw.niche)) score += 3;
  if (kw.niche === "AI / ChatGPT") score -= 2;
  return clamp(score, 0, 20);
}

function scoreSeries(kw) {
  let score = 7;
  const seriesMods = ["ランキング","おすすめ","やり方","比較","TOP"];
  for (const m of seriesMods) { if (kw.keyword.includes(m)) { score += 4; break; } }
  if (kw.level === "Long-tail") score += 2;
  if (kw.level === "Mid-tail") score += 3;
  if (kw.level === "Broad") score += 2;
  const highSeries = ["AI / ChatGPT","App tiện ích","Tiết kiệm","Fact /雑学"];
  if (highSeries.includes(kw.niche)) score += 2;
  return clamp(score, 0, 15);
}

function scoreLongtail(kw, allKws) {
  let score = 5;
  const branches = allKws.filter(k => k.keyword !== kw.keyword && k.keyword.includes(kw.keyword));
  score += Math.min(branches.length, 8);
  if (kw.level === "Broad") score += 3;
  if (kw.level === "Long-tail") score -= 2;
  return clamp(score, 0, 15);
}

function scoreRetention(kw) {
  let score = 5;
  for (const pattern of HIGH_RETENTION) {
    if (kw.keyword.includes(pattern)) { score += 5; break; }
  }
  if (/\d選|TOP|ランキング|比較/.test(kw.keyword)) score += 3;
  if (/注意|失敗|NG|やってはいけない/.test(kw.keyword)) score += 3;
  return clamp(score, 0, 15);
}

function scoreRisk(kw) {
  let score = 13;
  for (const marker of RISKY_MARKERS) {
    if (kw.keyword.includes(marker)) { score -= 8; break; }
  }
  if (kw.level === "Broad") score -= 2;
  if (kw.niche === "Story / 怖い話") score -= 3;
  return clamp(score, 0, 15);
}

export function getRecommendation(score) {
  if (score >= 85) return "Ưu tiên test mạnh";
  if (score >= 70) return "Có thể test";
  if (score >= 55) return "Test nhẹ";
  if (score >= 40) return "Cân nhắc";
  return "Bỏ qua";
}

function generateReason(kw) {
  const parts = [];
  if (kw.demand >= 14) parts.push("Nhu cầu cao");
  else if (kw.demand >= 10) parts.push("Có nhu cầu");
  else parts.push("Nhu cầu thấp");
  if (kw.smallAccount >= 14) parts.push("dễ chen cho acc nhỏ");
  else if (kw.smallAccount <= 6) parts.push("khó cho acc nhỏ");
  if (kw.series >= 10) parts.push("làm series dài được");
  if (kw.retention >= 10) parts.push("giữ chân tốt");
  if (kw.risk <= 7) parts.push("⚠️ rủi ro bản quyền");
  if (kw.level === "Broad") parts.push("quá rộng, nên thu hẹp");
  return parts.join(", ") + ".";
}

function generateNotes(kw) {
  if (kw.risk <= 5) return "⚠️ Rủi ro cao — cần kiểm tra nội dung gốc";
  if (kw.level === "Broad") return "💡 Nên mở rộng thành long-tail";
  if (kw.finalScore >= 80) return "🔥 Key tiềm năng cao";
  return "";
}

export function scoreKeywords(keywords) {
  return keywords.map(kw => {
    const scored = { ...kw };
    scored.demand = scoreDemand(scored);
    scored.smallAccount = scoreSmallAccount(scored);
    scored.series = scoreSeries(scored);
    scored.longtail = scoreLongtail(scored, keywords);
    scored.retention = scoreRetention(scored);
    scored.risk = scoreRisk(scored);
    scored.finalScore = scored.demand + scored.smallAccount + scored.series + scored.longtail + scored.retention + scored.risk;
    scored.recommendation = getRecommendation(scored.finalScore);
    scored.reason = generateReason(scored);
    scored.subKeywords = keywords
      .filter(k => k.keyword !== scored.keyword && k.keyword.startsWith(scored.keyword))
      .slice(0, 5)
      .map(k => k.keyword);
    scored.exampleTitles = shuffle(TITLE_TEMPLATES).slice(0, 3).map(t => t.replace("{kw}", scored.keyword));
    scored.notes = generateNotes(scored);
    return scored;
  });
}
