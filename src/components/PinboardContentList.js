import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Heading, HStack, List, ListItem, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import AsciiBox from './AsciiBox';
import usePinboardPosts, { findLastPinboardPostsPageIndex } from '../hooks/usePinboardPosts';
import { BORDER_RADIUS } from '../constants';
import { normalizeAccountAddress } from '../utils/accountAddress';

const POSTS_PER_PAGE = 20;

function truncateMiddle(value, left = 10, right = 8) {
  if (!value) return 'N/A';
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function formatReceivedTimestamp(timestamp) {
  if (timestamp === null || timestamp === undefined) return 'N/A';
  const asNumber = Number(timestamp);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return 'N/A';
  return new Date(asNumber * 1000).toLocaleString();
}

function statusLabel(status) {
  if (!status) return 'unknown';
  const normalized = String(status).toLowerCase();
  if (normalized === 'missing') return 'expired';
  return normalized;
}

function PinboardContentList() {
  const [page, setPage] = useState(0);
  const [pageJumping, setPageJumping] = useState(false);
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { items, hasMore, loading, error } = usePinboardPosts(page, POSTS_PER_PAGE, 'desc');

  const pagerDisabled = loading || pageJumping;

  function goToFirst() {
    setPage(0);
  }

  async function goToLast() {
    setPageJumping(true);
    try {
      const lastIndex = await findLastPinboardPostsPageIndex(POSTS_PER_PAGE, 'desc');
      if (mountedRef.current) {
        setPage(lastIndex);
      }
    } finally {
      if (mountedRef.current) {
        setPageJumping(false);
      }
    }
  }

  function goToPrevious() {
    setPage((current) => Math.max(0, current - 1));
  }

  function goToNext() {
    if (hasMore) setPage((current) => current + 1);
  }

  function goToPost(item) {
    const wallet = item?.meta?.original_signer;
    const messageId = item?.meta?.message_id;
    const cadoPath = item?.cado_path;
    if (!wallet || !messageId) return;

    const params = new URLSearchParams();
    if (cadoPath) params.set('path', cadoPath);
    const query = params.toString();
    navigate(`/pinboard/post/${encodeURIComponent(wallet)}/${encodeURIComponent(messageId)}${query ? `?${query}` : ''}`);
  }

  return (
    <Box className="explorer-home__list explorer-home__list--content" mt={4}>
      <HStack className="explorer-home__list-header" mb={4} justify="space-between" align="baseline">
        <Heading className="explorer-home__list-title" as="h2" size="lg" color="gray.700" lineHeight="1.2">
          Latest Content
          <Text className="explorer-home__list-meta" as="span" fontSize="sm" display="inline">
            {' '}({`Page ${page + 1}`})
          </Text>
        </Heading>
        <HStack className="explorer-home__pager" spacing={2}>
          <Button
            title="First page"
            className="explorer-home__pager-btn"
            onClick={goToFirst}
            disabled={page === 0 || pagerDisabled}
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
            title="Previous page"
            className="explorer-home__pager-btn"
            onClick={goToPrevious}
            disabled={page === 0 || pagerDisabled}
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
            title="Next page"
            className="explorer-home__pager-btn"
            onClick={goToNext}
            disabled={!hasMore || pagerDisabled}
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
            title="Last page"
            className="explorer-home__pager-btn"
            onClick={() => void goToLast()}
            disabled={!hasMore || pagerDisabled}
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
        </HStack>
      </HStack>

      {error && <Box p={4} color="red.500">Error: {error}</Box>}

      <List className="explorer-home__list-body" spacing={3} mt={0} pt={0} style={{ marginTop: '-5px' }}>
        {loading || pageJumping ? (
          Array(POSTS_PER_PAGE).fill(0).map((_, index) => (
            <ListItem key={index}>
              <AsciiBox className="explorer-home__list-item" p={3} borderRadius={BORDER_RADIUS} boxShadow="sm">
                <VStack spacing={2} align="stretch">
                  <HStack spacing={4} w="full" justify="space-between">
                    <Skeleton height="20px" width="220px" />
                    <Skeleton height="20px" width="80px" />
                  </HStack>
                  <Skeleton height="16px" width="100%" />
                  <Skeleton height="16px" width="65%" />
                </VStack>
              </AsciiBox>
            </ListItem>
          ))
        ) : items.length === 0 ? (
          <ListItem>
            <Box p={4}>No content posts found</Box>
          </ListItem>
        ) : (
          items.map((item, index) => {
            const messageId = item?.meta?.message_id || `unknown-${index}`;
            const signer = item?.meta?.original_signer || 'N/A';
            const receivedAt = formatReceivedTimestamp(item?.meta?.received_timestamp);
            const tags = Array.isArray(item?.meta?.tags) ? item.meta.tags : [];
            const blobState = statusLabel(item?.blob_status);
            const isClickable = Boolean(item?.meta?.original_signer && item?.meta?.message_id);

            return (
              <ListItem
                key={`${messageId}-${index}`}
                onClick={isClickable ? () => goToPost(item) : undefined}
                cursor={isClickable ? 'pointer' : 'default'}
                _hover={isClickable ? { opacity: 0.8 } : undefined}
                transition="all 0.2s"
              >
                <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                  <VStack spacing={2} align="stretch" w="full">
                    <HStack spacing={3} w="full" justify="space-between" align="center">
                      <HStack spacing={2} minW={0}>
                        <FontAwesomeIcon icon={faMessage} />
                        <Text className="explorer-home__content-message-id" title={messageId}>
                          {truncateMiddle(messageId, 14, 10)}
                        </Text>
                      </HStack>
                      <Text className={`explorer-home__content-status explorer-home__content-status--${blobState}`}>
                        {blobState}
                      </Text>
                    </HStack>
                    <Text
                      as="button"
                      type="button"
                      className="explorer-home__content-signer explorer-page__clickable"
                      title={signer}
                      textAlign="left"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/account/${normalizeAccountAddress(signer) || signer}`);
                      }}
                    >
                      {truncateMiddle(signer, 12, 10)}
                    </Text>
                    <HStack spacing={1} className="explorer-home__content-time-row">
                      <FontAwesomeIcon icon={faClock} color="grey" />
                      <Text>{receivedAt}</Text>
                    </HStack>
                    {tags.length > 0 && (
                      <Text className="explorer-home__content-tags" title={tags.join(', ')}>
                        Tags: {tags.slice(0, 4).join(', ')}
                      </Text>
                    )}
                  </VStack>
                </AsciiBox>
              </ListItem>
            );
          })
        )}
      </List>

      <HStack className="explorer-home__pager explorer-home__pager--bottom" mt={4} justify="flex-end">
        <Button
          title="First page"
          className="explorer-home__pager-btn"
          onClick={goToFirst}
          disabled={page === 0 || pagerDisabled}
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
          title="Previous page"
          className="explorer-home__pager-btn"
          onClick={goToPrevious}
          disabled={page === 0 || pagerDisabled}
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
          title="Next page"
          className="explorer-home__pager-btn"
          onClick={goToNext}
          disabled={!hasMore || pagerDisabled}
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
          title="Last page"
          className="explorer-home__pager-btn"
          onClick={() => void goToLast()}
          disabled={!hasMore || pagerDisabled}
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
      </HStack>
    </Box>
  );
}

export default PinboardContentList;
