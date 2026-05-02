import React, { useRef } from 'react';

interface ActionBarProps {
  onScore: () => void;
  onFilterToggle: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
  onClear: () => void;
  showFilter?: boolean;
}

export default function ActionBar({ onScore, onFilterToggle, onExport, onImport, onClear, showFilter }: ActionBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) onImport(ev.target.result as string); };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  return (
    <div className="action-bar">
      <button className="btn btn-primary" onClick={onScore} data-tooltip="Tính lại điểm cho tất cả keyword">
        📊 Chấm điểm lại
      </button>
      <button className="btn btn-secondary" onClick={onFilterToggle}
        data-tooltip="Shift+F — Lọc keyword có điểm ≥70"
        style={showFilter ? { borderColor: '#00e5ff', color: '#00e5ff' } : {}}>
        🎯 Lọc key đáng làm
        {showFilter && <span className="ml-1 text-[0.7rem] opacity-70">✓</span>}
      </button>
      <button className="btn btn-secondary" onClick={onExport} data-tooltip="Xuất keyword sang CSV">
        📥 Xuất CSV
      </button>
      <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} data-tooltip="Nhập keyword từ file CSV">
        📤 Nhập CSV
      </button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <button className="btn btn-danger" onClick={onClear} data-tooltip="Xóa tất cả keyword trong workspace">
        🗑 Xoá tất cả
      </button>

      {/* Keyboard hint */}
      <span className="ml-auto text-[0.72rem] text-text-muted flex items-center gap-1.5">
        <span className="kbd">Shift+F</span> lọc
        {showFilter && <><span className="kbd">R</span> reset</>}
      </span>
    </div>
  );
}
