import { rpcGet } from '../api';
import useAsyncResource from './useAsyncResource';

const REFRESH_INTERVAL_MS = 2000;

async function fetchEpochInfoOnce(signal) {
  // height=0 is part of the original query; use full path rather than rpcAbciQuery.
  const data = await rpcGet('/abci_query?path="epoch_info"&data=""&height=0&prove=false', {
    signal,
  });
  if (!data.result?.response?.info) {
    throw new Error('No epoch info in response');
  }
  return JSON.parse(data.result.response.info);
}

function useEpochInfo() {
  const {
    data: epochInfo,
    loading,
    isInitialLoad,
  } = useAsyncResource({
    fetcher: fetchEpochInfoOnce,
    deps: [],
    intervalMs: REFRESH_INTERVAL_MS,
    retry: true,
    errorMessage: 'Failed to load epoch info',
  });

  return { epochInfo, loading, isInitialLoad };
}

export default useEpochInfo;
