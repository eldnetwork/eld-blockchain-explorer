import { indexerGet, isAbortError, debugLog } from '../api';
import useAsyncResource from './useAsyncResource';

function useEvents(txid) {
  const {
    data: events,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const data = await indexerGet(`/events?txid=${encodeURIComponent(txid)}`, { signal });
        if (Array.isArray(data)) return data;
        if (data.events && Array.isArray(data.events)) return data.events;
        if (data.event) return [data.event];
        return [];
      } catch (err) {
        if (isAbortError(err)) throw err;
        debugLog('Error fetching events:', err);
        throw new Error('Failed to fetch events: ' + err.message);
      }
    },
    deps: [txid],
    enabled: Boolean(txid),
    initialData: [],
    resetDataOnError: true,
  });

  return { events: events ?? [], loading, error };
}

export default useEvents;
