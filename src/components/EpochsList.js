import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  List,
  ListItem,
  HStack,
  Text,
  Skeleton,
  VStack,
  Button,
} from '@chakra-ui/react';
import useEpochs from '../hooks/useEpochs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faCube } from '@fortawesome/free-solid-svg-icons';
import AsciiBox from './AsciiBox';
import { BORDER_RADIUS } from '../constants';

function EpochsList() {
  const epochsPerPage = 20;
  const {
    epochs,
    pagination,
    loading,
    error,
    isInitialLoad,
    activePage,
    pagerJumping,
    canGoOlder,
    canGoNewer,
    canGoFirst,
    canGoLast,
    goOlder,
    goNewer,
    goToFirst,
    goToLast,
  } = useEpochs(epochsPerPage, 'desc');
  const navigate = useNavigate();

  const pagerDisabled = loading || pagerJumping;

  const goToEpoch = (epoch) => {
    navigate(`/epoch/${epoch}`);
  };

  const goToBlock = (event, startBlock) => {
    event.stopPropagation();
    navigate(`/block/${startBlock}`);
  };

  const metaLabel =
    pagination.total != null ? (
      <>
        Page {activePage + 1}
        {' · '}
        {pagination.total.toLocaleString()} epochs
      </>
    ) : (
      <>Page {activePage + 1}</>
    );

  const pagerButtons = (
    <>
      <Button
        title="Newest epochs"
        className="explorer-home__pager-btn"
        onClick={goToFirst}
        disabled={!canGoFirst || pagerDisabled}
        variant="ghost"
        fontFamily="mono"
        bg="transparent"
        border="none"
        _hover={{ bg: 'transparent', color: 'white' }}
        _active={{ bg: 'transparent' }}
        sx={{ borderRadius: `${BORDER_RADIUS} !important` }}
      >
        |&lt;
      </Button>
      <Button
        title="More recent epochs"
        className="explorer-home__pager-btn"
        onClick={goNewer}
        disabled={!canGoNewer || pagerDisabled}
        variant="ghost"
        fontFamily="mono"
        bg="transparent"
        border="none"
        _hover={{ bg: 'transparent', color: 'white' }}
        _active={{ bg: 'transparent' }}
        sx={{ borderRadius: `${BORDER_RADIUS} !important` }}
      >
        &lt;&lt;
      </Button>
      <Button
        title="Older epochs"
        className="explorer-home__pager-btn"
        onClick={goOlder}
        disabled={!canGoOlder || pagerDisabled}
        variant="ghost"
        fontFamily="mono"
        bg="transparent"
        border="none"
        _hover={{ bg: 'transparent', color: 'white' }}
        _active={{ bg: 'transparent' }}
        sx={{ borderRadius: `${BORDER_RADIUS} !important` }}
      >
        &gt;&gt;
      </Button>
      <Button
        title="Oldest epochs"
        className="explorer-home__pager-btn"
        onClick={() => void goToLast()}
        disabled={!canGoLast || pagerDisabled}
        variant="ghost"
        fontFamily="mono"
        bg="transparent"
        border="none"
        _hover={{ bg: 'transparent', color: 'white' }}
        _active={{ bg: 'transparent' }}
        sx={{ borderRadius: `${BORDER_RADIUS} !important` }}
      >
        &gt;|
      </Button>
    </>
  );

  if (error) return <Box p={4} color="red.500">Error: {error}</Box>;
  if (!epochs.length && !loading) return <Box p={4}>No epoch records found</Box>;

  return (
    <Box className="explorer-home__list explorer-home__list--epochs" mt={4}>
      <HStack className="explorer-home__list-header" mb={4} justify="space-between" align="baseline">
        <Heading className="explorer-home__list-title" as="h2" size="lg" color="gray.700" lineHeight="1.2">
          Epochs{' '}
          <Text className="explorer-home__list-meta" as="span" fontSize="sm" display="inline">
            ({metaLabel})
          </Text>
        </Heading>
        <HStack className="explorer-home__pager" spacing={2}>
          {pagerButtons}
        </HStack>
      </HStack>
      <List className="explorer-home__list-body" spacing={3} mt={0} pt={0} style={{ marginTop: '-5px' }}>
        {isInitialLoad
          ? Array(epochsPerPage)
              .fill(0)
              .map((_, index) => (
                <ListItem key={index} transition="all 0.2s" _hover={{ opacity: 0.8 }}>
                  <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                    <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                      <HStack spacing={4} w="full" minW="0">
                        <Skeleton height="20px" width="20px" flexShrink={0} />
                        <Skeleton height="20px" flex="1" minW="0" />
                        <Skeleton height="20px" width="80px" flexShrink={0} />
                      </HStack>
                      <Skeleton height="20px" width="140px" />
                    </VStack>
                    <HStack spacing={4} w="full" justify="space-between" minW="0" display={{ base: 'none', md: 'flex' }}>
                      <HStack spacing={4} flex="1" minW="0">
                        <Skeleton height="20px" width="20px" flexShrink={0} />
                        <Skeleton height="20px" width="100px" />
                        <Skeleton height="20px" width="120px" />
                      </HStack>
                      <Skeleton height="20px" width="160px" flexShrink={0} />
                    </HStack>
                  </AsciiBox>
                </ListItem>
              ))
          : epochs.map((record) => {
              const epochNum = record.epoch;
              const startBlock = record.start_block;
              const validatorCount = record.active_validators?.length ?? 0;
              const providerCount = record.active_capacity_providers?.length ?? 0;
              const summary = `${validatorCount} validators · ${providerCount} providers`;

              return (
                <ListItem
                  key={epochNum}
                  onClick={() => goToEpoch(epochNum)}
                  cursor="pointer"
                  _hover={{ opacity: 0.8 }}
                  transition="all 0.2s"
                >
                  <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                    <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                      <HStack spacing={4} w="full" minW="0">
                        <FontAwesomeIcon icon={faLayerGroup} flexShrink={0} />
                        <Text className="explorer-home__epoch-number" fontWeight="semibold" flex="1" minW="0">
                          Epoch {epochNum}
                        </Text>
                        <HStack
                          spacing={1}
                          flexShrink={0}
                          onClick={(e) => goToBlock(e, startBlock)}
                          cursor="pointer"
                          title={`Block ${startBlock}`}
                        >
                          <FontAwesomeIcon icon={faCube} color="grey" flexShrink={0} />
                          <Text fontSize="sm" className="explorer-home__block-height">
                            {startBlock}
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" noOfLines={1}>
                        {summary}
                      </Text>
                    </VStack>
                    <HStack spacing={4} w="full" justify="space-between" minW="0" display={{ base: 'none', md: 'flex' }}>
                      <HStack spacing={4} flex="1" minW="0">
                        <FontAwesomeIcon icon={faLayerGroup} flexShrink={0} />
                        <Text className="explorer-home__epoch-number" fontWeight="semibold" flex="0 0 auto" minW="90px">
                          Epoch {epochNum}
                        </Text>
                        <HStack
                          spacing={1}
                          flex="0 0 auto"
                          onClick={(e) => goToBlock(e, startBlock)}
                          cursor="pointer"
                          title={`Start block ${startBlock}`}
                        >
                          <FontAwesomeIcon icon={faCube} color="grey" flexShrink={0} />
                          <Text fontSize="sm" className="explorer-home__block-height">
                            block {startBlock}
                          </Text>
                        </HStack>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" flexShrink={0} noOfLines={1} title={summary}>
                        {summary}
                      </Text>
                    </HStack>
                  </AsciiBox>
                </ListItem>
              );
            })}
      </List>
      <HStack className="explorer-home__pager explorer-home__pager--bottom" mt={4} justify="flex-end">
        {pagerButtons}
      </HStack>
    </Box>
  );
}

export default EpochsList;
