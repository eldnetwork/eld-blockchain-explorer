import { rpcAbciQuery } from '../api';
import { cachedFetch } from '../api/queryCache';
import useAsyncResource from './useAsyncResource';
import useLatestHeight from './useLatestHeight';

const SLOW_POLL_MS = 30_000;
const HEIGHT_JUMP = 20;

async function fetchProvidersOnce() {
  const data = await rpcAbciQuery('capacity_validators', '');
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
  const latestHeight = useLatestHeight();
  const { data, loading, error, isInitialLoad } = useAsyncResource({
    fetcher: () =>
      cachedFetch(
        'capacity_validators',
        async () => {
          const parsed = await fetchProvidersOnce();
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
        { ttlMs: 4000 },
      ),
    deps: [],
    intervalMs: SLOW_POLL_MS,
    refreshKey: Math.floor(latestHeight / HEIGHT_JUMP),
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
