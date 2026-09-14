import { useState, useEffect } from 'react';
import { rpcGet, isAbortError, debugLog } from '../api';

function useChainId() {
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();

    async function fetchChainId() {
      try {
        const data = await rpcGet('/status', { signal: ac.signal });
        if (data.result?.node_info?.network) {
          setChainId(data.result.node_info.network);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        debugLog('Error fetching chain ID:', err);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchChainId();
    return () => ac.abort();
  }, []);

  return { chainId, loading };
}

export default useChainId;
