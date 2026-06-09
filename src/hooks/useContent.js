import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function useContent(contentId) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContent() {
      if (!contentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/content/${encodeURIComponent(contentId)}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Content not found');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          setContent(data);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to fetch content: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [contentId]);

  return { content, loading, error };
}

export default useContent;

