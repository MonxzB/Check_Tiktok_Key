// ============================================================
// components/EmptyState.tsx — Phase 16.6 (Tailwind)
// ============================================================
import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'secondary'; icon?: string; }>;
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, actions, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center text-center px-4 py-8 text-text-muted text-sm animate-fade-in">
        {icon && <div className="text-3xl mb-2 opacity-60">{icon}</div>}
        <div className="font-semibold text-text-base mb-1">{title}</div>
        {description && <div className="text-[0.78rem] max-w-xs leading-relaxed">{description}</div>}
        {actions && (
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            {actions.map(a => (
              <button
                key={a.label}
                className={`btn ${a.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={a.onClick}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 my-6 rounded-xl animate-fade-in"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)' }}>
      {icon && <div className="text-5xl mb-4 opacity-80">{icon}</div>}
      <div className="text-lg font-semibold mb-2 text-text-base">{title}</div>
      {description && (
        <p className="text-sm text-text-muted max-w-md leading-relaxed mb-5">{description}</p>
      )}
      {actions && (
        <div className="flex gap-2.5 flex-wrap justify-center">
          {actions.map(a => (
            <button
              key={a.label}
              className={`btn ${a.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={a.onClick}
            >
              {a.icon && `${a.icon} `}{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pre-built presets ──────────────────────────────────────────
export function NoKeywordsEmptyState({ onExpand }: { onExpand?: () => void }) {
  return (
    <EmptyState
      icon="🌱" title="Chưa có keyword nào"
      description="Nhập seed keyword ở trên và nhấn 'Tạo key long-form' để hệ thống tự động mở rộng thành nhiều biến thể."
      actions={onExpand ? [{ label: 'Xem seed mặc định', onClick: onExpand, variant: 'primary', icon: '✨' }] : undefined}
    />
  );
}

export function NoYoutubeDataEmptyState({ onAnalyze }: { onAnalyze?: () => void }) {
  return (
    <EmptyState
      icon="📊" title="Chưa có dữ liệu YouTube"
      description="Phân tích keyword để xem dữ liệu view, kênh tham khảo, và cơ hội thị trường từ YouTube Data API."
      actions={onAnalyze ? [{ label: 'Phân tích ngay', onClick: onAnalyze, variant: 'primary', icon: '▶️' }] : undefined}
    />
  );
}

export function NoResultsFilterEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon="🔍" title="Không có keyword phù hợp"
      description="Thử nới lỏng bộ lọc hoặc đặt lại để xem tất cả keyword."
      actions={[{ label: 'Xóa bộ lọc', onClick: onReset, variant: 'secondary', icon: '↺' }]}
      compact
    />
  );
}

export function NoWorkspaceEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon="📁" title="Chưa có workspace"
      description="Tạo workspace để tổ chức keyword theo chủ đề và thị trường."
      actions={[{ label: 'Tạo workspace đầu tiên', onClick: onCreate, variant: 'primary', icon: '✨' }]}
    />
  );
}
