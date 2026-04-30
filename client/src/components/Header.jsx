import React from 'react';
import { APP_NOTICE } from '../engine/constants.js';

export default function Header() {
  return (
    <header className="header">
      <h1>🎌 YouTube Long-Form Key Finder</h1>
      <p>Tìm &amp; chấm điểm keyword YouTube long-form tiếng Nhật cho nội dung gốc</p>
      <div className="notice-banner">{APP_NOTICE}</div>
    </header>
  );
}
