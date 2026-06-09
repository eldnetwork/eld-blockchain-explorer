import React, { useState } from 'react';
import './NewHomeExplorerPage.css';

const topStats = [
  { label: 'Block Height', value: '1,247,839', trend: '+12/min' },
  { label: 'Transactions', value: '8,421,094', trend: '-1.2k/hr' },
  { label: 'Active Nodes', value: '3,847', trend: '+24' },
  { label: 'Network Storage', value: '2.4 PB', trend: '+18 TB' },
];

const blocks = [
  { height: '1,247,839', hash: '0x3a7f...e92b', txCount: '42 txns', age: '2s ago' },
  { height: '1,247,838', hash: '0x8c2d...f41a', txCount: '38 txns', age: '4s ago' },
  { height: '1,247,837', hash: '0x7f1a...c911', txCount: '55 txns', age: '6s ago' },
];

const transactions = [
  { hash: '0xa1b2...c3d4', type: 'TRANSFER', route: 'eld1q9...x4nm -> eld1r7...k8pq', amount: '125.50 ELD', age: '5s ago' },
  { hash: '0xe5f6...g7h8', type: 'STAKE', route: 'eld1m3...v2ht -> eld1j5...n9ws', amount: '1,000.00 ELD', age: '12s ago' },
  { hash: '0xi9j0...k1l2', type: 'TRANSFER', route: 'eld1e2...m4tp -> eld1z8...p0na', amount: '42.75 ELD', age: '18s ago' },
];

function NewHomeExplorerPage() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="new-home-explorer">
      <div className="new-home-explorer__grid" />

      <header className="new-home-explorer__header">
        <div className="new-home-explorer__brand">
          <div className="new-home-explorer__brand-mark">E</div>
          <div className="new-home-explorer__brand-text">
            <span className="new-home-explorer__brand-name">ELD</span>
            <span className="new-home-explorer__brand-divider">{'//'}</span>
            <span className="new-home-explorer__brand-subtitle">NETWORK</span>
          </div>
        </div>

        <nav className="new-home-explorer__nav" aria-label="Explorer navigation">
          <a href="/" className="new-home-explorer__nav-link">Home</a>
          <a href="/new_home_explorer" className="new-home-explorer__nav-link new-home-explorer__nav-link--active">Explorer</a>
          <a href="/new_docs" className="new-home-explorer__nav-link">Docs</a>
          <a href="#my-node" className="new-home-explorer__nav-link">My Node</a>
        </nav>

        <a href="#my-node" className="new-home-explorer__follow">X Follow</a>
      </header>

      <main className="new-home-explorer__content">
        <section className="new-home-explorer__hero">
          <h1 className="new-home-explorer__title">Block Explorer</h1>
          <p className="new-home-explorer__subtitle">
            Explore blocks, transactions, and network activity on Eld testnet
          </p>
          <div className="new-home-explorer__search-row">
            <span className="new-home-explorer__search-icon" aria-hidden="true">⌕</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by block hash, transaction, or address..."
              aria-label="Explorer search"
            />
          </div>
        </section>

        <section className="new-home-explorer__top-stats">
          {topStats.map((item) => (
            <article key={item.label} className="new-home-explorer__top-stat">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <em>{item.trend}</em>
            </article>
          ))}
        </section>

        <section className="new-home-explorer__lists">
          <article className="new-home-explorer__panel">
            <header className="new-home-explorer__panel-header">
              <h2>Recent Blocks</h2>
            </header>
            <div className="new-home-explorer__panel-list">
              {blocks.map((block) => (
                <div key={block.height} className="new-home-explorer__row">
                  <div className="new-home-explorer__row-main">
                    <strong>#{block.height}</strong>
                    <span>{block.hash}</span>
                  </div>
                  <div className="new-home-explorer__row-meta">
                    <strong>{block.txCount}</strong>
                    <span>{block.age}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="new-home-explorer__panel">
            <header className="new-home-explorer__panel-header">
              <h2>Recent Transactions</h2>
            </header>
            <div className="new-home-explorer__panel-list">
              {transactions.map((tx) => (
                <div key={tx.hash} className="new-home-explorer__row">
                  <div className="new-home-explorer__row-main">
                    <div className="new-home-explorer__tx-topline">
                      <strong>{tx.hash}</strong>
                      <span className="new-home-explorer__type-pill">{tx.type}</span>
                    </div>
                    <span>{tx.route}</span>
                  </div>
                  <div className="new-home-explorer__row-meta">
                    <strong>{tx.amount}</strong>
                    <span>{tx.age}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default NewHomeExplorerPage;
