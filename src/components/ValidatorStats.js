import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, HStack, Stat, StatLabel, StatNumber, Skeleton } from '@chakra-ui/react';
import useValidators from '../hooks/useValidators';
import useCapacityProviders from '../hooks/useCapacityProviders';
import useVerifiedProofRewardsSum from '../hooks/useVerifiedProofRewardsSum';
import { formatELDAmount } from '../utils/formatAmount';
import AsciiBox from './AsciiBox';
import { BOX_BG_COLOR, DARK_TEXT_COLOR, BORDER_RADIUS } from '../constants';

function ValidatorStats() {
  const navigate = useNavigate();
  const { validators, loading: validatorsLoading, isInitialLoad: validatorsInitialLoad } = useValidators();
  const { allProviders, loading: providersLoading, isInitialLoad: providersInitialLoad } = useCapacityProviders();
  const { totalRewards, loading: rewardsSumLoading, error: rewardsSumError, isInitialLoad: rewardsInitialLoad } = useVerifiedProofRewardsSum();

  const isInitialLoad = validatorsInitialLoad || providersInitialLoad;

  if (isInitialLoad) {
    return (
      <AsciiBox
        className="explorer-home__card explorer-home__card--validators"
        p={4}
        bg={BOX_BG_COLOR}
        borderRadius={BORDER_RADIUS}
        transition="all 0.2s"
        boxShadow="sm"
      >
        <HStack className="explorer-home__stats-row" spacing={{ base: 3, md: 8 }} justify="space-between" w="100%" flexWrap={{ base: 'wrap', lg: 'nowrap' }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box
              key={index}
              flex={{ base: index === 2 ? '1 1 100%' : '1 1 calc(50% - 6px)', lg: 1 }}
              minW={0}
            >
              <Stat>
                <StatLabel className="explorer-home__stat-label" color={DARK_TEXT_COLOR}>
                  <Skeleton height="10px" width="140px" />
                </StatLabel>
                <Skeleton height="32px" width="80px" mt={2} />
              </Stat>
            </Box>
          ))}
        </HStack>
      </AsciiBox>
    );
  }

  return (
    <AsciiBox
      className="explorer-home__card explorer-home__card--validators"
      p={4}
      bg={BOX_BG_COLOR}
      borderRadius={BORDER_RADIUS}
      transition="all 0.2s"
      boxShadow="sm"
    >
      <HStack className="explorer-home__stats-row" spacing={{ base: 3, md: 8 }} justify="space-between" w="100%" flexWrap={{ base: 'wrap', lg: 'nowrap' }}>
        <Box
          flex={{ base: '1 1 calc(50% - 6px)', lg: 1 }}
          minW={0}
          cursor="pointer"
          onClick={() => navigate('/validators')}
          _hover={{ opacity: 0.8 }}
          transition="all 0.2s"
        >
          <Stat>
            <StatLabel className="explorer-home__stat-label" color={DARK_TEXT_COLOR}>Chain Validators</StatLabel>
            {validatorsLoading ? (
              <Skeleton height="32px" width="80px" />
            ) : (
              <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono" color={DARK_TEXT_COLOR}>{validators.length}</StatNumber>
            )}
          </Stat>
        </Box>
        <Box
          flex={{ base: '1 1 calc(50% - 6px)', lg: 1 }}
          minW={0}
          cursor="pointer"
          onClick={() => navigate('/validators?tab=capacity')}
          _hover={{ opacity: 0.8 }}
          transition="all 0.2s"
        >
          <Stat>
            <StatLabel className="explorer-home__stat-label" color={DARK_TEXT_COLOR}>Capacity Providers</StatLabel>
            {providersLoading ? (
              <Skeleton height="32px" width="80px" />
            ) : (
              <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono" color={DARK_TEXT_COLOR}>{allProviders.length}</StatNumber>
            )}
          </Stat>
        </Box>
        <Box
          className="explorer-home__stat-cell explorer-home__stat-cell--wide"
          flex={{ base: '1 1 100%', lg: 1 }}
          minW={0}
          cursor="pointer"
          onClick={() => navigate('/validators?tab=capacity')}
          _hover={{ opacity: 0.8 }}
          transition="all 0.2s"
        >
          <Stat>
            <StatLabel className="explorer-home__stat-label" color={DARK_TEXT_COLOR}>
              Total reward for capacity providers
            </StatLabel>
            {rewardsSumLoading && rewardsInitialLoad ? (
              <Skeleton height="32px" width="120px" />
            ) : rewardsSumError || totalRewards == null || totalRewards === '' ? (
              <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono" color={DARK_TEXT_COLOR}>
                N/A
              </StatNumber>
            ) : (
              <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono" color={DARK_TEXT_COLOR}>
                {formatELDAmount(totalRewards)}
              </StatNumber>
            )}
          </Stat>
        </Box>
      </HStack>
    </AsciiBox>
  );
}

export default ValidatorStats;
