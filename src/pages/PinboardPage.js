import React, { useMemo, useState } from 'react';
import { Box, Heading, HStack, Text, Input, Button, VStack, SimpleGrid, Link } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import PinIcon from '../components/PinIcon';
import { DARK_TEXT_COLOR } from '../constants';
import AsciiBox from '../components/AsciiBox';
import PinboardMessagesList from '../components/PinboardMessagesList';
import usePinboardMessagesByWallet from '../hooks/usePinboardMessagesByWallet';
import usePinboardMessagesByTag from '../hooks/usePinboardMessagesByTag';
import usePinboardFeed from '../hooks/usePinboardFeed';
import usePinboardGcMetrics from '../hooks/usePinboardGcMetrics';
import './ExplorerDataPages.css';

const DEFAULT_PAGE_SIZE = 100;
const FEED_PAGE_SIZE = 50;

function GcMetricsDashboard() {
  const { metrics, loading, error } = usePinboardGcMetrics(10000);

  const entries = metrics && typeof metrics === 'object' ? Object.entries(metrics) : [];

  return (
    <AsciiBox p={4} mb={4}>
      <HStack justify="space-between" align="center" mb={2}>
        <Heading as="h3" size="sm" color="gray.700">
          Pinboard GC Metrics
        </Heading>
        <Text fontSize="xs" color="gray.500" fontFamily="mono">
          auto-refresh: 10s
        </Text>
      </HStack>

      {loading && <Text fontSize="sm" color="gray.600">Loading metrics...</Text>}
      {error && <Text fontSize="sm" color="red.500">Error: {error}</Text>}

      {!loading && !error && entries.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
          {entries.map(([key, value]) => (
            <Box key={key} p={2} border="1px dashed" borderColor="gray.300" borderRadius="6px">
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.02em">
                {key}
              </Text>
              <Text fontSize="sm" color="gray.700" fontFamily="mono" isTruncated title={typeof value === 'string' ? value : JSON.stringify(value)}>
                {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {!loading && !error && entries.length === 0 && (
        <Text fontSize="sm" color="gray.600">
          No GC metrics returned.
        </Text>
      )}
    </AsciiBox>
  );
}

function PinboardPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('feed'); // 'feed' | 'wallet' | 'tag'
  const [feedOrder, setFeedOrder] = useState('desc'); // 'desc' | 'asc'
  const [walletInput, setWalletInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [activeWallet, setActiveWallet] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(0);

  const isFeedActive = useMemo(() => !activeWallet && !activeTag, [activeWallet, activeTag]);

  const feedQuery = usePinboardFeed(feedOrder, page, FEED_PAGE_SIZE);
  const walletQuery = usePinboardMessagesByWallet(activeWallet, page, DEFAULT_PAGE_SIZE);
  const tagQuery = usePinboardMessagesByTag(activeTag, page, DEFAULT_PAGE_SIZE);

  const effectiveMode = isFeedActive ? 'feed' : mode;

  const items = effectiveMode === 'feed' ? feedQuery.items : effectiveMode === 'wallet' ? walletQuery.messages : tagQuery.messages;
  const loading = effectiveMode === 'feed' ? feedQuery.loading : effectiveMode === 'wallet' ? walletQuery.loading : tagQuery.loading;
  const error = effectiveMode === 'feed' ? feedQuery.error : effectiveMode === 'wallet' ? walletQuery.error : tagQuery.error;
  const hasMore = effectiveMode === 'feed' ? feedQuery.hasMore : effectiveMode === 'wallet' ? walletQuery.hasMore : tagQuery.hasMore;

  function handleLoad() {
    setPage(0);
    if (mode === 'wallet') {
      setActiveWallet(walletInput.trim());
      setActiveTag('');
    } else {
      setActiveTag(tagInput.trim());
      setActiveWallet('');
    }
  }

  return (
    <Box className="explorer-page" color={DARK_TEXT_COLOR}>
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">← Explorer</Link>
        <Text className="explorer-page__crumb-sep">Social</Text>
        <Text className="explorer-page__crumb-current">Pinboard</Text>
      </HStack>

      <HStack spacing={2} mb={6}>
        <PinIcon h="1.125rem" w="0.703125rem" />
        <Heading as="h1" className="explorer-page__title" m={0}>
          PINBOARD
        </Heading>
      </HStack>

      <GcMetricsDashboard />

      <VStack spacing={4} align="stretch" mb={4}>
        <HStack spacing={2}>
          <Button
            onClick={() => {
              setMode('feed');
              setActiveWallet('');
              setActiveTag('');
              setPage(0);
            }}
            variant={effectiveMode === 'feed' ? 'solid' : 'outline'}
            colorScheme="gray"
            fontFamily="mono"
            className="explorer-page__action"
          >
            Feed
          </Button>
          <Button
            onClick={() => {
              setMode('wallet');
              setActiveTag('');
              setPage(0);
            }}
            variant={effectiveMode === 'wallet' ? 'solid' : 'outline'}
            colorScheme="gray"
            fontFamily="mono"
            className="explorer-page__action"
          >
            By Wallet
          </Button>
          <Button
            onClick={() => {
              setMode('tag');
              setActiveWallet('');
              setPage(0);
            }}
            variant={effectiveMode === 'tag' ? 'solid' : 'outline'}
            colorScheme="gray"
            fontFamily="mono"
            className="explorer-page__action"
          >
            By Tag
          </Button>
        </HStack>

        {effectiveMode === 'feed' ? (
          <HStack spacing={3}>
            <Button
              onClick={() => {
                setFeedOrder('desc');
                setPage(0);
              }}
              variant={feedOrder === 'desc' ? 'solid' : 'outline'}
              colorScheme="gray"
              fontFamily="mono"
              className="explorer-page__action"
            >
              Newest
            </Button>
            <Button
              onClick={() => {
                setFeedOrder('asc');
                setPage(0);
              }}
              variant={feedOrder === 'asc' ? 'solid' : 'outline'}
              colorScheme="gray"
              fontFamily="mono"
              className="explorer-page__action"
            >
              Oldest
            </Button>
            <Text fontSize="sm" color="gray.600" fontFamily="mono">
              page_size={FEED_PAGE_SIZE}
            </Text>
          </HStack>
        ) : effectiveMode === 'wallet' ? (
          <HStack spacing={3}>
            <Input
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              placeholder="0x... signer address"
              fontFamily="mono"
              className="explorer-page__input"
            />
            <Button onClick={handleLoad} colorScheme="blue" isDisabled={!walletInput.trim()} className="explorer-page__action">
              Load
            </Button>
          </HStack>
        ) : (
          <HStack spacing={3}>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="tag (as stored on chain)"
              fontFamily="mono"
              className="explorer-page__input"
            />
            <Button onClick={handleLoad} colorScheme="blue" isDisabled={!tagInput.trim()} className="explorer-page__action">
              Load
            </Button>
          </HStack>
        )}

        <Box>
          {!loading && items?.length > 0 && (
            <Text fontSize="sm" color="gray.600" mb={2}>
              Page {page + 1} (0-based index used by the node){effectiveMode === 'feed' ? `, order=${feedOrder}` : ''}
            </Text>
          )}
          {error && <Text color="red.500">Error: {error}</Text>}
        </Box>
      </VStack>

      <PinboardMessagesList
        messages={items}
        loading={loading}
        onMessageClick={({ wallet, messageId }) => {
          const targetWallet = wallet || activeWallet;
          if (!targetWallet || !messageId) return;
          navigate(`/pinboard/post/${encodeURIComponent(targetWallet)}/${encodeURIComponent(messageId)}`);
        }}
      />

      <HStack mt={4} justify="flex-end" spacing={2}>
        <Button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          variant="ghost"
          fontFamily="mono"
          bg="transparent"
          border="none"
          _hover={{ bg: 'transparent', color: 'white' }}
          _active={{ bg: 'transparent' }}
          sx={{ borderRadius: '6px !important' }}
          className="explorer-page__action"
        >
          &lt;&lt;
        </Button>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || loading}
          variant="ghost"
          fontFamily="mono"
          bg="transparent"
          border="none"
          _hover={{ bg: 'transparent', color: 'white' }}
          _active={{ bg: 'transparent' }}
          sx={{ borderRadius: '6px !important' }}
          className="explorer-page__action"
        >
          &gt;&gt;
        </Button>
      </HStack>
    </Box>
  );
}

export default PinboardPage;
