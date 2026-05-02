import React, { useEffect } from 'react';
import type { BulkItem, UseBulkAnalyzeReturn } from '../hooks/useBulkAnalyze.ts';

const STATUS_ICON: Record<BulkItem['status'], string> = {
  pending: '⏸', running: '⏳', success: '✓', failed: '✗', skipped: '—',
};
const STATUS_COLOR: Record<BulkItem['status'], string> = {
  pending: '#5c6480', running: '#00e5ff', success: '#00e676', failed: '#ff1744', skipped: '#5c6480',
};

export default function BulkAnalyzeModal({ bulk, onClose }: { bulk: UseBulkAnalyzeReturn; onClose: () => void }) {
  const { state, pause, resume, cancel } = bulk;
  const { status, total, completed, failed, usedQuota, items } = state;
  const pct      = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;
  const estSecs  = bulk.estimatedSeconds(total);
  const estUnits = bulk.estimatedUnits(total);
  const isDone   = status === 'completed' || status === 'cancelled';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDone) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isDone, onClose]);

  const barBg = status === 'completed'
    ? '#00e676'
    : status === 'cancelled'
    ? '#ff1744'
    : 'linear-gradient(90deg,#00e5ff,#7c4dff)';

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={isDone ? onClose : undefined}
    >
      <div
        className="w-full rounded-2xl px-8 py-7 flex flex-col"
        style={{
          maxWidth: 520, maxHeight: '85vh',
          background: '#0d1425',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-bold m-0">📊 Phân tích {total} keyword</h2>
          <div className="flex gap-4 text-[0.8rem] text-text-muted mt-1.5">
            <span>Quota ước tính: <strong className="text-accent">{estUnits.toLocaleString()} / 10,000 units</strong></span>
            <span>⏱ ~{estSecs}s</span>
            <span>Rate: 1 req/2s</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5 text-[0.82rem]">
            <span className="text-text-secondary">{completed} thành công · {failed} thất bại · {usedQuota} units dùng</span>
            <span className="font-bold" style={{ color: pct === 100 ? '#00e676' : '#00e5ff' }}>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: barBg, boxShadow: status === 'running' ? '0 0 12px #00e5ff' : 'none' }} />
          </div>
        </div>

        {/* Status banners */}
        {status === 'paused' && (
          <div className="px-3.5 py-2 rounded-lg text-[0.82rem] mb-3"
            style={{ background: 'rgba(255,167,38,0.1)', border: '1px solid rgba(255,167,38,0.3)', color: '#ffa726' }}>
            ⏸ Đã tạm dừng — {total - completed - failed} keyword còn lại
          </div>
        )}
        {status === 'completed' && (
          <div className="px-3.5 py-2 rounded-lg text-[0.82rem] mb-3"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676' }}>
            ✅ Hoàn thành! {completed}/{total} thành công · {failed} thất bại
          </div>
        )}

        {/* Item list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {items.map(item => (
            <div key={item.keyword}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: item.status === 'running' ? 'rgba(0,229,255,0.06)' : 'transparent',
                border: item.status === 'running' ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
              }}>
              <span className="w-4 text-center shrink-0 font-bold text-[0.9rem]"
                style={{ color: STATUS_COLOR[item.status] }}>
                {STATUS_ICON[item.status]}
              </span>
              <span className="jp-text flex-1 text-[0.84rem] truncate"
                style={{ color: item.status === 'pending' ? '#5c6480' : '#e8eaf6' }}>
                {item.keyword}
              </span>
              {item.status === 'running' && <span className="spinner shrink-0" style={{ width: 12, height: 12 }} />}
              {item.status === 'failed' && item.error && (
                <span className="text-[0.72rem] max-w-[100px] truncate" style={{ color: '#ff1744' }} title={item.error}>
                  {item.error.slice(0, 30)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {status === 'running' && (
            <button className="btn btn-secondary" style={{ padding: '7px 18px' }} onClick={pause}>⏸ Tạm dừng</button>
          )}
          {status === 'paused' && (
            <>
              <button className="btn btn-secondary" style={{ padding: '7px 18px', color: '#ff1744' }}
                onClick={() => { cancel(); onClose(); }}>🗑 Hủy bỏ</button>
              <button className="btn btn-primary" style={{ padding: '7px 18px' }} onClick={resume}>▶️ Tiếp tục</button>
            </>
          )}
          {status === 'running' && (
            <button className="btn btn-secondary" style={{ padding: '7px 18px', color: '#ff1744' }}
              onClick={() => cancel()}>✗ Hủy</button>
          )}
          {isDone && (
            <button className="btn btn-primary" style={{ padding: '7px 24px' }} onClick={onClose}>Đóng</button>
          )}
        </div>
      </div>
    </div>
  );
}
