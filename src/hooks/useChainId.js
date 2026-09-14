import { rpcGet, isAbortError, debugLog } from '../api';
import useAsyncResource from './useAsyncResource';

function useChainId() {
  const { data: chainId, loading } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const data = await rpcGet('/status', { signal });
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
