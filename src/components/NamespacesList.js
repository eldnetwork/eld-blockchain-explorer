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
import useNamespaces from '../hooks/useNamespaces';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAt, faCube } from '@fortawesome/free-solid-svg-icons';
import AsciiBox from './AsciiBox';
import { BORDER_RADIUS } from '../constants';
import { normalizeAccountAddress } from '../utils/accountAddress';

function shortenAddress(address) {
  if (!address || address.length < 14) return address || 'N/A';
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

function NamespacesList() {
  const namespacesPerPage = 20;
  const {
    namespaces,
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
  } = useNamespaces(namespacesPerPage);
  const navigate = useNavigate();

  const pagerDisabled = loading || pagerJumping;

  const goToNamespace = (slug) => {
    navigate(`/namespaces/${encodeURIComponent(slug)}`);
  };

  const goToBlock = (event, height) => {
    event.stopPropagation();
    navigate(`/block/${height}`);
  };

  const goToOwner = (event, owner) => {
    event.stopPropagation();
    const address = normalizeAccountAddress(owner) || owner;
    if (address) navigate(`/account/${address}`);
  };

  const metaLabel =
    pagination.total != null ? (
      <>
        Page {activePage + 1}
        {' · '}
        {pagination.total.toLocaleString()} registered
      </>
    ) : (
      <>Page {activePage + 1}</>
    );

  const pagerButtons = (
    <>
      <Button
        title="Newest namespaces"
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
        title="More recent namespaces"
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
        title="Older namespaces"
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
        title="Oldest namespaces"
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
  if (!namespaces.length && !loading) return <Box p={4}>No custom namespaces found</Box>;

  return (
    <Box className="explorer-home__list explorer-home__list--namespaces" mt={4}>
      <HStack className="explorer-home__list-header" mb={4} justify="space-between" align="baseline">
        <Heading className="explorer-home__list-title" as="h2" size="lg" color="gray.700" lineHeight="1.2">
          Custom Namespaces{' '}
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
          ? Array(namespacesPerPage)
              .fill(0)
              .map((_, index) => (
                <ListItem key={index} transition="all 0.2s" _hover={{ opacity: 0.8 }}>
                  <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                    <HStack spacing={3} w="full" minW="0" display={{ base: 'flex', md: 'none' }}>
                      <HStack spacing={3} flex="1" minW="0">
                        <Skeleton height="20px" width="20px" flexShrink={0} />
                        <Skeleton height="20px" flex="1" minW="0" />
                      </HStack>
                      <Skeleton height="20px" width="96px" flexShrink={0} />
                      <Skeleton height="20px" width="148px" flexShrink={0} />
                    </HStack>
                    <HStack spacing={4} w="full" minW="0" display={{ base: 'none', md: 'flex' }}>
                      <HStack spacing={4} flex="1" minW="0">
                        <Skeleton height="20px" width="20px" flexShrink={0} />
                        <Skeleton height="20px" flex="1" minW="0" />
                      </HStack>
                      <Skeleton height="20px" width="110px" flexShrink={0} />
                      <Skeleton height="20px" width="220px" flexShrink={0} />
                    </HStack>
                  </AsciiBox>
                </ListItem>
              ))
          : namespaces.map((row) => {
              const label = row.scope || `@${row.namespace_slug}`;
              const owner = row.owner || 'N/A';
              const height = row.registered_height;

              return (
                <ListItem
                  key={`${row.namespace_slug}-${height}`}
                  onClick={() => goToNamespace(row.namespace_slug)}
                  cursor="pointer"
                  _hover={{ opacity: 0.8 }}
                  transition="all 0.2s"
                >
                  <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                    <HStack spacing={3} w="full" minW="0" align="center" display={{ base: 'flex', md: 'none' }}>
                      <HStack spacing={3} flex="1" minW="0">
                        <FontAwesomeIcon icon={faAt} flexShrink={0} />
                        <Text
                          className="explorer-home__namespace-scope"
                          fontWeight="semibold"
                          flex="1"
                          minW="0"
                          isTruncated
                          title={label}
                        >
                          {label}
                        </Text>
                      </HStack>
                      <HStack
                        spacing={1}
                        flex="0 0 96px"
                        justify="flex-end"
                        onClick={(e) => goToBlock(e, height)}
                        cursor="pointer"
                        title={`Block ${height}`}
                      >
                        <FontAwesomeIcon icon={faCube} color="grey" flexShrink={0} />
                        <Text fontSize="sm" className="explorer-home__block-height" whiteSpace="nowrap">
                          block {height}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        flex="0 0 148px"
                        textAlign="right"
                        isTruncated
                        title={owner}
                        onClick={(e) => goToOwner(e, owner)}
                        cursor="pointer"
                      >
                        {shortenAddress(owner)}
                      </Text>
                    </HStack>
                    <HStack spacing={4} w="full" minW="0" align="center" display={{ base: 'none', md: 'flex' }}>
                      <HStack spacing={4} flex="1" minW="0">
                        <FontAwesomeIcon icon={faAt} flexShrink={0} />
                        <Text
                          className="explorer-home__namespace-scope"
                          fontWeight="semibold"
                          flex="1"
                          minW="0"
                          isTruncated
                          title={label}
                        >
                          {label}
                        </Text>
                      </HStack>
                      <HStack
                        spacing={1}
                        flex="0 0 110px"
                        justify="flex-end"
                        onClick={(e) => goToBlock(e, height)}
                        cursor="pointer"
                        title={`Block ${height}`}
                      >
                        <FontAwesomeIcon icon={faCube} color="grey" flexShrink={0} />
                        <Text fontSize="sm" className="explorer-home__block-height" whiteSpace="nowrap">
                          block {height}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        flex="0 0 220px"
                        textAlign="right"
                        isTruncated
                        title={owner}
                        onClick={(e) => goToOwner(e, owner)}
                        cursor="pointer"
                      >
                        {shortenAddress(owner)}
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

export default NamespacesList;
