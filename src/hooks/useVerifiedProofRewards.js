import { useState, useEffect } from 'react';
import { API_URL, RPC_URL } from '../config';

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
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    (async () => {
      try {
        const statusRes = await fetch(`${RPC_URL}/status`, { signal: ac.signal, credentials: 'omit' });
        if (!statusRes.ok) {
          throw new Error(`RPC status HTTP ${statusRes.status}`);
        }
        const statusJson = await statusRes.json();
        const latestRaw = statusJson.result?.sync_info?.latest_block_height;
        const toHeight = parseInt(String(latestRaw), 10);
        if (!Number.isFinite(toHeight) || toHeight < 0) {
          throw new Error('Invalid latest_block_height from RPC');
        }

        const params = new URLSearchParams({ from_height: '0', to_height: String(toHeight) });
        const rewardsUrl = `${API_URL}/v1/capacity/verified-proof-rewards/${encodeURIComponent(
          normalizedAddress
        )}?${params.toString()}`;

        const rewardsRes = await fetch(rewardsUrl, { signal: ac.signal, credentials: 'omit' });
        if (!rewardsRes.ok) {
          throw new Error(`Rewards HTTP ${rewardsRes.status}`);
        }
        const rewardsJson = await rewardsRes.json();
        setData(rewardsJson);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
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
