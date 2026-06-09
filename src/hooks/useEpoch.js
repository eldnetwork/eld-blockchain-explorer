import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function useEpoch(epochRef = 'current') {
  const [epoch, setEpoch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEpoch() {
      if (!epochRef) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/epoch/${encodeURIComponent(epochRef)}`);
        if (!response.ok) {
          throw new Error(`Epoch not found (${response.status})`);
        }
        const data = await response.json();
        setEpoch(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch epoch');
        setEpoch(null);
      } finally {
        setLoading(false);
      }
    }

    fetchEpoch();
  }, [epochRef]);

  return { epoch, loading, error };
}

export default useEpoch;
