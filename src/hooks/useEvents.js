import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function useEvents(txid) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      if (!txid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/events?txid=${encodeURIComponent(txid)}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response formats
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
        console.error('Error fetching events:', err);
        setError('Failed to fetch events: ' + err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [txid]);

  return { events, loading, error };
}

export default useEvents;

