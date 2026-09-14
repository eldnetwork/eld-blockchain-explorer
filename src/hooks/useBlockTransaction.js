import { useState, useEffect } from 'react';
import { isAbortError } from '../api';
import { fetchBlockTransactionAtIndex } from '../utils/blockTransactions';

function useBlockTransaction(blockHeight, blockIndex) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      if (blockHeight == null || blockIndex == null || Number.isNaN(Number(blockIndex))) {
        setTransaction(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await fetchBlockTransactionAtIndex(blockHeight, blockIndex, {
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        if (tx) {
          setTransaction(tx);
        } else {
          setError('Transaction not found in block');
        }
      } catch (err) {
        if (isAbortError(err) || ac.signal.aborted) return;
        setError(`Failed to fetch transaction: ${err.message}`);
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => ac.abort();
  }, [blockHeight, blockIndex]);

  return { transaction, loading, error };
}

export default useBlockTransaction;
