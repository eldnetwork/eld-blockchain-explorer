import { useState, useEffect } from 'react';
import { indexerGet, isAbortError, debugLog } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';
import { fetchBlockTxResults } from '../utils/blockTransactions';
import { deliverTxLogFromAbciResult, deliverTxFailureMessage } from '../utils/transactionStatus';

function useTransaction(hash) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hash) {
      setTransaction(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const ac = new AbortController();
    let cancelled = false;

    async function fetchOnce() {
      debugLog('Fetching transaction', hash);
      const data = await indexerGet(`/transaction?id=${encodeURIComponent(hash)}`, {
        signal: ac.signal,
      });
      const tx = data.transaction || data.data || data;
      if (!tx || !(tx.id || tx.tx)) {
        throw new Error('Transaction not found');
      }

      let merged = tx;
      const status = String(tx.status || '').toLowerCase();
      const hasLog = Boolean(deliverTxFailureMessage(tx));
      if (status === 'failed' && !hasLog && tx.block_height != null && tx.block_index != null) {
        const results = await fetchBlockTxResults(Number(tx.block_height), { signal: ac.signal });
        const rpcLog = deliverTxLogFromAbciResult(results?.[Number(tx.block_index)]);
        if (rpcLog) {
          merged = { ...tx, abci_log: rpcLog };
        }
      }
      return merged;
    }

    async function run() {
      setLoading(true);
      setError(null);
      const result = await fetchWithRetry(fetchOnce, {
        signal: ac.signal,
        cancelled: () => cancelled,
      });
      if (cancelled || result.aborted) return;
      if (!result.ok) {
        setError('Failed to fetch transaction');
        setLoading(false);
        return;
      }
      setTransaction(result.value);
      setLoading(false);
    }

    run().catch((err) => {
      if (cancelled || isAbortError(err)) return;
      setError('Failed to fetch transaction: ' + err.message);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [hash]);

  return { transaction, loading, error };
}

export default useTransaction;
