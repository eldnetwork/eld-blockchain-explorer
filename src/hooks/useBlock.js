import { useState, useEffect } from 'react';
import { rpcGet, isAbortError } from '../api';

function useBlock(height) {
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!height) return undefined;

    const ac = new AbortController();

    async function fetchBlock() {
      setLoading(true);
      setError(null);
      try {
        const data = await rpcGet(`/block?height=${height}`, { signal: ac.signal });
        if (data.result && data.result.block) {
          setBlock(data.result.block);
        } else {
          setError('Block not found');
        }
      } catch (err) {
        if (isAbortError(err)) return;
        setError('Failed to fetch block: ' + err.message);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchBlock();
    return () => ac.abort();
  }, [height]);

  return { block, loading, error };
}

export default useBlock;
