import { rpcGet, indexerGet } from '../api';
import useAsyncResource from './useAsyncResource';

/**
 * @typedef {Object} VerifiedProofRewardsResponse
 * @property {string} capacity_provider
 * @property {number} from_height
 * @property {number} to_height
 * @property {number} successful_proofs
 * @property {string} total_rewards
 */

/**
 * @param {string | null} normalizedAddress - 0x + 40 hex (lowercase), or null to skip
 * @returns {{ data: VerifiedProofRewardsResponse | null, loading: boolean, error: string | null }}
 */
function useVerifiedProofRewards(normalizedAddress) {
  const { data, loading, error } = useAsyncResource({
    fetcher: async (signal) => {
      const statusJson = await rpcGet('/status', { signal });
      const latestRaw = statusJson.result?.sync_info?.latest_block_height;
      const toHeight = parseInt(String(latestRaw), 10);
      if (!Number.isFinite(toHeight) || toHeight < 0) {
        throw new Error('Invalid latest_block_height from RPC');
      }

      const params = new URLSearchParams({ from_height: '0', to_height: String(toHeight) });
      return indexerGet(
        `/v1/capacity/verified-proof-rewards/${encodeURIComponent(normalizedAddress)}?${params.toString()}`,
        { signal },
      );
    },
    deps: [normalizedAddress],
    enabled: Boolean(normalizedAddress),
    clearOnDisabled: true,
    resetDataOnError: true,
    errorMessage: (err) => (err instanceof Error ? err.message : String(err)),
  });

  return { data, loading, error };
}

export default useVerifiedProofRewards;
