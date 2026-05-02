import React, { useState, useEffect } from 'react';

export default function MigrationBanner({ onMigrate }: { onMigrate: () => Promise<void> }) {
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
    <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 mb-3 rounded-[10px] text-[0.84rem]"
      style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.3)' }}>
      <span className="text-lg">☁️</span>
      <span className="flex-1 text-text-secondary">
        Phát hiện <strong className="text-text-base">{count} keyword</strong> lưu trên máy chưa được đồng bộ lên cloud.
      </span>
      <div className="flex gap-2">
        <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }}
          onClick={handleMigrate} disabled={migrating}>
          {migrating
            ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Đang đồng bộ...</>
            : `☁️ Đồng bộ ${count} keyword lên cloud`}
        </button>
        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          onClick={() => setDismissed(true)} disabled={migrating}>
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
