import { indexerGet } from '../api';
import useAsyncResource from './useAsyncResource';

const SUM_PATH = '/v1/capacity/verified-proof-rewards/sum';
const REFRESH_INTERVAL_MS = 10000;

function pickTotalRewards(payload) {
  if (payload == null || typeof payload !== 'object') return null;
  const raw =
    payload.total_rewards ?? payload.totalRewards ?? payload.sum ?? payload.total_reward_sum;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

async function fetchSumOnce(signal) {
  const data = await indexerGet(SUM_PATH, { signal });
  return pickTotalRewards(data);
}

/**
 * Chain-wide sum of verified proof rewards for capacity providers (indexer).
 * @returns {{ totalRewards: string | null, loading: boolean, error: string | null, isInitialLoad: boolean }}
 */
function useVerifiedProofRewardsSum() {
  const {
    data: totalRewards,
    loading,
    error,
    isInitialLoad,
  } = useAsyncResource({
    fetcher: fetchSumOnce,
    deps: [],
    intervalMs: REFRESH_INTERVAL_MS,
    retry: true,
    errorMessage: 'Failed to load verified proof rewards',
  });

  return { totalRewards, loading, error, isInitialLoad };
}

export default useVerifiedProofRewardsSum;
