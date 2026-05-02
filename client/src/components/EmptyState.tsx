// ============================================================
// components/EmptyState.tsx — Phase 16.6: Empty States with CTAs
// ============================================================
import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: string;
  }>;
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, actions, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '32px 16px',
        color: 'var(--text-muted)', fontSize: '0.85rem',
        animation: 'fadeIn 0.3s ease',
      }}>
        {icon && <div style={{ fontSize: '1.8rem', marginBottom: 8, opacity: 0.6 }}>{icon}</div>}
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
        {description && <div style={{ fontSize: '0.78rem', maxWidth: 320, lineHeight: 1.5 }}>{description}</div>}
        {actions && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
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
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <div className="empty-state__title">{title}</div>
      {description && <p className="empty-state__desc">{description}</p>}
      {actions && (
        <div className="empty-state__actions">
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
      icon="🌱"
      title="Chưa có keyword nào"
      description="Nhập seed keyword ở trên và nhấn 'Tạo key long-form' để hệ thống tự động mở rộng thành nhiều biến thể."
      actions={onExpand ? [{ label: 'Xem seed mặc định', onClick: onExpand, variant: 'primary', icon: '✨' }] : undefined}
    />
  );
}

export function NoYoutubeDataEmptyState({ onAnalyze }: { onAnalyze?: () => void }) {
  return (
    <EmptyState
      icon="📊"
      title="Chưa có dữ liệu YouTube"
      description="Phân tích keyword để xem dữ liệu view, kênh tham khảo, và cơ hội thị trường từ YouTube Data API."
      actions={onAnalyze ? [{ label: 'Phân tích ngay', onClick: onAnalyze, variant: 'primary', icon: '▶️' }] : undefined}
    />
  );
}

export function NoResultsFilterEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="Không có keyword phù hợp"
      description="Thử nới lỏng bộ lọc hoặc đặt lại để xem tất cả keyword."
      actions={[{ label: 'Xóa bộ lọc', onClick: onReset, variant: 'secondary', icon: '↺' }]}
      compact
    />
  );
}

export function NoWorkspaceEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon="📁"
      title="Chưa có workspace"
      description="Tạo workspace để tổ chức keyword theo chủ đề và thị trường."
      actions={[{ label: 'Tạo workspace đầu tiên', onClick: onCreate, variant: 'primary', icon: '✨' }]}
    />
  );
}
