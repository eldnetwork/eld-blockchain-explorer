import { Navigate, useSearchParams } from 'react-router-dom';
import { Box, Text } from '@chakra-ui/react';
import { resolveSearchQuery } from '../utils/resolveSearch';
import useAsyncResource from '../hooks/useAsyncResource';
import NotFoundPage from './NotFoundPage';
import './ExplorerDataPages.css';

/**
 * Resolves `?q=` to a resource route, or shows no-results.
 */
function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const trimmed = q.trim();
  const { data: hit, loading } = useAsyncResource({
    fetcher: (signal) => resolveSearchQuery(q, { signal }),
    deps: [q],
    enabled: Boolean(trimmed),
  });

  if (!trimmed || (!loading && !hit?.path)) {
    return <NotFoundPage title="No results" />;
  }

  if (hit?.path) {
    return <Navigate to={hit.path} replace />;
  }

  return (
    <Box className="explorer-page" p={8} textAlign="center">
      <Text className="explorer-page__muted">Searching…</Text>
    </Box>
  );
}

export default SearchPage;
