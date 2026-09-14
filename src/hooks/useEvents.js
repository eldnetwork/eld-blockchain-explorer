import { useState, useEffect } from 'react';
import { indexerGet, isAbortError, debugLog } from '../api';

function useEvents(txid) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!txid) {
      setLoading(false);
      return undefined;
    }

    const ac = new AbortController();

    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const data = await indexerGet(`/events?txid=${encodeURIComponent(txid)}`, {
          signal: ac.signal,
        });

        if (Array.isArray(data)) {
          setEvents(data);
        } else if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        } else if (data.event) {
          setEvents([data.event]);
        } else {
          setEvents([]);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        debugLog('Error fetching events:', err);
        setError('Failed to fetch events: ' + err.message);
        setEvents([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchEvents();
    return () => ac.abort();
  }, [txid]);

  return { events, loading, error };
}

export default useEvents;
