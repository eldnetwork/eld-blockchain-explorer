import { indexerGet, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

function useEpoch(epochRef = 'current') {
  const {
    data: epoch,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        return await indexerGet(`/epoch/${encodeURIComponent(epochRef)}`, { signal });
      } catch (err) {
        if (isAbortError(err)) throw err;
        throw new Error(err.message || 'Failed to fetch epoch');
      }
    },
    deps: [epochRef],
    enabled: Boolean(epochRef),
    resetDataOnError: true,
  });

  return { epoch, loading, error };
}

export default useEpoch;
