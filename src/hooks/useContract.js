import { useState, useEffect } from 'react';
import { indexerGet, isAbortError, debugLog } from '../api';

function useContract(contractId) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contractId) {
      setLoading(false);
      return undefined;
    }

    const ac = new AbortController();

    async function fetchContract() {
      setLoading(true);
      setError(null);
      try {
        const id = contractId.startsWith('0x') ? contractId.slice(2) : contractId;
        const data = await indexerGet(`/contract?id=${encodeURIComponent(id)}`, {
          signal: ac.signal,
        });
        setContract(data);
      } catch (err) {
        if (isAbortError(err)) return;
        debugLog('Error fetching contract:', err);
        setError('Failed to fetch contract: ' + err.message);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchContract();
    return () => ac.abort();
  }, [contractId]);

  return { contract, loading, error };
}

export default useContract;
