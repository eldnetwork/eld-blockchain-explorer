import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Link } from '@chakra-ui/react';
import './ExplorerFooter.css';

const footerColumns = [
  {
    heading: 'ELD',
    items: [
      { label: 'a decentralized blockchain protocol.' },
      { label: '/eld/ - old nordic word for fire.' },
    ],
  },
  {
    heading: 'Protocol',
    items: [
      { label: 'Intro', href: 'https://eld.network' },
      { label: 'Roadmap', href: 'https://docs.eld.network/roadmap' },
      { label: 'Documentation', href: 'https://docs.eld.network' },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { label: 'Eld Blockchain Explorer', href: 'https://explorer.eld.network' },
      { label: 'GitHub', href: 'https://github.com/eldnetwork' },
    ],
  },
  {
    heading: 'Community',
    items: [{ label: 'X / Twitter', href: 'https://x.com/eld_network' }],
  },
];

function ExplorerFooter() {
  return (
    <Box className="explorer-footer">
      <div className="explorer-footer__grid">
        {footerColumns.map((column) => (
          <div key={column.heading} className="explorer-footer__column">
            <h3>{column.heading}</h3>
            {column.items.map((item) => {
              if (item.to) {
                return (
                  <Link key={item.label} as={RouterLink} to={item.to} className="explorer-footer__item">
                    {item.label}
                  </Link>
                );
              }

              if (item.href) {
                return (
                  <Link key={item.label} href={item.href} isExternal className="explorer-footer__item">
                    {item.label}
                  </Link>
                );
              }

              return (
                <span key={item.label} className="explorer-footer__item">
                  {item.label}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="explorer-footer__bottom">
        <span>© 2026 ELD NETWORK. ALL RIGHTS RESERVED.</span>
        <span>TESTNET // SPRING 2026</span>
      </div>
    </Box>
  );
}

export default ExplorerFooter;

