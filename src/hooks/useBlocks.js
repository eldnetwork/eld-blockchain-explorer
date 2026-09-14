import { useState, useEffect } from 'react';
import { rpcGet } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';

const BLOCKS_PER_PAGE = 20;
const REFRESH_INTERVAL_MS = 10000;

function useBlocks(page) {
  const [blocks, setBlocks] = useState([]);
  const [lastHeight, setLastHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    let retryTimeoutId = null;

    async function fetchBlocksOnce() {
      const statusData = await rpcGet('/status', { signal: ac.signal });
      const latestHeight = parseInt(statusData.result.sync_info.latest_block_height, 10);
      const maxHeight = latestHeight - (page - 1) * BLOCKS_PER_PAGE;
      const minHeight = Math.max(0, maxHeight - BLOCKS_PER_PAGE + 1);

      const data = await rpcGet(`/blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`, {
        signal: ac.signal,
      });
      if (!data.result?.block_metas) {
        throw new Error('No blocks found');
      }

      const sortedBlocks = [...data.result.block_metas].sort(
        (a, b) => parseInt(b.header.height, 10) - parseInt(a.header.height, 10),
      );
      return { sortedBlocks, latestHeight };
    }

    async function fetchBlocks(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      const result = await fetchWithRetry(fetchBlocksOnce, {
        signal: ac.signal,
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchBlocks(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (cancelled || result.aborted) return;
      if (!result.ok) {
        if (!isRefresh) {
          setLoading(false);
          setIsInitialLoad(false);
          setError('Failed to load blocks');
        }
        return;
      }

      setBlocks(result.value.sortedBlocks);
      setLastHeight(result.value.latestHeight);
      setError(null);
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchBlocks();

    const intervalId = setInterval(() => {
      fetchBlocks(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      ac.abort();
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [page]);

  return { blocks, lastHeight, loading, error, isInitialLoad };
}

export default useBlocks;
