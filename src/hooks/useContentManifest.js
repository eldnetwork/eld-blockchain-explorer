import { useState, useEffect } from 'react';
import { indexerGet, isAbortError, debugLog } from '../api';

function useContentManifest(manifestId) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!manifestId) {
      setLoading(false);
      return undefined;
    }

    const ac = new AbortController();

    async function fetchManifest() {
      setLoading(true);
      setError(null);
      try {
        const data = await indexerGet(`/content/manifest/${encodeURIComponent(manifestId)}`, {
          signal: ac.signal,
        });
        setManifest(data);
      } catch (err) {
        if (isAbortError(err)) return;
        if (err.status === 404) {
          setError('Manifest not found');
        } else {
          debugLog('Error fetching manifest:', err);
          setError('Failed to fetch manifest: ' + err.message);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchManifest();
    return () => ac.abort();
  }, [manifestId]);

  return { manifest, loading, error };
}

export default useContentManifest;
