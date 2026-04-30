import React, { useState } from 'react';
import { DEFAULT_SEEDS } from '../engine/constants.js';

export default function SeedInput({ onExpand }) {
  const [seedText, setSeedText] = useState('');
  const [activeTags, setActiveTags] = useState(new Set());

  function toggleTag(seed) {
    const newActive = new Set(activeTags);
    const lines = new Set(seedText.split('\n').map(l => l.trim()).filter(Boolean));
    if (newActive.has(seed.jp)) {
      newActive.delete(seed.jp);
      lines.delete(seed.jp);
    } else {
      newActive.add(seed.jp);
      lines.add(seed.jp);
    }
    setActiveTags(newActive);
    setSeedText([...lines].join('\n'));
  }

  function addAllSeeds() {
    const lines = new Set(seedText.split('\n').map(l => l.trim()).filter(Boolean));
    DEFAULT_SEEDS.forEach(s => lines.add(s.jp));
    setActiveTags(new Set(DEFAULT_SEEDS.map(s => s.jp)));
    setSeedText([...lines].join('\n'));
  }

  return (
    <section className="card">
      <h2><span className="icon">🌱</span> Nhập Seed Keyword (Long-form)</h2>
      <div className="seed-area">
        <div>
          <textarea
            value={seedText}
            onChange={e => setSeedText(e.target.value)}
            placeholder={"Nhập keyword tiếng Nhật, mỗi dòng 1 từ\nVí dụ:\nChatGPT 使い方\nExcel 自動化\n節約術"}
            rows={6}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Mỗi keyword sẽ được mở rộng thành nhiều biến thể long-form phù hợp YouTube.
          </p>
        </div>
        <div className="seed-library">
          <h3>📚 Seed mặc định (long-form)</h3>
          <div className="seed-tags">
            {DEFAULT_SEEDS.map(s => (
              <span
                key={s.jp}
                className={`seed-tag ${activeTags.has(s.jp) ? 'active' : ''}`}
                title={`${s.vi} — ${s.niche}`}
                onClick={() => toggleTag(s)}
              >
                {s.jp}
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
