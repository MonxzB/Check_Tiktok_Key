import React from 'react';
import { NICHES } from '../engine/constants.js';

export default function FilterBar({ filters, setFilters, onReset }) {
  function update(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  return (
    <section className="card">
      <h2><span className="icon">🔍</span> Bộ lọc Long-Form</h2>
      <div className="filter-bar">
        <div className="filter-group">
          <label>Điểm Long-Form tối thiểu</label>
          <input type="number" value={filters.minScore} min={0} max={100} step={5}
            onChange={e => update('minScore', +e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Niche</label>
          <select value={filters.niche} onChange={e => update('niche', e.target.value)}>
            <option value="">Tất cả</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Cấp độ keyword</label>
          <select value={filters.level} onChange={e => update('level', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Broad">Broad</option>
            <option value="Mid-tail">Mid-tail</option>
            <option value="Long-tail">Long-tail</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Search Intent</label>
          <select value={filters.intent} onChange={e => update('intent', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="high">Cao (≥10)</option>
            <option value="med">Trung bình (5-9)</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Evergreen</label>
          <select value={filters.evergreen} onChange={e => update('evergreen', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="high">Cao (≥7)</option>
            <option value="low">Thấp (&lt;5)</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Rủi ro</label>
          <select value={filters.risk} onChange={e => update('risk', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="safe">An toàn (5)</option>
            <option value="risky">Rủi ro (&lt;3)</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Đề xuất</label>
          <select value={filters.rec} onChange={e => update('rec', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Rất đáng làm long video">Rất đáng làm</option>
            <option value="Có thể làm long video">Có thể làm</option>
            <option value="Test nhẹ long video">Test nhẹ</option>
            <option value="Cân nhắc">Cân nhắc</option>
            <option value="Bỏ qua">Bỏ qua</option>
          </select>
        </div>
        <button className="btn btn-secondary" style={{ alignSelf: 'flex-end' }} onClick={onReset}>
          ↺ Reset
        </button>
      </div>
    </section>
  );
}
