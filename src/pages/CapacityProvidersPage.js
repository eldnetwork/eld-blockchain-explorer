import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Heading, List, ListItem, HStack, Text, Skeleton, Badge, VStack, Link } from '@chakra-ui/react';
import useCapacityProviders from '../hooks/useCapacityProviders';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHardDrive } from '@fortawesome/free-solid-svg-icons';
import AsciiBox from '../components/AsciiBox';
import './ExplorerDataPages.css';

function CapacityProviderList({ providers, loading }) {
  if (loading) {
    return (
      <List spacing={3}>
        {Array(10).fill(0).map((_, index) => (
          <ListItem key={index}>
            <AsciiBox p={4}>
              <HStack spacing={4} w="full">
                <Skeleton height="20px" width="40px" />
                <Skeleton height="20px" width="300px" />
                <Skeleton height="20px" width="150px" />
              </HStack>
            </AsciiBox>
          </ListItem>
        ))}
      </List>
    );
  }

  if (providers.length === 0) {
    return <Box p={4}>No capacity providers found</Box>;
  }

  return (
    <List spacing={3}>
      {providers.map((provider, index) => (
        <ListItem key={provider.address || index} listStyleType="none" p={0}>
          <Link
            as={RouterLink}
            className="explorer-page__list-row-link"
            to={`/capacity-provider/${encodeURIComponent(provider.address)}`}
            display="block"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ textDecoration: 'none', opacity: 0.8 }}
          >
            <AsciiBox p={4} className="explorer-page__list-item">
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Badge className="explorer-page__index-badge" fontSize="sm">
                      #{index + 1}
                    </Badge>
                    {provider.address ? (
                      <Text fontWeight="semibold" fontSize="sm" className="explorer-page__body-text">
                        {`${provider.address.slice(0, 10)}...${provider.address.slice(-8)}`}
                      </Text>
                    ) : (
                      <Text fontWeight="semibold" fontSize="sm" className="explorer-page__body-text">
                        N/A
                      </Text>
                    )}
                  </HStack>
                  {provider.stake !== undefined && (
                    <Text fontSize="sm" className="explorer-page__muted">
                      Stake: {typeof provider.stake === 'number' ? provider.stake.toLocaleString() : provider.stake}
                    </Text>
                  )}
                </HStack>
                {provider.storage_capacity !== undefined && (
                  <Text fontSize="xs" className="explorer-page__muted">
                    Storage Capacity:{' '}
                    {typeof provider.storage_capacity === 'number'
                      ? provider.storage_capacity.toLocaleString()
                      : provider.storage_capacity}
                  </Text>
                )}
                {provider.chunk_count !== undefined && (
                  <Text fontSize="xs" className="explorer-page__muted">
                    Chunk Count:{' '}
                    {typeof provider.chunk_count === 'number' ? provider.chunk_count.toLocaleString() : provider.chunk_count}
                  </Text>
                )}
                {provider.merkle_root && (
                  <Text fontSize="xs" className="explorer-page__muted" isTruncated>
                    Merkle Root: {provider.merkle_root}
                  </Text>
                )}
                {provider.registered_at !== undefined && (
                  <Text fontSize="xs" className="explorer-page__muted">
                    Registered At: {provider.registered_at}
                  </Text>
                )}
                {provider.registration_duration !== undefined && (
                  <Text fontSize="xs" className="explorer-page__muted">
                    Registration Duration:{' '}
                    {typeof provider.registration_duration === 'number'
                      ? provider.registration_duration.toLocaleString()
                      : provider.registration_duration}
                  </Text>
                )}
                {(() => {
                  const createdBlock =
                    provider.registered_at_block ??
                    provider.created_at_block ??
                    (typeof provider.registered_at === 'number'
                      ? provider.registered_at
                      : Number(provider.registered_at));
                  const duration = Number(provider.registration_duration);
                  const expirationBlock =
                    !Number.isNaN(createdBlock) && !Number.isNaN(duration) ? createdBlock + duration : null;
                  return expirationBlock != null ? (
                    <Text fontSize="xs" className="explorer-page__muted">
                      Expiration Block: {expirationBlock.toLocaleString()}
                    </Text>
                  ) : null;
                })()}
              </VStack>
            </AsciiBox>
          </Link>
        </ListItem>
      ))}
    </List>
  );
}

function CapacityProvidersPage() {
  const { 
    allProviders, 
    activeTotalStake, 
    activeTotalCapacity, 
    allTotalStake, 
    allTotalCapacity, 
    loading, 
    error 
  } = useCapacityProviders();

  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">← Explorer</Link>
        <Text className="explorer-page__crumb-sep">My Node</Text>
        <Text className="explorer-page__crumb-current">Capacity Providers</Text>
      </HStack>

      <HStack spacing={2} mb={6}>
        <FontAwesomeIcon icon={faHardDrive} />
        <Heading as="h1" className="explorer-page__title" m={0}>
          CAPACITY PROVIDERS
        </Heading>
      </HStack>

      {error ? (
        <Box p={4} className="explorer-page__state--error">Error: {error}</Box>
      ) : (
        <>
          {(activeTotalStake > 0 || activeTotalCapacity > 0 || allTotalStake > 0 || allTotalCapacity > 0) && (
            <VStack align="stretch" spacing={2} mb={4}>
              {allTotalStake > 0 && (
                <AsciiBox p={3} className="explorer-page__card">
                  <Text fontSize="sm" className="explorer-page__summary-line">
                    Total Stake: {typeof allTotalStake === 'number' ? allTotalStake.toLocaleString() : allTotalStake}
                  </Text>
                </AsciiBox>
              )}
              {allTotalCapacity > 0 && (
                <AsciiBox p={3} className="explorer-page__card">
                  <Text fontSize="sm" className="explorer-page__summary-line">
                    Total Capacity: {typeof allTotalCapacity === 'number' ? allTotalCapacity.toLocaleString() : allTotalCapacity}
                  </Text>
                </AsciiBox>
              )}
            </VStack>
          )}
          <CapacityProviderList providers={allProviders} loading={loading} />
        </>
      )}
    </Box>
  );
}

export default CapacityProvidersPage;
