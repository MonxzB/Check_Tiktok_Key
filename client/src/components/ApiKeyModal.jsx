import React, { useState } from 'react';

export default function ApiKeyModal({ onSave, onCancel }) {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const keys = keyInput.split('\n').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) { setError('Vui lòng nhập ít nhất 1 API key.'); return; }
    const invalid = keys.filter(k => !k.startsWith('AIza'));
    if (invalid.length > 0) {
      setError(`Key không hợp lệ: ${invalid[0].slice(0,12)}... (phải bắt đầu bằng AIza)`);
      return;
    }
    onSave(keys);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 style={{ fontSize:'1.1rem' }}>🔑 Thêm YouTube API Key</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px' }}>
          <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:14, lineHeight:1.7 }}>
            Bạn chưa có API key. Nhập key bên dưới để bắt đầu phân tích.
            Mỗi dòng là 1 key — key hết quota sẽ tự động chuyển sang key tiếp theo.
          </p>

          <textarea
            value={keyInput}
            onChange={e => { setKeyInput(e.target.value); setError(''); }}
            placeholder={'AIzaSyAbCdEf... (key 1)\nAIzaSyXyZwVu... (key 2)'}
            rows={4}
            autoFocus
            style={{
              width:'100%', background:'rgba(255,255,255,0.04)',
              border:'1px solid var(--glass-border)', borderRadius:8,
              color:'var(--text)', padding:'10px 14px', fontSize:'0.85rem',
              fontFamily:'monospace', resize:'vertical', boxSizing:'border-box',
              lineHeight:1.7, outline:'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
          />

          {error && (
            <div style={{
              marginTop:8, padding:'8px 12px', borderRadius:6,
              background:'rgba(255,23,68,0.1)', border:'1px solid rgba(255,23,68,0.3)',
              fontSize:'0.82rem', color:'var(--red)',
            }}>{error}</div>
          )}

          <p style={{ marginTop:10, fontSize:'0.75rem', color:'var(--text-muted)' }}>
            💡 Lấy key miễn phí tại{' '}
            <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
              style={{ color:'var(--accent)' }}>console.cloud.google.com</a>
            {' '}→ YouTube Data API v3 → Credentials → Create API Key.
            Quota: <strong style={{ color:'var(--text)' }}>10,000 units/ngày</strong> miễn phí.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display:'flex', gap:10, justifyContent:'flex-end',
          padding:'14px 24px', borderTop:'1px solid var(--glass-border)',
        }}>
          <button className="btn btn-secondary" onClick={onCancel}>Huỷ</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!keyInput.trim()}
          >
            💾 Lưu &amp; Phân tích
          </button>
        </div>
      </div>
    </div>
  );
}
