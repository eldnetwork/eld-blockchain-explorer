import { rpcGet } from '../api';
import { cachedFetch } from '../api/queryCache';
import useAsyncResource from './useAsyncResource';
import useLatestHeight from './useLatestHeight';

async function fetchEpochInfoOnce() {
  // height=0 is part of the original query; use full path rather than rpcAbciQuery.
  const data = await rpcGet('/abci_query?path="epoch_info"&data=""&height=0&prove=false');
  if (!data.result?.response?.info) {
    throw new Error('No epoch info in response');
  }
  return JSON.parse(data.result.response.info);
}

function useEpochInfo() {
  const latestHeight = useLatestHeight();
  const {
    data: epochInfo,
    loading,
    isInitialLoad,
  } = useAsyncResource({
    enabled: latestHeight > 0,
    fetcher: () =>
      cachedFetch(`epoch_info:${latestHeight}`, () => fetchEpochInfoOnce(), { ttlMs: 2000 }),
    deps: [],
    refreshKey: latestHeight,
    retry: true,
    errorMessage: 'Failed to load epoch info',
  });

  return { epochInfo, loading, isInitialLoad };
}

export default useEpochInfo;
