import { useState, useEffect } from 'react';
import { rpcAbciQuery } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';

const REFRESH_INTERVAL_MS = 10000;

async function fetchValidatorsOnce(signal) {
  const data = await rpcAbciQuery('active_validators', '', { signal });
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
    const ac = new AbortController();

    async function fetchValidators(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      const result = await fetchWithRetry(() => fetchValidatorsOnce(ac.signal), {
        signal: ac.signal,
        cancelled: () => cancelled,
        isRefresh,
        onExhausted: () => {
          retryTimeoutId = setTimeout(() => {
            if (!cancelled) fetchValidators(false);
          }, REFRESH_INTERVAL_MS);
        },
      });

      if (cancelled || result.aborted) return;
      if (!result.ok) {
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
      ac.abort();
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  return { validators, totalStake, currentEpoch, loading, error, isInitialLoad };
}

export default useValidators;
