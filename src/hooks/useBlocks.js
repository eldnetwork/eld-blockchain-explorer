import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';

const BLOCKS_PER_PAGE = 20;
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 1000;
const REFRESH_INTERVAL_MS = 10000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function useBlocks(page) {
  const [blocks, setBlocks] = useState([]);
  const [lastHeight, setLastHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId = null;

    async function fetchBlocksOnce() {
      const statusResponse = await fetch(`${RPC_URL}/status`);
      if (!statusResponse.ok) {
        throw new Error(`Status request failed (${statusResponse.status})`);
      }
      const statusData = await statusResponse.json();
      const latestHeight = parseInt(statusData.result.sync_info.latest_block_height, 10);
      const maxHeight = latestHeight - ((page - 1) * BLOCKS_PER_PAGE);
      const minHeight = Math.max(0, maxHeight - BLOCKS_PER_PAGE + 1);

      const response = await fetch(
        `${RPC_URL}/blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`
      );
      if (!response.ok) {
        throw new Error(`Blockchain request failed (${response.status})`);
      }
      const data = await response.json();
      if (!data.result?.block_metas) {
        throw new Error('No blocks found');
      }

      const sortedBlocks = [...data.result.block_metas].sort(
        (a, b) => parseInt(b.header.height, 10) - parseInt(a.header.height, 10)
      );
      return { sortedBlocks, latestHeight };
    }

    async function fetchBlocks(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          const { sortedBlocks, latestHeight } = await fetchBlocksOnce();
          if (cancelled) return;

          setBlocks(sortedBlocks);
          setLastHeight(latestHeight);
          setError(null);
          if (!isRefresh) {
            setLoading(false);
            setIsInitialLoad(false);
          }
          return;
        } catch (err) {
          if (cancelled) return;

          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
            continue;
          }

          if (!isRefresh) {
            retryTimeoutId = setTimeout(() => {
              if (!cancelled) fetchBlocks(false);
            }, REFRESH_INTERVAL_MS);
          }
        }
      }
    }

    fetchBlocks();

    const intervalId = setInterval(() => {
      fetchBlocks(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [page]);

  return { blocks, lastHeight, loading, error, isInitialLoad };
}

export default useBlocks;