import { indexerGet, debugLog } from '../api';
import { fetchBlockTxResults } from '../utils/blockTransactions';
import { deliverTxLogFromAbciResult, deliverTxFailureMessage } from '../utils/transactionStatus';
import useAsyncResource from './useAsyncResource';

function useTransaction(hash) {
  const {
    data: transaction,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      debugLog('Fetching transaction', hash);
      const data = await indexerGet(`/transaction?id=${encodeURIComponent(hash)}`, { signal });
      const tx = data.transaction || data.data || data;
      if (!tx || !(tx.id || tx.tx)) {
        throw new Error('Transaction not found');
      }

      let merged = tx;
      const status = String(tx.status || '').toLowerCase();
      const hasLog = Boolean(deliverTxFailureMessage(tx));
      if (status === 'failed' && !hasLog && tx.block_height != null && tx.block_index != null) {
        const results = await fetchBlockTxResults(Number(tx.block_height), { signal });
        const rpcLog = deliverTxLogFromAbciResult(results?.[Number(tx.block_index)]);
        if (rpcLog) {
          merged = { ...tx, abci_log: rpcLog };
        }
      }
      return merged;
    },
    deps: [hash],
    enabled: Boolean(hash),
    retry: true,
    clearOnDisabled: true,
    errorMessage: 'Failed to fetch transaction',
  });

  return { transaction, loading, error };
}

export default useTransaction;
