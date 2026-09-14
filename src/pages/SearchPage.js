import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Text } from '@chakra-ui/react';
import { resolveSearchQuery } from '../utils/resolveSearch';
import { isAbortError } from '../api';
import NotFoundPage from './NotFoundPage';
import './ExplorerDataPages.css';

/**
 * Resolves `?q=` to a resource route, or shows no-results.
 */
function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setFailed(true);
      return undefined;
    }

    const ac = new AbortController();
    setFailed(false);

    resolveSearchQuery(q, { signal: ac.signal })
      .then((hit) => {
        if (ac.signal.aborted) return;
        if (hit?.path) {
          navigate(hit.path, { replace: true });
        } else {
          setFailed(true);
        }
      })
      .catch((err) => {
        if (isAbortError(err) || ac.signal.aborted) return;
        setFailed(true);
      });

    return () => ac.abort();
  }, [q, navigate]);

  if (failed) {
    return <NotFoundPage title="No results" />;
  }

  return (
    <Box className="explorer-page" p={8} textAlign="center">
      <Text className="explorer-page__muted">Searching…</Text>
    </Box>
  );
}

export default SearchPage;
