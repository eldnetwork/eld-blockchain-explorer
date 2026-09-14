import { useState, useEffect } from 'react';
import { rpcGet } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';

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
  const [epochInfo, setEpochInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId = null;
    const ac = new AbortController();

    async function fetchEpochInfo(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
      }

      const result = await fetchWithRetry(() => fetchEpochInfoOnce(ac.signal), {
        signal: ac.signal,
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchEpochInfo(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (cancelled || result.aborted || !result.ok) return;

      setEpochInfo(result.value);
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchEpochInfo();

    const intervalId = setInterval(() => {
      fetchEpochInfo(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      ac.abort();
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  return { epochInfo, loading, isInitialLoad };
}

export default useEpochInfo;
