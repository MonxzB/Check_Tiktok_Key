import React, { useRef } from 'react';

export default function ActionBar({ onScore, onFilterToggle, onExport, onImport, onClear }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImport(ev.target.result);
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  return (
    <div className="action-bar">
      <button className="btn btn-primary" onClick={onScore}>📊 Chấm điểm lại</button>
      <button className="btn btn-secondary" onClick={onFilterToggle}>🎯 Lọc key đáng làm</button>
      <button className="btn btn-secondary" onClick={onExport}>📥 Xuất CSV</button>
      <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>📤 Nhập CSV</button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <button className="btn btn-danger" onClick={onClear}>🗑 Xoá tất cả</button>
    </div>
  );
}
