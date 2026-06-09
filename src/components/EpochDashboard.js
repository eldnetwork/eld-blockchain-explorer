import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, HStack, Stat, StatLabel, StatNumber, Skeleton } from '@chakra-ui/react';
import AsciiBox from './AsciiBox';
import { BORDER_RADIUS } from '../constants';
import useEpochInfo from '../hooks/useEpochInfo';

function EpochDashboard() {
  const navigate = useNavigate();
  const { epochInfo, isInitialLoad } = useEpochInfo();

  if (isInitialLoad || !epochInfo) {
    return (
      <AsciiBox
        className="explorer-home__card explorer-home__card--stats"
        p={5}
        borderRadius={BORDER_RADIUS}
        boxShadow="sm"
      >
        <HStack className="explorer-home__stats-row" spacing={{ base: 3, md: 10 }} justify="space-between" align="flex-end" w="100%" flexWrap={{ base: 'wrap', xl: 'nowrap' }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Box key={index} minW={0} flex={{ base: '1 1 calc(50% - 6px)', xl: 1 }}>
            <Stat>
              <StatLabel className="explorer-home__stat-label">
                <Skeleton height="10px" width="120px" />
              </StatLabel>
              <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono" mt={2}>
                <Box pt={1}>
                  <Skeleton height="30px" width="80px" />
                </Box>
              </StatNumber>
            </Stat>
            </Box>
          ))}
        </HStack>
      </AsciiBox>
    );
  }

  return (
    <AsciiBox
      className="explorer-home__card explorer-home__card--stats"
      p={4}
      borderRadius={BORDER_RADIUS}
      boxShadow="sm"
    >
      <HStack className="explorer-home__stats-row" spacing={{ base: 3, md: 8 }} justify="space-between" align="flex-end" w="100%" flexWrap={{ base: 'wrap', xl: 'nowrap' }}>
        <Box
          flex={{ base: '1 1 calc(50% - 6px)', xl: 1 }}
          minW={0}
          cursor="pointer"
          onClick={() => navigate('/epoch/current')}
          _hover={{ opacity: 0.8 }}
          transition="all 0.2s"
        >
          <Stat>
            <StatLabel className="explorer-home__stat-label">Current Epoch</StatLabel>
            <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono">{epochInfo.current_epoch}</StatNumber>
          </Stat>
        </Box>
        <Box minW={0} flex={{ base: '1 1 calc(50% - 6px)', xl: 1 }}>
          <Stat>
            <StatLabel className="explorer-home__stat-label">Current Block</StatLabel>
            <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono">{epochInfo.current_block}</StatNumber>
          </Stat>
        </Box>
        <Box minW={0} flex={{ base: '1 1 calc(50% - 6px)', xl: 1 }}>
          <Stat>
            <StatLabel className="explorer-home__stat-label">Blocks per Epoch</StatLabel>
            <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono">{epochInfo.blocks_per_epoch}</StatNumber>
          </Stat>
        </Box>
        <Box minW={0} flex={{ base: '1 1 calc(50% - 6px)', xl: 1 }}>
          <Stat>
            <StatLabel className="explorer-home__stat-label">Validators per Epoch</StatLabel>
            <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono">{epochInfo.validators_per_epoch}</StatNumber>
          </Stat>
        </Box>
        <Box minW={0} flex={{ base: '1 1 calc(50% - 6px)', xl: 1 }}>
          <Stat>
            <StatLabel className="explorer-home__stat-label">Blocks Until Next Epoch</StatLabel>
            <StatNumber className="explorer-home__stat-value" transition="all 0.2s" fontFamily="mono">{epochInfo.blocks_until_next_epoch}</StatNumber>
          </Stat>
        </Box>
      </HStack>
    </AsciiBox>
  );
}

export default EpochDashboard;
