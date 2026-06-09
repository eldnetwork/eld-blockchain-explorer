import { useEffect, useState } from 'react';
import { API_URL } from '../config';

function usePinboardPostByPath(cadoPath) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      if (!cadoPath) {
        setPost(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ path: cadoPath });
        const response = await fetch(`${API_URL}/v1/pinboard/post?${params.toString()}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post not found');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setPost(data || null);
      } catch (err) {
        setError(`Failed to fetch pinboard post: ${err.message}`);
        setPost(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [cadoPath]);

  return { post, loading, error };
}

export default usePinboardPostByPath;
