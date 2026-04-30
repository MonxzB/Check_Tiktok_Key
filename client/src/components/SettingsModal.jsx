import React from 'react';

export default function SettingsModal({ onClose }) {
  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2><span className="icon">⚙️</span> Cài đặt Hệ thống</h2>

        <div style={{ marginTop: 20, background: 'var(--glass)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 8, color: 'var(--accent)' }}>
            🔒 API Key — Bảo mật mới
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Phiên bản này sử dụng <strong>Node.js backend</strong> làm proxy.
            API Key YouTube không còn lưu trong trình duyệt nữa.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
            Để cấu hình API Key, hãy tạo file <code style={{ background: 'rgba(0,229,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>server/.env</code> với nội dung:
          </p>
          <pre style={{
            background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8,
            marginTop: 10, fontSize: '0.85rem', color: 'var(--green)',
            border: '1px solid var(--glass-border)', overflowX: 'auto',
          }}>
{`YT_API_KEY=your_youtube_api_key_here
PORT=3001`}
          </pre>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
            Sau khi tạo file .env, khởi động lại server để áp dụng.
            Quota ước tính: ~100 units / 1 lần tìm kiếm.
          </p>
        </div>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,230,118,0.05)', borderRadius: 8, border: '1px solid rgba(0,230,118,0.15)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--green)' }}>
            ✅ Kiểm tra trạng thái server: mở tab <strong>YouTube Research</strong> — nếu thấy cảnh báo màu cam thì server chưa có API key.
          </p>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>✓ Đóng</button>
        </div>
      </div>
    </div>
  );
}
