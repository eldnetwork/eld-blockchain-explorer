import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, List, ListItem, HStack, Text, Skeleton, VStack, Button } from '@chakra-ui/react';
import useTransactions from '../hooks/useTransactions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import AsciiBox from './AsciiBox';
import { BORDER_RADIUS } from '../constants';

function TransactionsList() {
    const transactionsPerPage = 20;
    const {
        transactions,
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
    } = useTransactions(transactionsPerPage);
    const navigate = useNavigate();

    const pagerDisabled = loading || pagerJumping;

    const goToTransaction = (hash) => {
        navigate(`/tx/${hash}`);
    };

    const metaLabel =
        pagination.total != null ? (
            <>
                Page {activePage + 1}
                {' · '}
                {pagination.total.toLocaleString()} indexed
            </>
        ) : (
            <>Page {activePage + 1}</>
        );

    const formatDateTime = (timestamp) => {
        if (!timestamp || timestamp === 'N/A') return 'N/A';
        // Handle Unix timestamp (number in seconds)
        if (typeof timestamp === 'number') {
            const date = new Date(timestamp * 1000);
            return date.toISOString().replace('T', ' ').split('.')[0];
        }
        // Handle ISO string like "2025-12-12T08:03:07.395128Z" to "2025-12-12 08:03:07"
        if (typeof timestamp === 'string') {
            return timestamp.replace('T', ' ').split('.')[0].replace('Z', '');
        }
        return timestamp;
    };

    if (error) return <Box p={4} color="red.500">Error: {error}</Box>;
    if (!transactions.length && !loading) return <Box p={4}>No transactions found</Box>;

    return (
        <Box className="explorer-home__list explorer-home__list--transactions" mt={4}>
            <HStack className="explorer-home__list-header" mb={4} justify="space-between" align="baseline">
                <Heading className="explorer-home__list-title" as="h2" size="lg" color="gray.700" lineHeight="1.2">
                    Latest Transactions{' '}
                    <Text className="explorer-home__list-meta" as="span" fontSize="sm" display="inline">
                        ({metaLabel})
                    </Text>
                </Heading>
                <HStack className="explorer-home__pager" spacing={2}>
                    <Button
                        title="Newest txs"
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
                        title="More recent txs"
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
                        title="Older txs"
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
                        title="Oldest txs"
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
                </HStack>
            </HStack>
            <List className="explorer-home__list-body" spacing={3} mt={0} pt={0} style={{ marginTop: '-5px' }}>
                {isInitialLoad ? (
                    // Show skeletons for initial load
                    Array(transactionsPerPage).fill(0).map((_, index) => (
                        <ListItem key={index} transition="all 0.2s" _hover={{ opacity: 0.8 }}>
                            <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                                <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                                    <HStack spacing={4} w="full" minW="0">
                                        <Skeleton height="20px" width="20px" flexShrink={0} />
                                        <Skeleton height="20px" flex="1" minW="0" />
                                    </HStack>
                                    <HStack spacing={1}>
                                        <Skeleton height="20px" width="20px" flexShrink={0} />
                                        <Skeleton height="20px" width="160px" />
                                    </HStack>
                                    <Skeleton height="20px" width="150px" />
                                </VStack>
                                <HStack spacing={4} w="full" justify="space-between" minW="0" display={{ base: 'none', md: 'flex' }}>
                                    <HStack spacing={4} flex="1" minW="0">
                                        <Skeleton height="20px" width="20px" flexShrink={0} />
                                        <Skeleton height="20px" width="200px" maxW="200px" />
                                        <Skeleton height="20px" width="120px" maxW="120px" />
                                    </HStack>
                                    <Skeleton height="20px" width="150px" maxW="150px" flexShrink={0} />
                                </HStack>
                            </AsciiBox>
                        </ListItem>
                    ))
                ) : (
                    transactions.map((tx, index) => {
                        // Extract hash/id from transaction - adjust based on actual API response
                        const txHash = tx.id || tx.hash || tx.tx_hash || `tx-${index}`;
                        const timestamp = tx.timestamp || tx.time || tx.created_at || 'N/A';
                        
                        // Extract transaction type - check multiple possible locations
                        // Based on API structure: tx.tx.payload.type
                        const txType = tx.tx?.payload?.type || 
                                      tx.type || 
                                      tx.transaction_type || 
                                      tx.payload?.type || 
                                      tx.payload_type ||
                                      'Unknown';
                        const txTypeLabel = String(txType).replace(/_/g, ' ').toUpperCase();
                        
                        return (
                            <ListItem
                                key={txHash}
                                onClick={() => goToTransaction(txHash)}
                                cursor="pointer"
                                _hover={{ opacity: 0.8 }}
                                transition="all 0.2s"
                            >
                                <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                                    <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                                        <HStack spacing={4} w="full" minW="0">
                                            <FontAwesomeIcon icon={faReceipt} flexShrink={0} />
                                            <Text
                                                className="explorer-home__tx-hash"
                                                flex="1"
                                                minW="0"
                                                isTruncated
                                                title={txHash}
                                            >
                                                {txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-10)}` : txHash}
                                            </Text>
                                        </HStack>
                                        <HStack spacing={1} className="explorer-home__list-time-row">
                                            <FontAwesomeIcon icon={faClock} color="grey" flexShrink={0} />
                                            <Text fontSize="sm">{formatDateTime(timestamp)}</Text>
                                        </HStack>
                                        <Text as="span" className="explorer-home__tx-type-tag" title={txTypeLabel}>
                                            {txTypeLabel}
                                        </Text>
                                    </VStack>
                                    <HStack spacing={4} w="full" justify="space-between" minW="0" display={{ base: 'none', md: 'flex' }}>
                                        <HStack spacing={4} flex="1" minW="0">
                                            <FontAwesomeIcon icon={faReceipt} flexShrink={0} />
                                            <Text 
                                                className="explorer-home__tx-hash"
                                                flex="0 0 auto"
                                                minW="0"
                                                maxW="200px"
                                                isTruncated
                                                title={txHash}
                                            >
                                                {txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-10)}` : txHash}
                                            </Text>
                                            <HStack spacing={1} flex="0 0 auto" minW="0" maxW={{ base: "150px", md: "none" }}>
                                                <FontAwesomeIcon icon={faClock} color="grey" flexShrink={0} />
                                                <Text fontSize="sm" noOfLines={{ base: 1 }}>{formatDateTime(timestamp)}</Text>
                                            </HStack>
                                        </HStack>
                                        <Text as="span" className="explorer-home__tx-type-tag" title={txTypeLabel}>
                                            {txTypeLabel}
                                        </Text>
                                    </HStack>
                                </AsciiBox>
                            </ListItem>
                        );
                    })
                )}
            </List>
            <HStack className="explorer-home__pager explorer-home__pager--bottom" mt={4} justify="flex-end">
                <Button
                    title="Newest txs"
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
                    title="More recent txs"
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
                    title="Older txs"
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
                    title="Oldest txs"
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
            </HStack>
        </Box>
    );
}

export default TransactionsList;

