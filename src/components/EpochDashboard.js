import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@chakra-ui/react';
import useEpochInfo from '../hooks/useEpochInfo';

const STAT_DEFINITIONS = [
  { label: 'Current Epoch', key: 'current_epoch', clickable: true },
  { label: 'Current Block', key: 'current_block' },
  { label: 'Blocks per Epoch', key: 'blocks_per_epoch' },
  { label: 'Validators per Epoch', key: 'validators_per_epoch' },
  { label: 'Blocks Until Next Epoch', key: 'blocks_until_next_epoch' },
];

function EpochDashboard() {
  const navigate = useNavigate();
  const { epochInfo, isInitialLoad } = useEpochInfo();

  if (isInitialLoad || !epochInfo) {
    return (
      <section className="explorer-home__stats-grid" aria-label="Epoch stats">
        {STAT_DEFINITIONS.map((stat) => (
          <div key={stat.label} className="explorer-home__stat-card">
            <span className="explorer-home__stat-label">
              <Skeleton height="10px" width="120px" />
            </span>
            <strong className="explorer-home__stat-value">
              <Skeleton height="30px" width="80px" display="block" mt={2} />
            </strong>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="explorer-home__stats-grid" aria-label="Epoch stats">
      {STAT_DEFINITIONS.map((stat) => (
        <div
          key={stat.label}
          className={`explorer-home__stat-card${stat.clickable ? ' explorer-home__stat-card--clickable' : ''}`}
          onClick={stat.clickable ? () => navigate('/epoch/current') : undefined}
        >
          <span className="explorer-home__stat-label">{stat.label}</span>
          <strong className="explorer-home__stat-value">{epochInfo[stat.key]}</strong>
        </div>
      ))}
    </section>
  );
}

export default EpochDashboard;
