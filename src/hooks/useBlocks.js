import { rpcGet } from '../api';
import { cachedFetch } from '../api/queryCache';
import useAsyncResource from './useAsyncResource';
import useLatestHeight from './useLatestHeight';

const BLOCKS_PER_PAGE = 20;

async function fetchBlocksOnce(page, latestHeight) {
  const maxHeight = latestHeight - (page - 1) * BLOCKS_PER_PAGE;
  const minHeight = Math.max(0, maxHeight - BLOCKS_PER_PAGE + 1);

  const data = await rpcGet(`/blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`);
  if (!data.result?.block_metas) {
    throw new Error('No blocks found');
  }

  const sortedBlocks = [...data.result.block_metas].sort(
    (a, b) => parseInt(b.header.height, 10) - parseInt(a.header.height, 10),
  );
  return { sortedBlocks, latestHeight };
}

function useBlocks(page) {
  const latestHeight = useLatestHeight();
  const { data, loading, error, isInitialLoad } = useAsyncResource({
    enabled: latestHeight > 0,
    fetcher: () =>
      cachedFetch(`blocks:${page}:${latestHeight}`, () => fetchBlocksOnce(page, latestHeight), {
        ttlMs: 4000,
      }),
    deps: [page],
    refreshKey: latestHeight,
    retry: true,
    errorMessage: 'Failed to load blocks',
  });

  return {
    blocks: data?.sortedBlocks ?? [],
    lastHeight: latestHeight || data?.latestHeight || 0,
    loading,
    error,
    isInitialLoad,
  };
}

export default useBlocks;
