import { useState, useEffect } from 'react';
import { indexerGet, isAbortError, debugLog } from '../api';

function useContent(contentId) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contentId) {
      setLoading(false);
      return undefined;
    }

    const ac = new AbortController();

    async function fetchContent() {
      setLoading(true);
      setError(null);
      try {
        const data = await indexerGet(`/content/${encodeURIComponent(contentId)}`, {
          signal: ac.signal,
        });
        setContent(data);
      } catch (err) {
        if (isAbortError(err)) return;
        if (err.status === 404) {
          setError('Content not found');
        } else {
          debugLog('Error fetching content:', err);
          setError('Failed to fetch content: ' + err.message);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchContent();
    return () => ac.abort();
  }, [contentId]);

  return { content, loading, error };
}

export default useContent;
