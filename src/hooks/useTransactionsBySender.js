import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const PAGE_LIMIT = 50;
/** Safety cap ~10k txs for one account fetch. */
const MAX_PAGES = 200;

async function fetchSenderPage(senderAddress, continuation) {
  const params = new URLSearchParams({
    limit: String(PAGE_LIMIT),
  });
  params.set('sender', senderAddress);
  if (continuation != null) {
    params.set('after_height', String(continuation.after_height));
    params.set('after_index', String(continuation.after_index));
  }
  const response = await fetch(`${API_URL}/transactions?${params}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function useTransactionsBySender(senderAddress) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      if (!senderAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const aggregated = [];
        let continuation = null;
        let pages = 0;

        while (pages < MAX_PAGES) {
          const data = await fetchSenderPage(senderAddress, continuation);
          pages += 1;

          const batch = Array.isArray(data.transactions)
            ? data.transactions
            : Array.isArray(data)
              ? data
              : null;
          if (!batch) {
            setError('Invalid response format');
            return;
          }
          aggregated.push(...batch);

          const hasNext =
            batch.length > 0 && data.pagination != null ? Boolean(data.pagination.has_next) : false;
          if (!hasNext) break;

          const last = batch[batch.length - 1];
          continuation = {
            after_height: last.block_height,
            after_index: last.block_index,
          };
        }

        aggregated.sort((a, b) => {
          const ha = a.block_height ?? 0;
          const hb = b.block_height ?? 0;
          if (hb !== ha) return hb - ha;
          const ia = a.block_index ?? 0;
          const ib = b.block_index ?? 0;
          return ib - ia;
        });

        setTransactions(aggregated);
      } catch (err) {
        setError('Failed to fetch transactions: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [senderAddress]);

  return { transactions, loading, error };
}

export default useTransactionsBySender;
