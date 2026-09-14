import { indexerGet, isAbortError, debugLog } from '../api';
import useAsyncResource from './useAsyncResource';

function useContent(contentId) {
  const {
    data: content,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        return await indexerGet(`/content/${encodeURIComponent(contentId)}`, { signal });
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (err.status === 404) {
          throw new Error('Content not found');
        }
        debugLog('Error fetching content:', err);
        throw new Error('Failed to fetch content: ' + err.message);
      }
    },
    deps: [contentId],
    enabled: Boolean(contentId),
  });

  return { content, loading, error };
}

export default useContent;
