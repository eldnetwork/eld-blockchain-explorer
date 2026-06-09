import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { fetchWithRetry } from '../utils/retryFetch';

const SUM_PATH = '/v1/capacity/verified-proof-rewards/sum';
const REFRESH_INTERVAL_MS = 10000;

function pickTotalRewards(payload) {
  if (payload == null || typeof payload !== 'object') return null;
  const raw =
    payload.total_rewards ??
    payload.totalRewards ??
    payload.sum ??
    payload.total_reward_sum;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

async function fetchSumOnce(signal) {
  const res = await fetch(`${API_URL}${SUM_PATH}`, {
    signal,
    credentials: 'omit',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  return pickTotalRewards(data);
}

/**
 * Chain-wide sum of verified proof rewards for capacity providers (indexer).
 * @returns {{ totalRewards: string | null, loading: boolean, error: string | null, isInitialLoad: boolean }}
 */
function useVerifiedProofRewardsSum() {
  const [totalRewards, setTotalRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId = null;
    const ac = new AbortController();

    async function fetchSum(isRefresh = false) {
      if (!isRefresh) {
        setLoading(true);
        setError(null);
      }

      const result = await fetchWithRetry(
        () => fetchSumOnce(ac.signal),
        {
          cancelled: () => cancelled,
          isRefresh,
          onExhausted: () => {
            retryTimeoutId = setTimeout(() => {
              if (!cancelled) fetchSum(false);
            }, REFRESH_INTERVAL_MS);
          },
        }
      );

      if (!result.ok || cancelled) return;

      setTotalRewards(result.value);
      setError(null);
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchSum();

    const intervalId = setInterval(() => {
      fetchSum(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      ac.abort();
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  return { totalRewards, loading, error, isInitialLoad };
}

export default useVerifiedProofRewardsSum;
