import { rpcGet } from '../api';
import useAsyncResource from './useAsyncResource';

const BLOCKS_PER_PAGE = 20;
const REFRESH_INTERVAL_MS = 10000;

async function fetchBlocksOnce(page, signal) {
  const statusData = await rpcGet('/status', { signal });
  const latestHeight = parseInt(statusData.result.sync_info.latest_block_height, 10);
  const maxHeight = latestHeight - (page - 1) * BLOCKS_PER_PAGE;
  const minHeight = Math.max(0, maxHeight - BLOCKS_PER_PAGE + 1);

  const data = await rpcGet(`/blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`, {
    signal,
  });
  if (!data.result?.block_metas) {
    throw new Error('No blocks found');
  }

  const sortedBlocks = [...data.result.block_metas].sort(
    (a, b) => parseInt(b.header.height, 10) - parseInt(a.header.height, 10),
  );
  return { sortedBlocks, latestHeight };
}

function useBlocks(page) {
  const { data, loading, error, isInitialLoad } = useAsyncResource({
    fetcher: (signal) => fetchBlocksOnce(page, signal),
    deps: [page],
    intervalMs: REFRESH_INTERVAL_MS,
    retry: true,
    errorMessage: 'Failed to load blocks',
  });

  return {
    blocks: data?.sortedBlocks ?? [],
    lastHeight: data?.latestHeight ?? 0,
    loading,
    error,
    isInitialLoad,
  };
}

export default useBlocks;
