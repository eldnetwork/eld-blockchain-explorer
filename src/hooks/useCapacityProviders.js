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
  const queryResponse = data.result?.response;
  if (queryResponse?.code && queryResponse.code !== 0) {
    throw new Error(queryResponse.log || 'ABCI query returned error');
  }
  if (queryResponse?.info) {
    return JSON.parse(queryResponse.info);
  }
  throw new Error('Invalid response format');
}

async function fetchProvidersOnce() {
  return abciQuery('capacity_validators');
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

      if (!result.ok || cancelled) {
        if (!isRefresh && !cancelled) {
          setLoading(false);
          setIsInitialLoad(false);
          setError('Failed to load capacity providers');
        }
        return;
      }

      const data = result.value;
      const providers = data.capacity_validators || data.all_providers || data.active_providers || [];
      const totalStake = data.total_stake || data.all_total_stake || data.active_total_stake || 0;
      const totalCapacity =
        data.total_capacity || data.all_total_capacity || data.active_total_capacity || 0;

      // `capacity_validators` is now the canonical list; mirror to active/all
      // so existing UI surfaces continue to work.
      setActiveProviders(providers);
      setAllProviders(providers);
      setActiveTotalStake(totalStake);
      setActiveTotalCapacity(totalCapacity);
      setAllTotalStake(totalStake);
      setAllTotalCapacity(totalCapacity);
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
