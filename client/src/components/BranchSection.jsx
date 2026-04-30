import React from 'react';

export default function BranchSection({ keywords }) {
  const broadKws = keywords.filter(k => k.level === 'Broad');
  const groups = broadKws.map(bk => ({
    bk,
    children: keywords
      .filter(k => k.keyword !== bk.keyword && k.keyword.startsWith(bk.keyword))
      .sort((a, b) => b.longFormScore - a.longFormScore)
      .slice(0, 8),
  })).filter(g => g.children.length > 0);

  if (!groups.length) return null;

  return (
    <section className="card">
      <h2><span className="icon">🌿</span> Key nhánh từ key broad</h2>
      <div className="branch-list">
        {groups.map(({ bk, children }) => (
          <div key={bk.keyword} className="branch-group">
            <h4>{bk.keyword}</h4>
            <ul>
              {children.map(c => (
                <li key={c.keyword}>
                  <span className="jp-text">{c.keyword}</span>{' '}
                  <span className={`score-badge ${c.longFormScore >= 70 ? 'score-high' : c.longFormScore >= 55 ? 'score-med' : 'score-low'}`}
                    style={{ fontSize: '0.68rem' }}>
                    {c.longFormScore}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
