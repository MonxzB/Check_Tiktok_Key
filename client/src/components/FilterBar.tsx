import React from 'react';
import type { KeywordFilters } from '../types';
import { NICHES } from '../engine/constants.js';
import CustomSelect from './CustomSelect.js';

interface FilterBarProps {
  filters: KeywordFilters;
  setFilters: React.Dispatch<React.SetStateAction<KeywordFilters>>;
  onReset: () => void;
}

export default function FilterBar({ filters, setFilters, onReset }: FilterBarProps) {
  function update<K extends keyof KeywordFilters>(key: K, val: KeywordFilters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  const nicheOpts   = [{ value: '', label: 'Tất cả Niche' }, ...NICHES.map(n => ({ value: n, label: n }))];
  const levelOpts   = [{ value: '', label: 'Tất cả' }, { value: 'Broad', label: 'Broad' }, { value: 'Mid-tail', label: 'Mid-tail' }, { value: 'Long-tail', label: 'Long-tail' }];
  const intentOpts  = [{ value: '', label: 'Tất cả' }, { value: 'high', label: 'Cao (≥10)' }, { value: 'med', label: 'Trung bình (5-9)' }];
  const evergreenOpts = [{ value: '', label: 'Tất cả' }, { value: 'high', label: 'Cao (≥7)' }, { value: 'low', label: 'Thấp (<5)' }];
  const riskOpts    = [{ value: '', label: 'Tất cả' }, { value: 'safe', label: 'An toàn (5)' }, { value: 'risky', label: 'Rủi ro (<3)' }];
  const recOpts     = [
    { value: '', label: 'Tất cả' },
    { value: 'Rất đáng làm long video', label: 'Rất đáng làm' },
    { value: 'Có thể làm long video', label: 'Có thể làm' },
    { value: 'Test nhẹ long video', label: 'Test nhẹ' },
    { value: 'Cân nhắc', label: 'Cân nhắc' },
    { value: 'Bỏ qua', label: 'Bỏ qua' },
  ];

  return (
    <section className="card">
      <h2><span className="icon">🔍</span> Bộ lọc Long-Form</h2>
      <div className="filter-bar">

        <div className="filter-group" style={{ flex: '1 1 120px', minWidth: 0 }}>
          <label>Điểm tối thiểu</label>
          <input type="number" value={filters.minScore} min={0} max={100} step={5}
            onChange={e => update('minScore', +e.target.value)} style={{ minWidth: 0 }} />
        </div>

        <div className="filter-group" style={{ flex: '2 1 150px', minWidth: 0 }}>
          <label>Niche</label>
          <CustomSelect value={filters.niche} onChange={v => update('niche', String(v ?? ''))} options={nicheOpts} placeholder="Tất cả Niche" />
        </div>

        <div className="filter-group" style={{ flex: '1 1 120px', minWidth: 0 }}>
          <label>Cấp độ</label>
          <CustomSelect value={filters.level} onChange={v => update('level', String(v ?? ''))} options={levelOpts} placeholder="Tất cả" />
        </div>

        <div className="filter-group" style={{ flex: '1 1 120px', minWidth: 0 }}>
          <label>Search Intent</label>
          <CustomSelect value={filters.intent} onChange={v => update('intent', String(v ?? ''))} options={intentOpts} placeholder="Tất cả" />
        </div>

        <div className="filter-group" style={{ flex: '1 1 120px', minWidth: 0 }}>
          <label>Evergreen</label>
          <CustomSelect value={filters.evergreen} onChange={v => update('evergreen', String(v ?? ''))} options={evergreenOpts} placeholder="Tất cả" />
        </div>

        <div className="filter-group" style={{ flex: '1 1 120px', minWidth: 0 }}>
          <label>Rủi ro</label>
          <CustomSelect value={filters.risk} onChange={v => update('risk', String(v ?? ''))} options={riskOpts} placeholder="Tất cả" />
        </div>

        <div className="filter-group" style={{ flex: '2 1 150px', minWidth: 0 }}>
          <label>Đề xuất</label>
          <CustomSelect value={filters.rec} onChange={v => update('rec', String(v ?? ''))} options={recOpts} placeholder="Tất cả" />
        </div>

        <button className="btn btn-secondary" style={{ alignSelf: 'flex-end', flexShrink: 0 }} onClick={onReset}>
          ↺ Reset
        </button>
      </div>
    </section>
  );
}
