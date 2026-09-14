import { rpcAbciQuery } from '../api';
import useAsyncResource from './useAsyncResource';

const REFRESH_INTERVAL_MS = 10000;

async function fetchValidatorsOnce(signal) {
  const data = await rpcAbciQuery('active_validators', '', { signal });
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
  const { data, loading, error, isInitialLoad } = useAsyncResource({
    fetcher: fetchValidatorsOnce,
    deps: [],
    intervalMs: REFRESH_INTERVAL_MS,
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
