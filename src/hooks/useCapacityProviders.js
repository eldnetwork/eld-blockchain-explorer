import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';
import { fetchWithRetry } from '../utils/retryFetch';

const REFRESH_INTERVAL_MS = 10000;

async function abciQuery(path) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'abci_query',
      params: {
        path: path,
        data: '',
        prove: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ABCI query failed (${response.status})`);
  }

  const data = await response.json();
  if (data.result?.response?.info) {
    return JSON.parse(data.result.response.info);
  }
  throw new Error('Invalid response format');
}

async function fetchProvidersOnce() {
  return abciQuery('active_storage_providers');
}

function useCapacityProviders() {
  const [activeProviders, setActiveProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [activeTotalStake, setActiveTotalStake] = useState(0);
  const [activeTotalCapacity, setActiveTotalCapacity] = useState(0);
  const [allTotalStake, setAllTotalStake] = useState(0);
  const [allTotalCapacity, setAllTotalCapacity] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId = null;

    async function fetchProviders(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      const result = await fetchWithRetry(fetchProvidersOnce, {
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchProviders(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (!result.ok || cancelled) return;

      const data = result.value;
      setActiveProviders(data.active_providers || []);
      setAllProviders(data.all_providers || []);
      setActiveTotalStake(data.active_total_stake || 0);
      setActiveTotalCapacity(data.active_total_capacity || 0);
      setAllTotalStake(data.all_total_stake || 0);
      setAllTotalCapacity(data.all_total_capacity || 0);
      setCurrentEpoch(data.current_epoch || 0);
      setError(null);
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchProviders();

    const intervalId = setInterval(() => {
      fetchProviders(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  return {
    activeProviders,
    allProviders,
    activeTotalStake,
    activeTotalCapacity,
    allTotalStake,
    allTotalCapacity,
    currentEpoch,
    loading,
    error,
    isInitialLoad,
  };
}

export default useCapacityProviders;
