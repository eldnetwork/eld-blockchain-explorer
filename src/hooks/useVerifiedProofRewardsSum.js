import { indexerGet } from '../api';
import { cachedFetch } from '../api/queryCache';
import useAsyncResource from './useAsyncResource';
import useLatestHeight from './useLatestHeight';

const SUM_PATH = '/v1/capacity/verified-proof-rewards/sum';
const SLOW_POLL_MS = 30_000;
const HEIGHT_JUMP = 20;

function pickTotalRewards(payload) {
  if (payload == null || typeof payload !== 'object') return null;
  const raw =
    payload.total_rewards ?? payload.totalRewards ?? payload.sum ?? payload.total_reward_sum;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

async function fetchSumOnce() {
  const data = await indexerGet(SUM_PATH);
  return pickTotalRewards(data);
}

/**
 * Chain-wide sum of verified proof rewards for capacity providers (indexer).
 * @returns {{ totalRewards: string | null, loading: boolean, error: string | null, isInitialLoad: boolean }}
 */
function useVerifiedProofRewardsSum() {
  const latestHeight = useLatestHeight();
  const {
    data: totalRewards,
    loading,
    error,
    isInitialLoad,
  } = useAsyncResource({
    fetcher: () => cachedFetch('verified-proof-rewards-sum', () => fetchSumOnce(), { ttlMs: 4000 }),
    deps: [],
    intervalMs: SLOW_POLL_MS,
    refreshKey: Math.floor(latestHeight / HEIGHT_JUMP),
    retry: true,
    errorMessage: 'Failed to load verified proof rewards',
  });

  return { totalRewards, loading, error, isInitialLoad };
}

export default useVerifiedProofRewardsSum;
