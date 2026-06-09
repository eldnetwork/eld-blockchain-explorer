import { useState, useEffect } from 'react';
import { fetchBlockTransactionAtIndex } from '../utils/blockTransactions';

function useBlockTransaction(blockHeight, blockIndex) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (
        blockHeight == null ||
        blockIndex == null ||
        Number.isNaN(Number(blockIndex))
      ) {
        setTransaction(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await fetchBlockTransactionAtIndex(blockHeight, blockIndex);
        if (cancelled) return;
        if (tx) {
          setTransaction(tx);
        } else {
          setError('Transaction not found in block');
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to fetch transaction: ${err.message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [blockHeight, blockIndex]);

  return { transaction, loading, error };
}

export default useBlockTransaction;
