import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';
import { fetchWithRetry } from '../utils/retryFetch';

const REFRESH_INTERVAL_MS = 10000;

async function fetchValidatorsOnce() {
  const response = await fetch(
    `${RPC_URL}/abci_query?path="active_validators"&data=""&prove=false`
  );

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

function useValidators() {
  const [validators, setValidators] = useState([]);
  const [totalStake, setTotalStake] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId = null;

    async function fetchValidators(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      const result = await fetchWithRetry(fetchValidatorsOnce, {
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchValidators(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (!result.ok || cancelled) {
        if (!isRefresh && !cancelled) {
          setLoading(false);
          setIsInitialLoad(false);
          setError('Failed to load validators');
        }
        return;
      }

      const data = result.value;
      setValidators(data.validators || []);
      setTotalStake(data.total_stake || 0);
      setCurrentEpoch(data.current_epoch || 0);
      setError(null);
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchValidators();

    const intervalId = setInterval(() => {
      fetchValidators(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  return { validators, totalStake, currentEpoch, loading, error, isInitialLoad };
}

export default useValidators;
