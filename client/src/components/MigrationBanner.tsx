import React, { useState, useEffect } from 'react';

interface MigrationBannerProps {
  onMigrate: () => Promise<void>;
}

export default function MigrationBanner({ onMigrate }: MigrationBannerProps) {
  const [migrating, setMigrating] = useState(false);
  const [count, setCount]         = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const old = localStorage.getItem('ytlf_keywords');
      if (old) setCount((JSON.parse(old) as unknown[]).length);
    } catch {}
  }, []);

  if (dismissed || count === 0) return null;

  async function handleMigrate() {
    setMigrating(true);
    await onMigrate();
    setMigrating(false);
    setDismissed(true);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 16px', marginBottom: 12,
      background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.3)',
      borderRadius: 10, fontSize: '0.84rem',
    }}>
      <span style={{ fontSize: '1.1rem' }}>☁️</span>
      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
        Phát hiện <strong style={{ color: 'var(--text)' }}>{count} keyword</strong> lưu trên máy chưa được đồng bộ lên cloud.
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary"
          style={{ padding: '6px 16px', fontSize: '0.82rem' }}
          onClick={handleMigrate}
          disabled={migrating}
        >
          {migrating
            ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang đồng bộ...</>
            : `☁️ Đồng bộ ${count} keyword lên cloud`}
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          onClick={() => setDismissed(true)}
          disabled={migrating}
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
