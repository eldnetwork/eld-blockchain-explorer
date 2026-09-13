import { useNavigate } from 'react-router-dom';
import { Skeleton, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
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
            <Stat>
              <StatLabel className="explorer-home__stat-label">
                <Skeleton height="10px" width="120px" />
              </StatLabel>
              <StatNumber
                className="explorer-home__stat-value"
                fontFamily="mono"
                transition="all 0.2s"
              >
                <Skeleton height="30px" width="80px" display="block" mt={2} />
              </StatNumber>
            </Stat>
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
          <Stat>
            <StatLabel className="explorer-home__stat-label">{stat.label}</StatLabel>
            <StatNumber
              className="explorer-home__stat-value"
              fontFamily="mono"
              transition="all 0.2s"
            >
              {epochInfo[stat.key]}
            </StatNumber>
          </Stat>
        </div>
      ))}
    </section>
  );
}

export default EpochDashboard;
