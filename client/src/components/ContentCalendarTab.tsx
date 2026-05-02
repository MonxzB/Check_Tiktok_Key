// ============================================================
// components/ContentCalendarTab.tsx — Phase 13: Content Calendar
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import type { Keyword } from '../types';
import {
  generateCalendar, applyOverrides, exportCalendarMd,
  saveEntryStatus, saveEntryNote, saveEntryTitle, saveEntryDate,
} from '../engine/contentCalendar.ts';
import type { CalendarEntry, CalendarOptions, PostFrequency, ContentCalendar } from '../engine/contentCalendar.ts';

interface ContentCalendarTabProps {
  keywords: Keyword[];
}

const STATUS_COLORS: Record<CalendarEntry['status'], string> = {
  planned:     'rgba(0,229,255,0.12)',
  'in-progress': 'rgba(255,234,0,0.12)',
  published:   'rgba(0,230,118,0.12)',
  skipped:     'rgba(255,255,255,0.04)',
};
const STATUS_BORDER: Record<CalendarEntry['status'], string> = {
  planned:     'rgba(0,229,255,0.3)',
  'in-progress': 'rgba(255,234,0,0.3)',
  published:   'rgba(0,230,118,0.3)',
  skipped:     'rgba(255,255,255,0.08)',
};
const STATUS_LABELS: Record<CalendarEntry['status'], string> = {
  planned:     '📋 Kế hoạch',
  'in-progress': '🎬 Đang làm',
  published:   '✅ Đã đăng',
  skipped:     '⏭ Bỏ qua',
};
const PRIORITY_BADGE: Record<CalendarEntry['priority'], string> = {
  urgent: '🔴',
  high:   '🟠',
  medium: '🟡',
  low:    '⚪',
};

// Safe: handles both Date object and ISO string (from JSON round-trips)
function toDate(val: Date | string | undefined): Date {
  if (!val) return new Date();
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatDate(d: Date | string | undefined): string {
  return toDate(d).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

// ── Entry Card ────────────────────────────────────────────────
function EntryCard({ entry, onUpdate }: {
  entry: CalendarEntry;
  onUpdate: (id: string, patch: Partial<CalendarEntry>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(entry.customTitle ?? entry.title);
  const [notes, setNotes]     = useState(entry.userNotes ?? '');

  const dateStr = entry.customDate
    ? formatDate(new Date(entry.customDate))
    : formatDate(toDate(entry.suggestedDate));

  function handleStatusCycle() {
    const cycle: CalendarEntry['status'][] = ['planned', 'in-progress', 'published', 'skipped'];
    const next = cycle[(cycle.indexOf(entry.status) + 1) % cycle.length];
    saveEntryStatus(entry.id, next);
    onUpdate(entry.id, { status: next });
  }

  function handleSaveEdit() {
    saveEntryTitle(entry.id, title);
    saveEntryNote(entry.id, notes);
    onUpdate(entry.id, { customTitle: title, userNotes: notes });
    setEditing(false);
  }

  const isSkipped = entry.status === 'skipped';

  return (
    <div style={{
      background: STATUS_COLORS[entry.status],
      border: `1px solid ${STATUS_BORDER[entry.status]}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
      opacity: isSkipped ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{PRIORITY_BADGE[entry.priority]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--text)' }}>
            {entry.customTitle ?? entry.title}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {dateStr} · <span style={{ color: 'var(--accent)', fontSize: '0.72rem' }}>{entry.keyword.keyword}</span>
            {' '}· Score <strong style={{ color: entry.estimatedScore >= 70 ? 'var(--green)' : 'var(--yellow)' }}>{entry.estimatedScore}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setEditing(!editing)}
            style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✏️
          </button>
          <button
            onClick={handleStatusCycle}
            style={{
              padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer',
              background: STATUS_COLORS[entry.status], border: `1px solid ${STATUS_BORDER[entry.status]}`,
              color: 'var(--text)', whiteSpace: 'nowrap',
            }}
          >
            {STATUS_LABELS[entry.status]}
          </button>
        </div>
      </div>

      {/* Chapters preview */}
      {!isSkipped && entry.chapters.length > 0 && !editing && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {entry.chapters.slice(0, 3).map((ch, i) => (
            <span key={i} style={{ fontSize: '0.7rem', padding: '1px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, color: 'var(--text-muted)' }}>
              {i + 1}. {ch.length > 30 ? ch.slice(0, 29) + '…' : ch}
            </span>
          ))}
          {entry.chapters.length > 3 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '1px 6px' }}>+{entry.chapters.length - 3}</span>
          )}
        </div>
      )}

      {/* Edit panel */}
      {editing && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Custom title..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text)', padding: '6px 10px', fontSize: '0.82rem', boxSizing: 'border-box' }}
          />
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ghi chú (ý tưởng thumbnail, hook, CTA...)"
            rows={2}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text)', padding: '6px 10px', fontSize: '0.8rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '0.78rem' }} onClick={handleSaveEdit}>💾 Lưu</button>
            <button className="btn btn-secondary" style={{ padding: '5px 14px', fontSize: '0.78rem' }} onClick={() => setEditing(false)}>Hủy</button>
          </div>
        </div>
      )}

      {/* User notes preview */}
      {!editing && (entry.userNotes) && (
        <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 5 }}>
          💬 {entry.userNotes}
        </div>
      )}
    </div>
  );
}

// ── Week Column ───────────────────────────────────────────────
function WeekColumn({ week, onUpdate }: {
  week: ContentCalendar['weeks'][0];
  onUpdate: (id: string, patch: Partial<CalendarEntry>) => void;
}) {
  const published = week.entries.filter(e => e.status === 'published').length;
  const total = week.entries.length;

  return (
    <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 14, minWidth: 280, flex: '0 0 280px' }}>
      {/* Week header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tuần {week.weekNumber}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatDate(week.startDate)} – {formatDate(week.endDate)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: published === total ? 'var(--green)' : 'var(--text-muted)' }}>
            {published}/{total} video
          </div>
          {/* Progress bar */}
          <div style={{ width: 60, height: 4, background: 'var(--glass-border)', borderRadius: 2, marginTop: 4 }}>
            <div style={{ width: `${total > 0 ? (published / total) * 100 : 0}%`, height: '100%', background: 'var(--green)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>
      {/* Entries */}
      {week.entries.map(e => (
        <EntryCard key={e.id} entry={e} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────
function CalendarSettings({ options, onChange }: {
  options: CalendarOptions;
  onChange: (patch: Partial<CalendarOptions>) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', marginBottom: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tần suất</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {([1, 2, 3, 4] as PostFrequency[]).map(f => (
            <button
              key={f}
              onClick={() => onChange({ frequency: f })}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer',
                background: options.frequency === f ? 'var(--accent)' : 'var(--glass)',
                border: `1px solid ${options.frequency === f ? 'var(--accent)' : 'var(--glass-border)'}`,
                color: options.frequency === f ? '#000' : 'var(--text)',
                fontWeight: options.frequency === f ? 700 : 400,
              }}
            >
              {f}x/tuần
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Điểm tối thiểu</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {[50, 60, 70, 80].map(s => (
            <button
              key={s}
              onClick={() => onChange({ minScore: s })}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer',
                background: options.minScore === s ? 'rgba(0,229,255,0.12)' : 'var(--glass)',
                border: `1px solid ${options.minScore === s ? 'var(--accent)' : 'var(--glass-border)'}`,
                color: options.minScore === s ? 'var(--accent)' : 'var(--text)',
              }}
            >
              ≥{s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Số tuần</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {[4, 8, 12].map(w => (
            <button
              key={w}
              onClick={() => onChange({ maxWeeks: w })}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer',
                background: options.maxWeeks === w ? 'rgba(0,229,255,0.12)' : 'var(--glass)',
                border: `1px solid ${options.maxWeeks === w ? 'var(--accent)' : 'var(--glass-border)'}`,
                color: options.maxWeeks === w ? 'var(--accent)' : 'var(--text)',
              }}
            >
              {w} tuần
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Summary Stats ─────────────────────────────────────────────
function CalendarStats({ cal }: { cal: ContentCalendar }) {
  const allEntries = cal.weeks.flatMap(w => w.entries);
  const published  = allEntries.filter(e => e.status === 'published').length;
  const inProgress = allEntries.filter(e => e.status === 'in-progress').length;
  const urgent     = allEntries.filter(e => e.priority === 'urgent').length;
  const avgScore   = allEntries.length
    ? Math.round(allEntries.reduce((s, e) => s + e.estimatedScore, 0) / allEntries.length)
    : 0;

  const chips = [
    { label: 'Tổng video', value: cal.totalEntries, color: 'var(--accent)' },
    { label: 'Đã đăng', value: published, color: 'var(--green)' },
    { label: 'Đang làm', value: inProgress, color: 'var(--yellow)' },
    { label: 'Ưu tiên cao', value: urgent, color: 'var(--orange)' },
    { label: 'Avg Score', value: avgScore, color: 'var(--text)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      {chips.map(c => (
        <div key={c.label} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: c.color }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ContentCalendarTab({ keywords }: ContentCalendarTabProps) {
  const [options, setOptions] = useState<CalendarOptions>({
    frequency: 2,
    lang: 'ja',
    minScore: 60,
    maxWeeks: 8,
  });

  // Mutable entries state (overrides applied on top of generated calendar)
  const [overrides, setOverrides] = useState<Map<string, Partial<CalendarEntry>>>(new Map());

  const rawCalendar = useMemo(() => {
    if (!keywords.length) return null;
    try {
      return generateCalendar(keywords, options);
    } catch (err) {
      console.error('[ContentCalendar] generateCalendar failed:', err);
      return null;
    }
  }, [keywords, options]);

  const calendar = useMemo(() => {
    if (!rawCalendar) return null;
    const withSaved = applyOverrides(rawCalendar);
    // Apply in-memory overrides on top
    return {
      ...withSaved,
      weeks: withSaved.weeks.map(w => ({
        ...w,
        entries: w.entries.map(e => ({
          ...e,
          ...(overrides.get(e.id) ?? {}),
        })),
      })),
    };
  }, [rawCalendar, overrides]);

  const handleUpdate = useCallback((id: string, patch: Partial<CalendarEntry>) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(id, { ...(next.get(id) ?? {}), ...patch });
      return next;
    });
  }, []);

  function handleExportMd() {
    if (!calendar) return;
    const md = exportCalendarMd(calendar);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'content-calendar.md'; a.click();
    URL.revokeObjectURL(url);
  }

  // Empty state
  if (!keywords.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📅</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Chưa có keyword nào</div>
        <p style={{ fontSize: '0.85rem', maxWidth: 360, margin: '0 auto' }}>
          Nhập seed keyword ở tab <strong>Long-Form Keywords</strong> và chấm điểm trước khi tạo lịch đăng bài.
        </p>
      </div>
    );
  }

  const eligible = keywords.filter(k => k.longFormScore >= options.minScore).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>📅 Content Calendar</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {eligible} keyword đủ điều kiện · {calendar?.totalEntries ?? 0} slot được lên lịch
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={handleExportMd}>
            📄 Xuất Markdown
          </button>
        </div>
      </div>

      {/* Settings */}
      <CalendarSettings options={options} onChange={patch => setOptions(o => ({ ...o, ...patch }))} />

      {/* Stats */}
      {calendar && <CalendarStats cal={calendar} />}

      {/* Calendar scroll */}
      {calendar && calendar.weeks.length > 0 ? (
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
            {calendar.weeks.map(week => (
              <WeekColumn key={week.weekNumber} week={week} onUpdate={handleUpdate} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--glass)', borderRadius: 12, border: '1px dashed var(--glass-border)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>😶</div>
          <p>Không có keyword nào đạt điểm ≥{options.minScore}. Hãy giảm điểm tối thiểu xuống.</p>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>🔴 Urgent (≥85)</span>
        <span>🟠 High (70-84)</span>
        <span>🟡 Medium (55-69)</span>
        <span>⚪ Low (&lt;55)</span>
        <span style={{ marginLeft: 'auto' }}>Click badge để đổi trạng thái · Click ✏️ để chỉnh tiêu đề</span>
      </div>
    </div>
  );
}
