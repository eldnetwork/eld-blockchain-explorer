import { rpcGet, isAbortError, debugLog } from '../api';
import useAsyncResource from './useAsyncResource';

function useTestnetAvailability() {
  const { data: isTestnetAvailable, loading: isChecking } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const data = await rpcGet('/status', { signal });
        return Boolean(data.result?.sync_info?.latest_block_height);
      } catch (err) {
        if (isAbortError(err)) throw err;
        debugLog('Error checking testnet availability:', err);
        return false;
      }
    },
    deps: [],
    intervalMs: 30000,
    initialData: true,
  });

  return { isTestnetAvailable, isChecking };
}

export default useTestnetAvailability;
