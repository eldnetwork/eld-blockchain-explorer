import React from 'react';
import './NewDocsPage.css';

const docGroups = [
  {
    title: 'Getting Started',
    items: ['Introduction', 'Quick Start', 'Installation'],
  },
  {
    title: 'Core Concepts',
    items: ['Architecture', 'Consensus', 'Storage Protocol', 'Content Addressing'],
  },
  {
    title: 'Node Operations',
    items: ['Running a Node', 'Configuration', 'Hardware Requirements', 'Monitoring'],
  },
  {
    title: 'ELD Token',
    items: ['Tokenomics', 'Staking', 'Rewards'],
  },
];

const featureBullets = [
  'Decentralized Storage - Files are content-addressed and distributed across thousands of nodes',
  'Device Agnostic - Run a node on your laptop, smartphone, or dedicated server',
  'Token Economy - ELD tokens power all transactions and incentivize honest participation',
  'Developer Friendly - Build decentralized apps with familiar tools and comprehensive APIs',
];

const architectureItems = [
  'Consensus Layer - Validates transactions and maintains network state',
  'Storage Layer - Handles permanent, distributed, content-addressed file storage',
  'Application Layer - Exposes APIs, SDKs, explorer tools, and node operations',
];

function NewDocsPage() {
  return (
    <div className="new-docs">
      <div className="new-docs__grid" />

      <header className="new-docs__header">
        <div className="new-docs__brand">
          <div className="new-docs__brand-mark">E</div>
          <div className="new-docs__brand-text">
            <span>ELD</span>
            <span>{'//'}</span>
            <span>NETWORK</span>
          </div>
        </div>

        <nav className="new-docs__nav" aria-label="New docs navigation">
          <a href="/" className="new-docs__nav-link">Home</a>
          <a href="/new_home_explorer" className="new-docs__nav-link">Explorer</a>
          <a href="/new_docs" className="new-docs__nav-link new-docs__nav-link--active">Docs</a>
          <a href="#node-ops" className="new-docs__nav-link">My Node</a>
        </nav>

        <a href="#community" className="new-docs__follow">X Follow</a>
      </header>

      <main className="new-docs__content">
        <aside className="new-docs__sidebar">
          {docGroups.map((group, groupIndex) => (
            <section key={group.title} className="new-docs__sidebar-group">
              <h2>
                <span className="new-docs__sidebar-icon">{groupIndex === 0 ? 'S' : groupIndex === 1 ? 'C' : groupIndex === 2 ? 'N' : 'T'}</span>
                {group.title}
              </h2>
              <div className="new-docs__sidebar-list">
                {group.items.map((item, itemIndex) => (
                  <a
                    key={item}
                    href={item === 'Running a Node' ? '#node-ops' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`new-docs__sidebar-item${groupIndex === 0 && itemIndex === 0 ? ' new-docs__sidebar-item--active' : ''}`}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <article className="new-docs__article">
          <div className="new-docs__breadcrumbs">
            <span>docs</span>
            <span>Getting Started</span>
            <span>Introduction</span>
          </div>

          <section id="introduction" className="new-docs__section">
            <h1>Introduction to Eld</h1>
            <p>
              Eld is a next-generation decentralized blockchain protocol designed for
              content-addressed storage and data sharing. The name comes from the Old
              Nordic word for "fire" - symbolizing the spark that ignites a new era of
              decentralized infrastructure.
            </p>
          </section>

          <section id="what-is-eld" className="new-docs__section">
            <h2>What is Eld?</h2>
            <p>
              Eld enables anyone with a compatible device to participate in a global
              storage network. By contributing disk space, participants earn ELD tokens
              while helping to secure and maintain the network.
            </p>
          </section>

          <section id="key-features" className="new-docs__section">
            <h2>Key Features</h2>
            <ul className="new-docs__bullet-list">
              {featureBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="architecture" className="new-docs__section">
            <h2>Architecture Overview</h2>
            <p>The Eld protocol consists of three primary layers:</p>
            <ol className="new-docs__number-list">
              {architectureItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <section id="node-ops" className="new-docs__section">
            <h2>Running a Node</h2>
            <p>
              Node operations are designed to feel lightweight and terminal-native. Install
              the CLI, initialize the node, allocate storage, and join the testnet with a
              minimal setup flow.
            </p>
            <div className="new-docs__callout">
              <div className="new-docs__callout-label">CLI</div>
              <pre>$ npm install -g @eld/cli{'\n'}$ eld init --testnet{'\n'}$ eld start</pre>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}

export default NewDocsPage;
