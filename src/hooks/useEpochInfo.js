import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';
import { fetchWithRetry } from '../utils/retryFetch';

const REFRESH_INTERVAL_MS = 2000;

async function fetchEpochInfoOnce() {
  const response = await fetch(
    `${RPC_URL}/abci_query?path="epoch_info"&data=""&height=0&prove=false`
  );
  if (!response.ok) {
    throw new Error(`Epoch info request failed (${response.status})`);
  }
  const data = await response.json();
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

    async function fetchEpochInfo(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
      }

      const result = await fetchWithRetry(fetchEpochInfoOnce, {
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchEpochInfo(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (!result.ok || cancelled) return;

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
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  return { epochInfo, loading, isInitialLoad };
}

export default useEpochInfo;
