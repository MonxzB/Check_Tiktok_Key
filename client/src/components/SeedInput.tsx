import React, { useState, useEffect } from 'react';
import type { Workspace } from '../types';
import { getLanguagePack, LANGUAGE_OPTIONS } from '../engine/languages/index.js';
import { lookupViToJp, parseViInputToJpSeeds, type ViLookupResult } from '../engine/viToJpLookup';
import { getSeedObjects } from '../engine/expansion';

interface SeedInputProps {
  onExpand: (text: string) => void;
  activeWorkspace?: Workspace | null;
  apiKeys?: string[];
}

export default function SeedInput({ onExpand, activeWorkspace }: SeedInputProps) {
  const [seedText,   setSeedText]   = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  // ── VI mode state ──────────────────────────────────────────
  const [viMode,    setViMode]    = useState(false);
  const [viText,    setViText]    = useState('');
  const [viResults, setViResults] = useState<ViLookupResult[]>([]);
  const [viPreview, setViPreview] = useState<{ jp: string; vi: string }[]>([]);

  const lang    = activeWorkspace?.contentLanguage ?? 'ja';
  const pack    = getLanguagePack(lang);
  const langOpt = LANGUAGE_OPTIONS.find(o => o.code === lang);
  const seeds   = pack.defaultSeeds;

  useEffect(() => { setActiveTags(new Set()); setSeedText(''); }, [lang]);

  function toggleTag(text: string) {
    const newActive = new Set(activeTags);
    const lines = new Set(seedText.split('\n').map(l => l.trim()).filter(Boolean));
    if (newActive.has(text)) { newActive.delete(text); lines.delete(text); }
    else { newActive.add(text); lines.add(text); }
    setActiveTags(newActive);
    setSeedText([...lines].join('\n'));
  }

  function addAllSeeds() {
    const lines = new Set(seedText.split('\n').map(l => l.trim()).filter(Boolean));
    seeds.forEach(s => lines.add(s.text));
    setActiveTags(new Set(seeds.map(s => s.text)));
    setSeedText([...lines].join('\n'));
  }

  // ── VI mode handlers ───────────────────────────────────────
  function handleViLookup() {
    if (!viText.trim()) return;
    const lines = viText.split('\n').map(l => l.trim()).filter(Boolean);
    // Preview per-line first result
    const preview: { jp: string; vi: string }[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const matches = lookupViToJp(line);
      for (const m of matches) {
        if (!seen.has(m.jpKeyword)) {
          seen.add(m.jpKeyword);
          preview.push({ jp: m.jpKeyword, vi: m.viMeaning });
        }
      }
    }
    setViPreview(preview);
    // Also show all matches for last line (for detail view)
    const lastMatches = lookupViToJp(lines[lines.length - 1] ?? '');
    setViResults(lastMatches);
  }

  function handleViRemove(jp: string) {
    setViPreview(prev => prev.filter(p => p.jp !== jp));
  }

  function handleViGenerate() {
    if (viPreview.length === 0) { handleViLookup(); return; }
    const jpText = viPreview.map(p => p.jp).join('\n');
    onExpand(jpText);
  }

  const placeholders: Record<string, string> = {
    ja: 'Nhập keyword tiếng Nhật, mỗi dòng 1 từ\nVí dụ:\n釣り 初心者\nキャンプ 道具\nダイエット 方法',
    ko: 'Nhập keyword tiếng Hàn, mỗi dòng 1 từ\nVí dụ:\nChatGPT 사용법\n엑셀 자동화\n절약 방법',
    en: 'Enter English keywords, one per line\nExample:\nfishing for beginners\ncamping gear guide\nhow to lose weight',
    vi: 'Nhập keyword tiếng Việt, mỗi dòng 1 từ\nVí dụ:\ncâu cá cho người mới\ncách nấu ăn tiết kiệm\ndi cắm trại',
  };

  const sourceColor: Record<string, string> = {
    exact: '#22c55e',
    fuzzy: '#3b82f6',
    token: '#f59e0b',
    niche: '#94a3b8',
  };
  const sourceLabel: Record<string, string> = {
    exact: 'Khớp chính xác',
    fuzzy: 'Khớp gần đúng',
    token: 'Khớp từng token',
    niche: 'Theo niche',
  };

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="m-0">
          <span className="icon">🌱</span> Nhập Seed Keyword (Long-form)
          {langOpt && !viMode && (
            <span className="ml-2.5 text-[0.78rem] font-medium px-2.5 py-0.5 rounded-full text-accent"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}>
              {langOpt.flag} {langOpt.name}
            </span>
          )}
          {viMode && (
            <span className="ml-2.5 text-[0.78rem] font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,165,0,0.12)', border: '1px solid rgba(255,165,0,0.3)', color: '#f97316' }}>
              🇻🇳 Nhập Việt → tìm Nhật
            </span>
          )}
        </h2>
        {/* Toggle VI mode */}
        <button
          className="btn btn-secondary"
          style={{
            fontSize: '0.78rem', padding: '4px 12px',
            borderColor: viMode ? '#f97316' : undefined,
            color: viMode ? '#f97316' : undefined,
          }}
          onClick={() => { setViMode(m => !m); setViPreview([]); setViResults([]); }}
        >
          {viMode ? '🇯🇵 Quay về nhập JP' : '🇻🇳 Nhập từ tiếng Việt'}
        </button>
      </div>

      {/* ── Normal JP mode ─────────────────────────────────── */}
      {!viMode && (
        <>
          <div className="seed-area">
            <div>
              <textarea value={seedText} onChange={e => setSeedText(e.target.value)}
                placeholder={placeholders[lang] ?? placeholders.ja} rows={6} />
              <p className="text-[0.75rem] text-text-muted mt-1.5">
                Mỗi keyword sẽ được mở rộng thành nhiều biến thể long-form phù hợp YouTube.
              </p>
            </div>
            <div className="seed-library">
              <h3>📚 Seed mặc định ({langOpt?.flag} {langOpt?.name})</h3>
              <div className="seed-tags">
                {seeds.map(s => (
                  <span key={s.text}
                    className={`seed-tag ${activeTags.has(s.text) ? 'active' : ''}`}
                    title={`${s.vi} — ${s.niche}`}
                    onClick={() => toggleTag(s.text)}>
                    {s.text}
                  </span>
                ))}
              </div>
              <button className="btn btn-secondary mt-2 text-[0.8rem]" onClick={addAllSeeds}>
                ＋ Thêm tất cả seed
              </button>
            </div>
          </div>
          <div className="mt-4">
            <button className="btn btn-primary" onClick={() => onExpand(seedText)}>
              🔀 Tạo key long-form
            </button>
          </div>
        </>
      )}

      {/* ── Vietnamese input mode ───────────────────────────── */}
      {viMode && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[0.8rem] text-text-muted mb-1.5">
              📝 Nhập chủ đề/keyword tiếng Việt (mỗi dòng 1 chủ đề):
            </label>
            <textarea
              className="w-full"
              rows={5}
              value={viText}
              onChange={e => { setViText(e.target.value); setViPreview([]); }}
              placeholder={'tiết kiệm tiền\ncách học tiếng Anh\nAI ChatGPT công cụ\nphỏng vấn xin việc\ntâm lý học'}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 12px',
                color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', width: '100%',
              }}
            />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={handleViLookup} disabled={!viText.trim()}>
              🔍 Tìm keyword Nhật
            </button>
            {viPreview.length > 0 && (
              <button className="btn btn-primary" onClick={handleViGenerate}>
                🔀 Tạo key long-form ({viPreview.length} keywords)
              </button>
            )}
          </div>

          {/* Preview bảng kết quả */}
          {viPreview.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-3 py-2 flex items-center justify-between"
                style={{ background: 'rgba(15,23,50,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[0.8rem] font-semibold text-text-muted">
                  🇯🇵 {viPreview.length} keyword Nhật được tìm thấy
                </span>
                <span className="text-[0.72rem] text-text-muted">
                  Click ✕ để bỏ keyword không muốn
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                {viPreview.map(p => (
                  <span key={p.jp}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.8rem]"
                    style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#e2e8f0' }}>
                    <span className="font-mono font-semibold text-accent">{p.jp}</span>
                    <span className="text-text-muted text-[0.72rem]">({p.vi})</span>
                    <button
                      onClick={() => handleViRemove(p.jp)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: '0.75rem', lineHeight: 1 }}
                      title="Bỏ keyword này"
                    >✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {viPreview.length === 0 && viText.trim() && (
            <p className="text-[0.78rem] text-text-muted">
              💡 Hệ thống sẽ tìm keyword tiếng Nhật phù hợp từ database và dictionary có sẵn.
              Nhấn <strong>🔍 Tìm keyword Nhật</strong> để xem kết quả.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
