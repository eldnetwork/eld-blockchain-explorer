import { useState, useEffect } from 'react';
import { API_URL } from '../config';

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
  const [namespace, setNamespace] = useState(
    /** @type {NamespaceDetail | null} */ (null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!namespaceSlug?.trim()) {
      setNamespace(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const slug = encodeURIComponent(namespaceSlug.trim());
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setNamespace(null);

      try {
        const response = await fetch(`${API_URL}/v1/namespace/${slug}`, {
          signal: ac.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setNamespace(data);
          return;
        }

        if (response.status === 404 && data.registered === false) {
          setNamespace(data);
          return;
        }

        const message =
          data.message ||
          data.details ||
          `HTTP ${response.status}: ${response.statusText}`;
        setError(message);
      } catch (err) {
        if (ac.signal.aborted) return;
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
