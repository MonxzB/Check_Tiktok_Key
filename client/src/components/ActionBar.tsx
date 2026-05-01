import React, { useRef } from 'react';

interface ActionBarProps {
  onScore: () => void;
  onFilterToggle: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
  onClear: () => void;
}

export default function ActionBar({ onScore, onFilterToggle, onExport, onImport, onClear }: ActionBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) onImport(ev.target.result as string);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  return (
    <div className="action-bar">
      <button className="btn btn-primary" onClick={onScore}>📊 Chấm điểm lại</button>
      <button className="btn btn-secondary" onClick={onFilterToggle}>🎯 Lọc key đáng làm</button>
      <button className="btn btn-secondary" onClick={onExport}>📥 Xuất CSV</button>
      <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>📤 Nhập CSV</button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <button className="btn btn-danger" onClick={onClear}>🗑 Xoá tất cả</button>
    </div>
  );
}
