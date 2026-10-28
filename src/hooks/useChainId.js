import { fetchRpcStatus, isAbortError, debugLog } from '../api';
import useAsyncResource from './useAsyncResource';

function useChainId() {
  const { data: chainId, loading } = useAsyncResource({
    fetcher: async () => {
      try {
        const data = await fetchRpcStatus();
        return data.result?.node_info?.network ?? null;
      } catch (err) {
        if (isAbortError(err)) throw err;
        debugLog('Error fetching chain ID:', err);
        return null;
      }
    },
    deps: [],
  });

  return { chainId, loading };
}

export default useChainId;
