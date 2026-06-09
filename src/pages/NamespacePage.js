import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Text, HStack, Link } from '@chakra-ui/react';
import useNamespace from '../hooks/useNamespace';
import { normalizeAccountAddress } from '../utils/accountAddress';
import './BlockPage.css';

function NamespacePage() {
  const { namespaceSlug } = useParams();
  const navigate = useNavigate();
  const { namespace, loading, error } = useNamespace(namespaceSlug);

  const goToBlock = (height) => {
    if (height != null) navigate(`/block/${height}`);
  };

  const goToOwner = (owner) => {
    const address = normalizeAccountAddress(owner) || owner;
    if (address) navigate(`/account/${address}`);
  };

  if (loading) {
    return <Box className="explorer-record__state">Loading namespace...</Box>;
  }

  if (error) {
    return (
      <Box className="explorer-record__state explorer-record__state--error">
        Failed to fetch namespace: {error}
      </Box>
    );
  }

  if (!namespace) {
    return <Box className="explorer-record__state">No namespace data</Box>;
  }

  const slug = namespace.namespace_slug || namespaceSlug;
  const scope = namespace.scope || `@${slug}`;
  const isRegistered = namespace.registered === true;

  if (!isRegistered) {
    return (
      <Box className="explorer-record">
        <HStack className="explorer-record__crumbs" spacing={4}>
          <Link as={RouterLink} to="/" className="explorer-record__crumb-link">
            ← Explorer
          </Link>
          <Text className="explorer-record__crumb-sep">Namespace</Text>
          <Text className="explorer-record__crumb-current">{slug}</Text>
        </HStack>

        <Heading className="explorer-record__title" as="h1">
          NAMESPACE <Text as="span">@{slug}</Text>
        </Heading>

        <Box className="explorer-record__section" p={6}>
          <Text color="gray.500">This namespace is not registered on chain.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="explorer-record">
      <HStack className="explorer-record__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">
          ← Explorer
        </Link>
        <Text className="explorer-record__crumb-sep">Namespace</Text>
        <Text className="explorer-record__crumb-current">{scope}</Text>
      </HStack>

      <Heading className="explorer-record__title" as="h1">
        NAMESPACE <Text as="span">{scope}</Text>
      </Heading>

      <Box className="explorer-record__section">
        <Box as="h2">
          <Text as="span" />
          REGISTRY DETAILS
        </Box>
        <Box className="explorer-record__kv-grid" p={4}>
          <Box>
            <Text as="span">SCOPE</Text>
            <Text as="strong">{scope}</Text>
          </Box>
          <Box>
            <Text as="span">SLUG</Text>
            <Text as="strong" className="explorer-record__mono">
              {slug}
            </Text>
          </Box>
          <Box>
            <Text as="span">OWNER</Text>
            <Link
              className="explorer-record__mono"
              onClick={() => goToOwner(namespace.owner)}
              color="var(--lh-accent, #ff7a18)"
              cursor="pointer"
            >
              {namespace.owner}
            </Link>
          </Box>
          <Box>
            <Text as="span">REGISTERED AT BLOCK</Text>
            <Link
              onClick={() => goToBlock(namespace.registered_height)}
              color="var(--lh-accent, #ff7a18)"
              cursor="pointer"
            >
              <Text as="strong">#{namespace.registered_height}</Text>
            </Link>
          </Box>
          {namespace.registry_path && (
            <Box>
              <Text as="span">REGISTRY PATH</Text>
              <Text as="strong" className="explorer-record__mono">
                {namespace.registry_path}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default NamespacePage;
