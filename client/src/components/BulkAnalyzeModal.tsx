import React, { useEffect } from 'react';
import type { BulkAnalyzeState, BulkItem, UseBulkAnalyzeReturn } from '../hooks/useBulkAnalyze.ts';

interface BulkAnalyzeModalProps {
  bulk: UseBulkAnalyzeReturn;
  onClose: () => void;
}

const STATUS_ICON: Record<BulkItem['status'], string> = {
  pending: '⏸',
  running: '⏳',
  success: '✓',
  failed:  '✗',
  skipped: '—',
};
const STATUS_COLOR: Record<BulkItem['status'], string> = {
  pending: 'var(--text-muted)',
  running: 'var(--accent)',
  success: 'var(--green)',
  failed:  'var(--red)',
  skipped: 'var(--text-muted)',
};

export default function BulkAnalyzeModal({ bulk, onClose }: BulkAnalyzeModalProps) {
  const { state, pause, resume, cancel } = bulk;
  const { status, total, completed, failed, usedQuota, items } = state;

  const pct     = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;
  const estSecs = bulk.estimatedSeconds(total);
  const estUnits = bulk.estimatedUnits(total);

  // Close on Escape only when done/cancelled
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && (status === 'completed' || status === 'cancelled')) onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [status, onClose]);

  const isDone = status === 'completed' || status === 'cancelled';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(6px)' }}
      onClick={isDone ? onClose : undefined}
    >
      <div
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
            📊 Phân tích {total} keyword
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, display: 'flex', gap: 16 }}>
            <span>Quota ước tính: <strong style={{ color: 'var(--accent)' }}>{estUnits.toLocaleString()} / 10,000 units</strong></span>
            <span>⏱ ~{estSecs}s</span>
            <span>Rate: 1 req/2s</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {completed} thành công · {failed} thất bại · {usedQuota} units dùng
            </span>
            <span style={{ fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--accent)' }}>{pct}%</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: status === 'completed' ? 'var(--green)' : status === 'cancelled' ? 'var(--red)' : 'linear-gradient(90deg,var(--accent),#7c4dff)',
              width: `${pct}%`,
              transition: 'width 0.4s ease',
              boxShadow: status === 'running' ? '0 0 12px var(--accent)' : 'none',
            }} />
          </div>
        </div>

        {/* Status banner */}
        {status === 'paused' && (
          <div style={{ padding: '8px 14px', background: 'rgba(255,167,38,0.1)', border: '1px solid rgba(255,167,38,0.3)', borderRadius: 8, fontSize: '0.82rem', color: '#ffa726', marginBottom: 12 }}>
            ⏸ Đã tạm dừng — {total - completed - failed} keyword còn lại
          </div>
        )}
        {status === 'completed' && (
          <div style={{ padding: '8px 14px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--green)', marginBottom: 12 }}>
            ✅ Hoàn thành! {completed}/{total} thành công · {failed} thất bại
          </div>
        )}

        {/* Item list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(item => (
            <div key={item.keyword} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 8,
              background: item.status === 'running' ? 'rgba(0,229,255,0.06)' : 'transparent',
              border: item.status === 'running' ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}>
              <span style={{ color: STATUS_COLOR[item.status], fontWeight: 700, width: 16, textAlign: 'center', flexShrink: 0, fontSize: item.status === 'running' ? '1rem' : '0.9rem' }}>
                {STATUS_ICON[item.status]}
              </span>
              <span className="jp-text" style={{ flex: 1, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: item.status === 'pending' ? 'var(--text-muted)' : 'var(--text)' }}>
                {item.keyword}
              </span>
              {item.status === 'running' && (
                <span className="spinner" style={{ width: 12, height: 12, flexShrink: 0 }} />
              )}
              {item.status === 'failed' && item.error && (
                <span style={{ fontSize: '0.72rem', color: 'var(--red)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.error}>
                  {item.error.slice(0, 30)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
          {status === 'running' && (
            <button className="btn btn-secondary" onClick={pause} style={{ padding: '7px 18px' }}>⏸ Tạm dừng</button>
          )}
          {status === 'paused' && (
            <>
              <button className="btn btn-secondary" onClick={() => { cancel(); onClose(); }} style={{ padding: '7px 18px', color: 'var(--red)' }}>🗑 Hủy bỏ</button>
              <button className="btn btn-primary" onClick={resume} style={{ padding: '7px 18px' }}>▶️ Tiếp tục</button>
            </>
          )}
          {(status === 'running') && (
            <button className="btn btn-secondary" onClick={() => { cancel(); }} style={{ padding: '7px 18px', color: 'var(--red)' }}>✗ Hủy</button>
          )}
          {isDone && (
            <button className="btn btn-primary" onClick={onClose} style={{ padding: '7px 24px' }}>Đóng</button>
          )}
        </div>
      </div>
    </div>
  );
}
