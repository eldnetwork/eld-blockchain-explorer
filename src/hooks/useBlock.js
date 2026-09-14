import { rpcGet, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

function useBlock(height) {
  const {
    data: block,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const data = await rpcGet(`/block?height=${height}`, { signal });
        if (data.result?.block) {
          return data.result.block;
        }
        throw new Error('Block not found');
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (err instanceof Error && err.message === 'Block not found') throw err;
        throw new Error('Failed to fetch block: ' + err.message);
      }
    },
    deps: [height],
    enabled: Boolean(height),
  });

  return { block, loading, error };
}

export default useBlock;
