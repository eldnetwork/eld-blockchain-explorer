import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { fetchBlockTxResults } from '../utils/blockTransactions';
import { deliverTxLogFromAbciResult, deliverTxFailureMessage } from '../utils/transactionStatus';

function useTransaction(hash) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransaction() {
      if (!hash) {
        setTransaction(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // API endpoint: /transaction?id={id} (using ? for first query parameter)
        // If the API requires &id=, it would be part of an existing query string
        const url = `${API_URL}/transaction?id=${encodeURIComponent(hash)}`;
        console.log('Fetching transaction from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Transaction data received:', data);
        
        // Handle different response structures
        const transaction = data.transaction || data.data || data;
        
        if (transaction && (transaction.id || transaction.tx)) {
          let merged = transaction;
          const status = String(transaction.status || '').toLowerCase();
          const hasLog = Boolean(deliverTxFailureMessage(transaction));
          if (
            status === 'failed' &&
            !hasLog &&
            transaction.block_height != null &&
            transaction.block_index != null
          ) {
            const results = await fetchBlockTxResults(Number(transaction.block_height));
            const rpcLog = deliverTxLogFromAbciResult(
              results?.[Number(transaction.block_index)]
            );
            if (rpcLog) {
              merged = { ...transaction, abci_log: rpcLog };
            }
          }
          setTransaction(merged);
        } else {
          setError('Transaction not found');
        }
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Failed to fetch transaction: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [hash]);

  return { transaction, loading, error };
}

export default useTransaction;