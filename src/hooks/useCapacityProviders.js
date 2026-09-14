import { useState, useEffect } from 'react';
import { rpcAbciQuery } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';

const REFRESH_INTERVAL_MS = 10000;

async function fetchProvidersOnce(signal) {
  const data = await rpcAbciQuery('capacity_validators', '', { signal });
  const queryResponse = data.result?.response;
  if (queryResponse?.code && queryResponse.code !== 0) {
    throw new Error(queryResponse.log || 'ABCI query returned error');
  }
  if (queryResponse?.info) {
    return JSON.parse(queryResponse.info);
  }
  throw new Error('Invalid response format');
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
    const ac = new AbortController();

    async function fetchProviders(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      const result = await fetchWithRetry(() => fetchProvidersOnce(ac.signal), {
        signal: ac.signal,
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchProviders(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (cancelled || result.aborted) return;
      if (!result.ok) {
        if (!isRefresh && !cancelled) {
          setLoading(false);
          setIsInitialLoad(false);
          setError('Failed to load capacity providers');
        }
        return;
      }

      const data = result.value;
      const providers =
        data.capacity_validators || data.all_providers || data.active_providers || [];
      const totalStake = data.total_stake || data.all_total_stake || data.active_total_stake || 0;
      const totalCapacity =
        data.total_capacity || data.all_total_capacity || data.active_total_capacity || 0;

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
      ac.abort();
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
