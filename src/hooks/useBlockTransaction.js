import { isAbortError } from '../api';
import { fetchBlockTransactionAtIndex } from '../utils/blockTransactions';
import useAsyncResource from './useAsyncResource';

function useBlockTransaction(blockHeight, blockIndex) {
  const enabled = blockHeight != null && blockIndex != null && !Number.isNaN(Number(blockIndex));

  const {
    data: transaction,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const tx = await fetchBlockTransactionAtIndex(blockHeight, blockIndex, { signal });
        if (tx) return tx;
        throw new Error('Transaction not found in block');
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (err instanceof Error && err.message === 'Transaction not found in block') throw err;
        throw new Error(`Failed to fetch transaction: ${err.message}`);
      }
    },
    deps: [blockHeight, blockIndex],
    enabled,
    clearOnDisabled: true,
  });

  return { transaction, loading, error };
}

export default useBlockTransaction;
