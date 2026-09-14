import { useState, useEffect } from 'react';
import { indexerGet, isAbortError } from '../api';

function useEpoch(epochRef = 'current') {
  const [epoch, setEpoch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!epochRef) return undefined;

    const ac = new AbortController();

    async function fetchEpoch() {
      setLoading(true);
      setError(null);
      try {
        const data = await indexerGet(`/epoch/${encodeURIComponent(epochRef)}`, {
          signal: ac.signal,
        });
        setEpoch(data);
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err.message || 'Failed to fetch epoch');
        setEpoch(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchEpoch();
    return () => ac.abort();
  }, [epochRef]);

  return { epoch, loading, error };
}

export default useEpoch;
