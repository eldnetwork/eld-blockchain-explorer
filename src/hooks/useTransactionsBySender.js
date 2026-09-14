import { indexerGet, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

const PAGE_LIMIT = 50;
/** Safety cap ~10k txs for one account fetch. */
const MAX_PAGES = 200;

async function fetchSenderPage(senderAddress, continuation, { signal } = {}) {
  const params = new URLSearchParams({
    limit: String(PAGE_LIMIT),
  });
  params.set('sender', senderAddress);
  if (continuation != null) {
    params.set('after_height', String(continuation.after_height));
    params.set('after_index', String(continuation.after_index));
  }
  return indexerGet(`/transactions?${params}`, { signal });
}

async function fetchAllSenderTransactions(senderAddress, signal) {
  const aggregated = [];
  let continuation = null;
  let pages = 0;

  while (pages < MAX_PAGES) {
    const data = await fetchSenderPage(senderAddress, continuation, { signal });
    if (signal.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    pages += 1;

    const batch = Array.isArray(data.transactions)
      ? data.transactions
      : Array.isArray(data)
        ? data
        : null;
    if (!batch) {
      throw new Error('Invalid response format');
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

  return aggregated;
}

function useTransactionsBySender(senderAddress) {
  const {
    data: transactions,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        return await fetchAllSenderTransactions(senderAddress, signal);
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (err instanceof Error && err.message === 'Invalid response format') throw err;
        throw new Error(
          'Failed to fetch transactions: ' + (err instanceof Error ? err.message : String(err)),
        );
      }
    },
    deps: [senderAddress],
    enabled: Boolean(senderAddress),
    initialData: [],
  });

  return { transactions: transactions ?? [], loading, error };
}

export default useTransactionsBySender;
