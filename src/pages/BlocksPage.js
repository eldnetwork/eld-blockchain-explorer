import { Box, Heading, HStack, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import BlocksList from '../components/BlocksList';
import './ExplorerDataPages.css';

/** Full-page blocks view (list widget + page chrome). */
function BlocksPage() {
  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">
          ← Explorer
        </Link>
        <Text className="explorer-page__crumb-sep">Blocks</Text>
      </HStack>
      <Heading as="h1" className="explorer-page__title">
        BLOCKS
      </Heading>
      <BlocksList />
    </Box>
  );
}

export default BlocksPage;
