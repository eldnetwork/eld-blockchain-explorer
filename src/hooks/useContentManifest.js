import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function useContentManifest(manifestId) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchManifest() {
      if (!manifestId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/content/manifest/${encodeURIComponent(manifestId)}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Manifest not found');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          setManifest(data);
        }
      } catch (err) {
        console.error('Error fetching manifest:', err);
        setError('Failed to fetch manifest: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchManifest();
  }, [manifestId]);

  return { manifest, loading, error };
}

export default useContentManifest;

