import { rpcAbciQuery } from '../api';
import useAsyncResource from './useAsyncResource';

const REFRESH_INTERVAL_MS = 10000;

async function fetchProvidersOnce(signal) {
  const data = await rpcAbciQuery('capacity_validators', '', { signal });
  const queryResponse = data.result?.response;
  if (queryResponse?.code && queryResponse.code !== 0) {
    throw new Error(queryResponse.log || 'ABCI query returned error');
  }
  if (queryResponse?.info) {
    return JSON.parse(queryResponse.info);
  }
  throw new Error('Invalid response format');
}

function useCapacityProviders() {
  const { data, loading, error, isInitialLoad } = useAsyncResource({
    fetcher: async (signal) => {
      const parsed = await fetchProvidersOnce(signal);
      const providers =
        parsed.capacity_validators || parsed.all_providers || parsed.active_providers || [];
      const totalStake =
        parsed.total_stake || parsed.all_total_stake || parsed.active_total_stake || 0;
      const totalCapacity =
        parsed.total_capacity || parsed.all_total_capacity || parsed.active_total_capacity || 0;
      return {
        providers,
        totalStake,
        totalCapacity,
        currentEpoch: parsed.current_epoch || 0,
      };
    },
    deps: [],
    intervalMs: REFRESH_INTERVAL_MS,
    retry: true,
    errorMessage: 'Failed to load capacity providers',
  });

  return {
    activeProviders: data?.providers || [],
    allProviders: data?.providers || [],
    activeTotalStake: data?.totalStake || 0,
    activeTotalCapacity: data?.totalCapacity || 0,
    allTotalStake: data?.totalStake || 0,
    allTotalCapacity: data?.totalCapacity || 0,
    currentEpoch: data?.currentEpoch || 0,
    loading,
    error,
    isInitialLoad,
  };
}

export default useCapacityProviders;
