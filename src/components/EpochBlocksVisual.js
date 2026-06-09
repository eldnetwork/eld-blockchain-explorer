import React from 'react';
import { Box, HStack } from '@chakra-ui/react';
import AsciiBox from './AsciiBox';
import useEpochInfo from '../hooks/useEpochInfo';

function EpochBlocksVisual() {
  const { epochInfo, isInitialLoad } = useEpochInfo();

  if (isInitialLoad || !epochInfo) {
    return null;
  }

  const blocksRemaining = epochInfo.blocks_until_next_epoch || 0;
  const totalBlocks = 20; // Always show 20 boxes total
  const blocksToShow = Math.min(blocksRemaining, totalBlocks);

  return (
    <Box>
      <HStack spacing={1} flexWrap="wrap">
        {Array.from({ length: blocksToShow }).map((_, index) => (
          <AsciiBox
            key={index}
            p={1}
            minW="20px"
            h="20px"
            transition="all 0.3s"
          />
        ))}
      </HStack>
    </Box>
  );
}

export default EpochBlocksVisual;
