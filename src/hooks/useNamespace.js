import { useState, useEffect } from 'react';
import { indexerGet, isAbortError } from '../api';

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
  const [namespace, setNamespace] = useState(/** @type {NamespaceDetail | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!namespaceSlug?.trim()) {
      setNamespace(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const trimmed = namespaceSlug.trim();
    const slug = encodeURIComponent(trimmed);
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setNamespace(null);

      try {
        const data = await indexerGet(`/v1/namespace/${slug}`, { signal: ac.signal });
        setNamespace(data);
      } catch (err) {
        if (isAbortError(err) || ac.signal.aborted) return;
        // Indexer returns 404 with `{ registered: false, ... }` for unknown slugs.
        if (err.status === 404) {
          setNamespace({ registered: false, namespace_slug: trimmed });
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => ac.abort();
  }, [namespaceSlug]);

  return { namespace, loading, error };
}

export default useNamespace;
