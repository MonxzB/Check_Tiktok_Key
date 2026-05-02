// ============================================================
// components/CalendarErrorBoundary.tsx — Error boundary for calendar
// ============================================================
import React from 'react';

interface State { hasError: boolean; error?: Error }

export default class CalendarErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Content Calendar gặp lỗi
          </div>
          <p style={{ fontSize: '0.82rem', maxWidth: 380, margin: '0 auto 16px' }}>
            {this.state.error?.message ?? 'Lỗi không xác định.'}
          </p>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
            onClick={() => this.setState({ hasError: false })}
          >
            🔄 Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
