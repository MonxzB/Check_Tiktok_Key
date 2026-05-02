import React, { useState, useEffect } from 'react';
import type { Workspace } from '../types';
import { getLanguagePack, LANGUAGE_OPTIONS } from '../engine/languages/index.js';

interface SeedInputProps {
  onExpand: (text: string) => void;
  activeWorkspace?: Workspace | null;
}

export default function SeedInput({ onExpand, activeWorkspace }: SeedInputProps) {
  const [seedText, setSeedText] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const lang = activeWorkspace?.contentLanguage ?? 'ja';
  const pack = getLanguagePack(lang);
  const langOpt = LANGUAGE_OPTIONS.find(o => o.code === lang);
  const seeds = pack.defaultSeeds;

  // Reset active tags when language changes
  useEffect(() => {
    setActiveTags(new Set());
    setSeedText('');
  }, [lang]);

  function toggleTag(text: string) {
    const newActive = new Set(activeTags);
    const lines = new Set(seedText.split('\n').map(l => l.trim()).filter(Boolean));
    if (newActive.has(text)) {
      newActive.delete(text);
      lines.delete(text);
    } else {
      newActive.add(text);
      lines.add(text);
    }
    setActiveTags(newActive);
    setSeedText([...lines].join('\n'));
  }

  function addAllSeeds() {
    const lines = new Set(seedText.split('\n').map(l => l.trim()).filter(Boolean));
    seeds.forEach(s => lines.add(s.text));
    setActiveTags(new Set(seeds.map(s => s.text)));
    setSeedText([...lines].join('\n'));
  }

  const placeholders: Record<string, string> = {
    ja: 'Nhập keyword tiếng Nhật, mỗi dòng 1 từ\nVí dụ:\nChatGPT 使い方\nExcel 自動化\n節約術',
    ko: 'Nhập keyword tiếng Hàn, mỗi dòng 1 từ\nVí dụ:\nChatGPT 사용법\n엑셀 자동화\n절약 방법',
    en: 'Enter English keywords, one per line\nExample:\nChatGPT tutorial\nExcel automation\nhow to save money',
    vi: 'Nhập keyword tiếng Việt, mỗi dòng 1 từ\nVí dụ:\nChatGPT hướng dẫn\nExcel tự động hóa\ncách tiết kiệm tiền',
  };

  return (
    <section className="card">
      <h2>
        <span className="icon">🌱</span> Nhập Seed Keyword (Long-form)
        {langOpt && (
          <span style={{
            marginLeft: 10, fontSize: '0.78rem', fontWeight: 500,
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
            padding: '2px 10px', borderRadius: 20, color: 'var(--accent)',
          }}>
            {langOpt.flag} {langOpt.name}
          </span>
        )}
      </h2>
      <div className="seed-area">
        <div>
          <textarea
            value={seedText}
            onChange={e => setSeedText(e.target.value)}
            placeholder={placeholders[lang] ?? placeholders.ja}
            rows={6}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Mỗi keyword sẽ được mở rộng thành nhiều biến thể long-form phù hợp YouTube.
          </p>
        </div>
        <div className="seed-library">
          <h3>
            📚 Seed mặc định ({langOpt?.flag} {langOpt?.name})
          </h3>
          <div className="seed-tags">
            {seeds.map(s => (
              <span
                key={s.text}
                className={`seed-tag ${activeTags.has(s.text) ? 'active' : ''}`}
                title={`${s.vi} — ${s.niche}`}
                onClick={() => toggleTag(s.text)}
              >
                {s.text}
              </span>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: '0.8rem' }} onClick={addAllSeeds}>
            ＋ Thêm tất cả seed
          </button>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => onExpand(seedText)}>
          🔀 Tạo key long-form
        </button>
      </div>
    </section>
  );
}
