import { useState, useEffect } from 'react';
import { rpcGet, indexerGet, isAbortError } from '../api';

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!normalizedAddress) {
      setData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    (async () => {
      try {
        const statusJson = await rpcGet('/status', { signal: ac.signal });
        const latestRaw = statusJson.result?.sync_info?.latest_block_height;
        const toHeight = parseInt(String(latestRaw), 10);
        if (!Number.isFinite(toHeight) || toHeight < 0) {
          throw new Error('Invalid latest_block_height from RPC');
        }

        const params = new URLSearchParams({ from_height: '0', to_height: String(toHeight) });
        const rewardsJson = await indexerGet(
          `/v1/capacity/verified-proof-rewards/${encodeURIComponent(normalizedAddress)}?${params.toString()}`,
          { signal: ac.signal },
        );
        setData(rewardsJson);
        setError(null);
      } catch (err) {
        if (isAbortError(err)) return;
        setData(null);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [normalizedAddress]);

  return { data, loading, error };
}

export default useVerifiedProofRewards;
