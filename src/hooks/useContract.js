import { indexerGet, isAbortError, debugLog } from '../api';
import useAsyncResource from './useAsyncResource';

function useContract(contractId) {
  const {
    data: contract,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const id = contractId.startsWith('0x') ? contractId.slice(2) : contractId;
        return await indexerGet(`/contract?id=${encodeURIComponent(id)}`, { signal });
      } catch (err) {
        if (isAbortError(err)) throw err;
        debugLog('Error fetching contract:', err);
        throw new Error('Failed to fetch contract: ' + err.message);
      }
    },
    deps: [contractId],
    enabled: Boolean(contractId),
  });

  return { contract, loading, error };
}

export default useContract;
