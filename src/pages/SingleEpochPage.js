import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Text, HStack, Link, List, ListItem, VStack } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHardDrive, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import useEpoch from '../hooks/useEpoch';
import AsciiBox from '../components/AsciiBox';
import { normalizeAccountAddress } from '../utils/accountAddress';
import { formatELDAmount } from '../utils/formatAmount';
import './BlockPage.css';

const BYTES_PER_MB = 1024 * 1024;

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return 'N/A';
  if (bytes >= BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_MB).toLocaleString(undefined, { maximumFractionDigits: 2 })} MB`;
  }
  return bytes.toLocaleString();
}

function shortenAddress(address) {
  if (!address || address.length < 14) return address || 'N/A';
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

function CapacityProviderList({ providers, navigate, emptyLabel }) {
  if (!providers?.length) {
    return <Box p={4} color="gray.500">{emptyLabel}</Box>;
  }

  return (
    <List spacing={2}>
      {providers.map((provider) => (
        <ListItem
          key={provider.address}
          onClick={() => navigate(`/capacity-provider/${encodeURIComponent(provider.address)}`)}
          cursor="pointer"
          _hover={{ opacity: 0.9 }}
          transition="all 0.2s"
        >
          <AsciiBox p={3} className="explorer-record__tx-item">
            <VStack align="stretch" spacing={2}>
              <HStack spacing={3} justify="space-between" align="flex-start" minW="0">
                <HStack spacing={3} minW="0">
                  <FontAwesomeIcon icon={faHardDrive} />
                  <Text className="explorer-record__tx-hash" isTruncated title={provider.address}>
                    {shortenAddress(provider.address)}
                  </Text>
                </HStack>
                <Text className="explorer-record__tx-type">
                  Stake: {formatELDAmount(provider.stake)}
                </Text>
              </HStack>
              <HStack spacing={6} flexWrap="wrap" fontSize="xs" color="var(--lh-muted, rgba(243, 243, 240, 0.68))">
                <Text>Storage: {formatBytes(provider.storage_capacity)}</Text>
                <Text>Chunks: {provider.chunk_count?.toLocaleString?.() ?? provider.chunk_count ?? 'N/A'}</Text>
                <Text>Registered block: {provider.registered_block ?? 'N/A'}</Text>
              </HStack>
              {provider.merkle_root && (
                <Text fontSize="xs" className="explorer-record__mono" color="var(--lh-faint)">
                  Merkle: {provider.merkle_root}
                </Text>
              )}
            </VStack>
          </AsciiBox>
        </ListItem>
      ))}
    </List>
  );
}

function ValidatorList({ validators, navigate }) {
  if (!validators?.length) {
    return <Box p={4} color="gray.500">No active validators</Box>;
  }

  return (
    <List spacing={2}>
      {validators.map((validator) => (
        <ListItem
          key={validator.address}
          onClick={() => navigate(`/validator/${encodeURIComponent(validator.address)}`)}
          cursor="pointer"
          _hover={{ opacity: 0.9 }}
          transition="all 0.2s"
        >
          <AsciiBox p={3} className="explorer-record__tx-item">
            <HStack spacing={3} justify="space-between" align="flex-start" minW="0">
              <HStack spacing={3} minW="0">
                <FontAwesomeIcon icon={faShieldHalved} />
                <Text className="explorer-record__tx-hash" isTruncated title={validator.address}>
                  {shortenAddress(validator.address)}
                </Text>
              </HStack>
              <Text className="explorer-record__tx-type">
                Stake: {formatELDAmount(validator.stake)}
              </Text>
            </HStack>
            {validator.public_key && (
              <Text mt={2} fontSize="xs" className="explorer-record__mono" color="var(--lh-faint)">
                Public key: {validator.public_key}
              </Text>
            )}
          </AsciiBox>
        </ListItem>
      ))}
    </List>
  );
}

function SingleEpochPage() {
  const { epochId = 'current' } = useParams();
  const navigate = useNavigate();
  const { epoch, loading, error } = useEpoch(epochId);

  const goToAccount = (rawAddress) => {
    const address = normalizeAccountAddress(rawAddress) || rawAddress;
    if (address) navigate(`/account/${address}`);
  };

  if (loading) return <Box className="explorer-record__state">Loading epoch...</Box>;
  if (error) return <Box className="explorer-record__state explorer-record__state--error">Error: {error}</Box>;
  if (!epoch) return <Box className="explorer-record__state">No epoch found</Box>;

  const storageValidator = epoch.storage_validator || {};
  const epochLabel = epoch.epoch ?? epochId;

  return (
    <Box className="explorer-record">
      <HStack className="explorer-record__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">← Explorer</Link>
        <Text className="explorer-record__crumb-sep">Epoch</Text>
        <Text className="explorer-record__crumb-current">{epochLabel}</Text>
      </HStack>

      <Heading className="explorer-record__title" as="h1">
        EPOCH <Text as="span">#{epochLabel}</Text>
      </Heading>

      <Box mb={6}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">
          ← Back
        </Link>
      </Box>

      <section className="explorer-record__section">
        <h2><span /> BASIC INFORMATION</h2>
        <div className="explorer-record__kv-grid">
          <div><span>EPOCH</span><strong>{epoch.epoch ?? 'N/A'}</strong></div>
          <div>
            <span>START BLOCK</span>
            <strong>
              {epoch.start_block != null ? (
                <Link onClick={() => navigate(`/block/${epoch.start_block}`)} className="explorer-record__tx-hash">
                  {epoch.start_block}
                </Link>
              ) : (
                'N/A'
              )}
            </strong>
          </div>
          <div>
            <span>TIMESTAMP</span>
            <strong>
              {epoch.timestamp != null
                ? new Date(epoch.timestamp * 1000).toLocaleString()
                : 'N/A'}
            </strong>
          </div>
          <div>
            <span>ACTIVE VALIDATORS</span>
            <strong>{epoch.active_validators?.length ?? 0}</strong>
          </div>
          <div>
            <span>ACTIVE CAPACITY PROVIDERS</span>
            <strong>{epoch.active_capacity_providers?.length ?? 0}</strong>
          </div>
          <div>
            <span>CHALLENGED CAPACITY PROVIDERS</span>
            <strong>{epoch.challenged_capacity_providers?.length ?? 0}</strong>
          </div>
        </div>
      </section>

      {storageValidator.validator_address && (
        <section className="explorer-record__section">
          <h2><span /> STORAGE VALIDATOR</h2>
          <div className="explorer-record__kv-grid">
            <div>
              <span>VALIDATOR ADDRESS</span>
              <strong className="explorer-record__mono">
                <Link
                  onClick={() => goToAccount(storageValidator.validator_address)}
                  className="explorer-record__tx-hash"
                >
                  {storageValidator.validator_address}
                </Link>
              </strong>
            </div>
            <div><span>EPOCH</span><strong>{storageValidator.epoch ?? 'N/A'}</strong></div>
            <div>
              <span>CHALLENGED PROVIDERS</span>
              <strong>{storageValidator.challenged_providers?.length ?? 0}</strong>
            </div>
            <div>
              <span>SUBSCRIBED TOPICS</span>
              <strong>{storageValidator.subscribed_topics?.length ?? 0}</strong>
            </div>
          </div>
          {storageValidator.challenged_providers?.length > 0 && (
            <Box px={4} pb={4}>
              <Text fontSize="xs" color="var(--lh-faint)" mb={2} textTransform="uppercase" letterSpacing="0.2em">
                Challenged provider addresses
              </Text>
              <VStack align="stretch" spacing={1}>
                {storageValidator.challenged_providers.map((address) => (
                  <Text
                    key={address}
                    className="explorer-record__mono explorer-record__tx-hash"
                    fontSize="xs"
                    cursor="pointer"
                    onClick={() => navigate(`/capacity-provider/${encodeURIComponent(address)}`)}
                  >
                    {address}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}
          {storageValidator.subscribed_topics?.length > 0 && (
            <Box px={4} pb={4}>
              <Text fontSize="xs" color="var(--lh-faint)" mb={2} textTransform="uppercase" letterSpacing="0.2em">
                Subscribed topics
              </Text>
              <VStack align="stretch" spacing={1}>
                {storageValidator.subscribed_topics.map((topic) => (
                  <Text key={topic} className="explorer-record__mono" fontSize="xs">
                    {topic}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}
        </section>
      )}

      <section className="explorer-record__section">
        <h2><span /> ACTIVE VALIDATORS ({epoch.active_validators?.length ?? 0})</h2>
        <Box p={4} pt={0}>
          <ValidatorList validators={epoch.active_validators} navigate={navigate} />
        </Box>
      </section>

      <section className="explorer-record__section">
        <h2><span /> ACTIVE CAPACITY PROVIDERS ({epoch.active_capacity_providers?.length ?? 0})</h2>
        <Box p={4} pt={0}>
          <CapacityProviderList
            providers={epoch.active_capacity_providers}
            navigate={navigate}
            emptyLabel="No active capacity providers"
          />
        </Box>
      </section>

      <section className="explorer-record__section">
        <h2><span /> CHALLENGED CAPACITY PROVIDERS ({epoch.challenged_capacity_providers?.length ?? 0})</h2>
        <Box p={4} pt={0}>
          <CapacityProviderList
            providers={epoch.challenged_capacity_providers}
            navigate={navigate}
            emptyLabel="No challenged capacity providers"
          />
        </Box>
      </section>
    </Box>
  );
}

export default SingleEpochPage;
