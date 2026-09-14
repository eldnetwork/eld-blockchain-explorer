import { indexerGet, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

function usePinboardPostByPath(cadoPath) {
  const {
    data: post,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const params = new URLSearchParams({ path: cadoPath });
        const data = await indexerGet(`/v1/pinboard/post?${params.toString()}`, { signal });
        return data || null;
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (err.status === 404) {
          throw new Error('Failed to fetch pinboard post: Post not found');
        }
        throw new Error(`Failed to fetch pinboard post: ${err.message}`);
      }
    },
    deps: [cadoPath],
    enabled: Boolean(cadoPath),
    clearOnDisabled: true,
    resetDataOnError: true,
  });

  return { post, loading, error };
}

export default usePinboardPostByPath;
