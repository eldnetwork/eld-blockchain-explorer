import { indexerGet, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

/**
 * @typedef {object} NamespaceDetail
 * @property {boolean} registered
 * @property {string} namespace_slug
 * @property {string} [scope]
 * @property {string} [owner]
 * @property {number} [registered_height]
 * @property {string} [registry_path]
 * @property {string} [message]
 * @property {string} [details]
 */

/**
 * @param {string | undefined} namespaceSlug
 */
function useNamespace(namespaceSlug) {
  const trimmed = namespaceSlug?.trim() || '';

  const {
    data: namespace,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const slug = encodeURIComponent(trimmed);
        return await indexerGet(`/v1/namespace/${slug}`, { signal });
      } catch (err) {
        if (isAbortError(err) || err?.status === 404) {
          if (err?.status === 404) {
            return { registered: false, namespace_slug: trimmed };
          }
          throw err;
        }
        throw new Error(err instanceof Error ? err.message : String(err));
      }
    },
    deps: [trimmed],
    enabled: Boolean(trimmed),
    clearOnDisabled: true,
  });

  return { namespace, loading, error };
}

export default useNamespace;
