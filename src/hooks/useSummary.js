import { fetchRpcSummary } from '../api';
import { cachedFetch } from '../api/queryCache';
import useAsyncResource from './useAsyncResource';
import useLatestHeight from './useLatestHeight';

const SUMMARY_POLL_MS = 8000;

function useSummary() {
  const latestHeight = useLatestHeight();
  const {
    data: summary,
    error,
    isInitialLoad,
  } = useAsyncResource({
    fetcher: () =>
      cachedFetch(
        latestHeight > 0 ? `rpc:summary:${latestHeight}` : 'rpc:summary',
        () => fetchRpcSummary(),
        { ttlMs: 2000 },
      ),
    deps: [],
    intervalMs: SUMMARY_POLL_MS,
    refreshKey: latestHeight > 0 ? latestHeight : undefined,
    retry: true,
  });

  return { summary, error, isInitialLoad };
}

export default useSummary;
