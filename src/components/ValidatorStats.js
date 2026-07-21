import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import useValidators from '../hooks/useValidators';
import useCapacityProviders from '../hooks/useCapacityProviders';
import useVerifiedProofRewardsSum from '../hooks/useVerifiedProofRewardsSum';
import { formatELDAmount } from '../utils/formatAmount';

const STAT_DEFINITIONS = [
  { label: 'Chain Validators', path: '/validators' },
  { label: 'Capacity Providers', path: '/validators?tab=capacity' },
  { label: 'Total reward for capacity providers', path: '/validators?tab=capacity' },
];

function ValidatorStats() {
  const navigate = useNavigate();
  const { validators, loading: validatorsLoading, isInitialLoad: validatorsInitialLoad } = useValidators();
  const { allProviders, loading: providersLoading, isInitialLoad: providersInitialLoad } = useCapacityProviders();
  const { totalRewards, loading: rewardsSumLoading, error: rewardsSumError, isInitialLoad: rewardsInitialLoad } = useVerifiedProofRewardsSum();

  const isInitialLoad = validatorsInitialLoad || providersInitialLoad;

  const renderStatValue = (index) => {
    if (index === 0) {
      if (validatorsLoading) {
        return <Skeleton height="32px" width="80px" mt={2} />;
      }
      return (
        <StatNumber className="explorer-home__stat-value" fontFamily="mono" transition="all 0.2s">
          {validators.length}
        </StatNumber>
      );
    }

    if (index === 1) {
      if (providersLoading) {
        return <Skeleton height="32px" width="80px" mt={2} />;
      }
      return (
        <StatNumber className="explorer-home__stat-value" fontFamily="mono" transition="all 0.2s">
          {allProviders.length}
        </StatNumber>
      );
    }

    if (rewardsSumLoading && rewardsInitialLoad) {
      return <Skeleton height="32px" width="120px" mt={2} />;
    }

    if (rewardsSumError || totalRewards == null || totalRewards === '') {
      return (
        <StatNumber className="explorer-home__stat-value" fontFamily="mono" transition="all 0.2s">
          N/A
        </StatNumber>
      );
    }

    return (
      <StatNumber className="explorer-home__stat-value" fontFamily="mono" transition="all 0.2s">
        {formatELDAmount(totalRewards)}
      </StatNumber>
    );
  };

  if (isInitialLoad) {
    return (
      <section className="explorer-home__stats-grid explorer-home__stats-grid--validators" aria-label="Validator stats">
        {STAT_DEFINITIONS.map((stat) => (
          <div key={stat.label} className="explorer-home__stat-card">
            <Stat>
              <StatLabel className="explorer-home__stat-label">
                <Skeleton height="10px" width="140px" />
              </StatLabel>
              <StatNumber className="explorer-home__stat-value" fontFamily="mono" transition="all 0.2s">
                <Skeleton height="32px" width="80px" display="block" mt={2} />
              </StatNumber>
            </Stat>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="explorer-home__stats-grid explorer-home__stats-grid--validators" aria-label="Validator stats">
      {STAT_DEFINITIONS.map((stat, index) => (
        <div
          key={stat.label}
          className="explorer-home__stat-card explorer-home__stat-card--clickable"
          onClick={() => navigate(stat.path)}
        >
          <Stat>
            <StatLabel className="explorer-home__stat-label">{stat.label}</StatLabel>
            {renderStatValue(index)}
          </Stat>
        </div>
      ))}
    </section>
  );
}

export default ValidatorStats;
