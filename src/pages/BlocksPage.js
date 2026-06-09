import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, List, ListItem, Button, HStack, VStack, Text, Skeleton } from '@chakra-ui/react';
import AsciiBox from '../components/AsciiBox';
import useBlocks from '../hooks/useBlocks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { BORDER_RADIUS } from '../constants';

function BlocksPage() {
    const [page, setPage] = useState(1);
    const { blocks, lastHeight, loading, error, isInitialLoad } = useBlocks(page);
    const navigate = useNavigate();
    const blocksPerPage = 20;
    const totalPages = Math.ceil(lastHeight / blocksPerPage);

    const goToPrevious = () => {
        if (page > 1) setPage(page - 1);
    };

    const goToNext = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const goToFirst = () => {
        if (totalPages > 0) setPage(1);
    };

    const goToLast = () => {
        if (totalPages > 0) setPage(totalPages);
    };

    const goToBlock = (height) => {
        navigate(`/block/${height}`);
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        // Parse ISO string like "2025-12-12T08:03:07.395128Z" to "2025-12-12 08:03:07"
        return dateTimeString.replace('T', ' ').split('.')[0];
    };

    const isFirstPage = blocks.length > 0 &&
        parseInt(blocks[blocks.length - 1].header.height) <= 0;

    if (error) return <Box p={4} color="red.500">Error: {error}</Box>;
    if (!blocks.length && !loading && !isInitialLoad) return <Box p={4}>No blocks found</Box>;

    return (
        <Box className="explorer-home__list explorer-home__list--blocks" mt={4}>
            <HStack className="explorer-home__list-header" mb={4} justify="space-between" align="baseline">
                <Heading className="explorer-home__list-title" as="h2" size="lg" color="gray.700" lineHeight="1.2">
                    Blocks{' '}
                    <Text className="explorer-home__list-meta" as="span" fontSize="sm" display="inline">
                        (Page {page} of {totalPages})
                    </Text>
                </Heading>
                <HStack className="explorer-home__pager" spacing={2}>
                    <Button title="First page" className="explorer-home__pager-btn" onClick={goToFirst} disabled={page === 1 || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                        |&lt;
                    </Button>
                    <Button className="explorer-home__pager-btn" onClick={goToPrevious} disabled={isFirstPage || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                        &lt;&lt;
                    </Button>
                    <Button className="explorer-home__pager-btn" onClick={goToNext} disabled={page === totalPages || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                        &gt;&gt;
                    </Button>
                    <Button title="Last page" className="explorer-home__pager-btn" onClick={goToLast} disabled={page === totalPages || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                        &gt;|
                    </Button>
                </HStack>
            </HStack>
            <List className="explorer-home__list-body" spacing={3} mt={0} pt={0} style={{ marginTop: '-5px' }}>
                {isInitialLoad ? (
                    // Show skeletons for initial load
                    Array(blocksPerPage).fill(0).map((_, index) => (
                        <ListItem key={index} transition="all 0.2s">
                            <AsciiBox className="explorer-home__list-item" p={2} borderRadius={BORDER_RADIUS} boxShadow="sm">
                                <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                                    <HStack spacing={4} w="full" minW="0">
                                        <Skeleton height="20px" width="20px" flexShrink={0} />
                                        <Skeleton height="20px" width="100px" />
                                        <Skeleton height="20px" width="100px" ml="auto" />
                                    </HStack>
                                    <HStack spacing={1}>
                                        <Skeleton height="20px" width="20px" flexShrink={0} />
                                        <Skeleton height="20px" width="180px" />
                                    </HStack>
                                </VStack>
                                <HStack spacing={4} w="full" display={{ base: 'none', md: 'flex' }}>
                                    <Skeleton height="20px" width="20px" />
                                    <Skeleton height="20px" width="120px" />
                                    <Skeleton height="20px" width="280px" />
                                    <Skeleton height="20px" width="120px" />
                                </HStack>
                            </AsciiBox>
                        </ListItem>
                    ))
                ) : (
                    blocks.map((block) => (
                        <ListItem
                            key={block.header.height}
                            onClick={() => goToBlock(block.header.height)}
                            cursor="pointer"
                            _hover={{ opacity: 0.8 }}
                            transition="all 0.2s"
                        >
                            <AsciiBox
                                className="explorer-home__list-item"
                                p={2}
                                borderRadius={BORDER_RADIUS}
                                boxShadow="sm"
                                fontFamily="mono"
                                fontSize="sm"
                                lineHeight="1.2"
                            >
                                <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                                    <HStack spacing={4} w="full" minW="0">
                                        <FontAwesomeIcon icon={faCube} flexShrink={0} />
                                        <Text className="explorer-home__block-height" flexShrink={0}>
                                            #{block.header.height}
                                        </Text>
                                        <Text flex="1" textAlign="right" minW="0" isTruncated>
                                            Tx Count: {block.num_txs}
                                        </Text>
                                    </HStack>
                                    <HStack spacing={1} className="explorer-home__list-time-row">
                                        <FontAwesomeIcon icon={faClock} color="grey" flexShrink={0} />
                                        <Text fontSize="sm">{formatDateTime(block.header.time)}</Text>
                                    </HStack>
                                </VStack>
                                <HStack spacing={4} w="full" display={{ base: 'none', md: 'flex' }}>
                                    <FontAwesomeIcon icon={faCube} />
                                    <Text w="120px" className="explorer-home__block-height">#{block.header.height}</Text>
                                    <HStack spacing={1} w="280px">
                                        <FontAwesomeIcon icon={faClock} color="grey" />
                                        <Text isTruncated>{formatDateTime(block.header.time)}</Text>
                                    </HStack>
                                    <Text w="120px">Tx Count: {block.num_txs}</Text>
                                </HStack>
                            </AsciiBox>
                        </ListItem>
                    ))
                )}
            </List>
            <HStack className="explorer-home__pager explorer-home__pager--bottom" mt={4} justify="flex-end">
                <Button title="First page" className="explorer-home__pager-btn" onClick={goToFirst} disabled={page === 1 || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                    |&lt;
                </Button>
                <Button className="explorer-home__pager-btn" onClick={goToPrevious} disabled={isFirstPage || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                    &lt;&lt;
                </Button>
                <Button className="explorer-home__pager-btn" onClick={goToNext} disabled={page === totalPages || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                    &gt;&gt;
                </Button>
                <Button title="Last page" className="explorer-home__pager-btn" onClick={goToLast} disabled={page === totalPages || loading} variant="ghost" fontFamily="mono" bg="transparent" border="none" _hover={{ bg: "transparent", color: "white" }} _active={{ bg: "transparent" }} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}>
                    &gt;|
                </Button>
            </HStack>
        </Box>
    );
}

export default BlocksPage;