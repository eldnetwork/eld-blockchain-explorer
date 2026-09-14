import { Box, Heading, Text, Button, Link } from '@chakra-ui/react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import './ExplorerDataPages.css';

function NotFoundPage({ title = 'Not found', detail } = {}) {
  const [params] = useSearchParams();
  const q = params.get('q');
  const message =
    detail ||
    (q
      ? `No matching block, transaction, account, validator, capacity provider, content, or namespace for “${q}”.`
      : 'This page does not exist.');

  return (
    <Box className="explorer-page" p={8} maxW="720px" mx="auto">
      <Heading as="h1" className="explorer-page__title" mb={4}>
        {title}
      </Heading>
      <Text className="explorer-page__muted" mb={6}>
        {message}
      </Text>
      <Button as={RouterLink} to="/" colorScheme="orange">
        Back to explorer
      </Button>
      {q ? (
        <Text mt={4} fontSize="sm" className="explorer-page__muted">
          Try a block height, <code>0x</code> transaction hash, account address, content id, or
          namespace slug.{' '}
          <Link as={RouterLink} to="/" textDecoration="underline">
            Search again
          </Link>
        </Text>
      ) : null}
    </Box>
  );
}

export default NotFoundPage;
