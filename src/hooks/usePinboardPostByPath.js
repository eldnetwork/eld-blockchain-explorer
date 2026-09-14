import { useState, useEffect } from 'react';
import { indexerGet, isAbortError } from '../api';

function usePinboardPostByPath(cadoPath) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cadoPath) {
      setPost(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const ac = new AbortController();

    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ path: cadoPath });
        const data = await indexerGet(`/v1/pinboard/post?${params.toString()}`, {
          signal: ac.signal,
        });
        setPost(data || null);
      } catch (err) {
        if (isAbortError(err)) return;
        if (err.status === 404) {
          setError('Failed to fetch pinboard post: Post not found');
        } else {
          setError(`Failed to fetch pinboard post: ${err.message}`);
        }
        setPost(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchPost();
    return () => ac.abort();
  }, [cadoPath]);

  return { post, loading, error };
}

export default usePinboardPostByPath;
