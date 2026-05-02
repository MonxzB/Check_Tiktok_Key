import React, { useState } from 'react';

export default function ApiKeyModal({ onSave, onCancel }: { onSave: (keys: string[]) => void; onCancel: () => void }) {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const keys = keyInput.split('\n').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) { setError('Vui lòng nhập ít nhất 1 API key.'); return; }
    const invalid = keys.filter(k => !k.startsWith('AIza'));
    if (invalid.length > 0) {
      setError(`Key không hợp lệ: ${invalid[0].slice(0, 12)}... (phải bắt đầu bằng AIza)`);
      return;
    }
    onSave(keys);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg">🔑 Thêm YouTube API Key</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[0.85rem] text-text-secondary mb-3.5 leading-relaxed">
            Bạn chưa có API key. Nhập key bên dưới để bắt đầu phân tích.
            Mỗi dòng là 1 key — key hết quota sẽ tự động chuyển sang key tiếp theo.
          </p>

          <textarea
            value={keyInput}
            onChange={e => { setKeyInput(e.target.value); setError(''); }}
            placeholder={'AIzaSyAbCdEf... (key 1)\nAIzaSyXyZwVu... (key 2)'}
            rows={4}
            autoFocus
            className="w-full box-border rounded-lg text-[0.85rem] font-mono leading-relaxed resize-y outline-none transition-colors duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e8eaf6',
              padding: '10px 14px',
            }}
            onFocus={e => (e.target.style.borderColor = '#00e5ff')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
          />

          {error && (
            <div className="mt-2 px-3 py-2 rounded-lg text-[0.82rem]"
              style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', color: '#ff1744' }}>
              {error}
            </div>
          )}

          <p className="mt-2.5 text-[0.75rem] text-text-muted">
            💡 Lấy key miễn phí tại{' '}
            <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-accent">
              console.cloud.google.com
            </a>
            {' '}→ YouTube Data API v3 → Credentials → Create API Key.
            Quota: <strong className="text-text-base">10,000 units/ngày</strong> miễn phí.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 justify-end px-6 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!keyInput.trim()}>
            💾 Lưu &amp; Phân tích
          </button>
        </div>
      </div>
    </div>
  );
}
