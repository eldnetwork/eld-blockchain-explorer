import { rpcAbciQuery } from '../api';
import { cachedFetch } from '../api/queryCache';
import useAsyncResource from './useAsyncResource';
import useLatestHeight from './useLatestHeight';

const SLOW_POLL_MS = 30_000;
const HEIGHT_JUMP = 20;

async function fetchValidatorsOnce() {
  const data = await rpcAbciQuery('active_validators', '');
  const queryResponse = data.result?.response;
  if (queryResponse?.code && queryResponse.code !== 0) {
    throw new Error(queryResponse.log || 'ABCI query returned error');
  }
  if (queryResponse?.info) {
    return JSON.parse(queryResponse.info);
  }
  throw new Error('Invalid response format');
}

function useValidators() {
  const latestHeight = useLatestHeight();
  const { data, loading, error, isInitialLoad } = useAsyncResource({
    fetcher: () => cachedFetch('active_validators', () => fetchValidatorsOnce(), { ttlMs: 4000 }),
    deps: [],
    intervalMs: SLOW_POLL_MS,
    refreshKey: Math.floor(latestHeight / HEIGHT_JUMP),
    retry: true,
    errorMessage: 'Failed to load validators',
  });

  return {
    validators: data?.validators || [],
    totalStake: data?.total_stake || 0,
    currentEpoch: data?.current_epoch || 0,
    loading,
    error,
    isInitialLoad,
  };
}

export default useValidators;
