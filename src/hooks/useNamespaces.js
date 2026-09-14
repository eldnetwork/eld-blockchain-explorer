import { useState, useEffect, useCallback, useRef } from 'react';
import { indexerGet, isAbortError } from '../api';

const DEFAULT_PAGE_SIZE = 20;

/** @typedef {{ after_registered_height: number, after_namespace_slug: string } | null} Continuation */

function namespacesQueryParams(limit, continuation) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (continuation != null) {
    params.set('after_registered_height', String(continuation.after_registered_height));
    params.set('after_namespace_slug', continuation.after_namespace_slug);
  }
  return params;
}

async function fetchNamespacesPage(limit, continuation, { signal } = {}) {
  const params = namespacesQueryParams(limit, continuation);
  const data = await indexerGet(`/v1/namespaces?${params}`, { signal });

  if (!data.namespaces || !Array.isArray(data.namespaces)) {
    throw new Error('Invalid response format');
  }
  if (!data.pagination) {
    throw new Error('Missing pagination in response');
  }

  return {
    namespaces: data.namespaces,
    pagination: data.pagination,
  };
}

/**
 * Paginated GET /v1/namespaces: newest registrations first.
 *
 * @param {number} pageSize
 */
function continuationKey(continuation) {
  if (continuation == null) return 'root';
  return `${continuation.after_registered_height}:${continuation.after_namespace_slug}`;
}

function useNamespaces(pageSize = DEFAULT_PAGE_SIZE) {
  const [namespaces, setNamespaces] = useState([]);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    has_next: false,
    /** @type {number | null} */
    total: null,
  });
  const [boundaries, setBoundaries] = useState(/** @type {Continuation[]} */ ([null]));
  const [activePage, setActivePage] = useState(0);
  const [resolvedKey, setResolvedKey] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pagerJumping, setPagerJumping] = useState(false);

  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  const abortRef = useRef(/** @type {AbortController | null} */ (null));
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    abortRef.current = new AbortController();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const loadPage = useCallback(async (continuation, isRefresh = false, signal) => {
    try {
      const lim = pageSizeRef.current;
      const { namespaces: rows, pagination: pag } = await fetchNamespacesPage(lim, continuation, {
        signal,
      });
      if (signal?.aborted) return;
      setNamespaces(rows);
      setPagination({
        limit: pag.limit ?? lim,
        has_next: Boolean(pag.has_next),
        total: pag.total == null ? null : Number(pag.total),
      });
      setError(null);
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      setError(err instanceof Error ? err.message : String(err));
      setNamespaces([]);
    } finally {
      if (!isRefresh && !signal?.aborted) {
        setIsInitialLoad(false);
        setResolvedKey(continuationKey(continuation));
      }
    }
  }, []);

  const continuation = boundaries[activePage] ?? null;
  const requestKey = continuationKey(continuation);
  const loading = resolvedKey !== requestKey;
  const visibleError = resolvedKey === requestKey ? error : null;

  useEffect(() => {
    const ac = new AbortController();
    loadPage(continuation, false, ac.signal);
    return () => ac.abort();
  }, [activePage, continuation, loadPage]);

  useEffect(() => {
    if (pagerJumping) {
      return undefined;
    }
    const ac = new AbortController();
    const id = setInterval(() => {
      loadPage(continuation, true, ac.signal);
    }, 5000);
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, [continuation, loadPage, pagerJumping]);

  const goOlder = useCallback(() => {
    if (!namespaces.length || !pagination.has_next) return;
    const last = namespaces[namespaces.length - 1];
    const nextBoundary = {
      after_registered_height: last.registered_height,
      after_namespace_slug: last.namespace_slug,
    };
    const nextIdx = activePage + 1;
    setBoundaries((b) => [...b.slice(0, nextIdx), nextBoundary]);
    setActivePage(nextIdx);
  }, [namespaces, pagination.has_next, activePage]);

  const goNewer = useCallback(() => {
    setActivePage((p) => (p <= 0 ? 0 : p - 1));
  }, []);

  const goToFirst = useCallback(() => {
    setBoundaries([null]);
    setActivePage(0);
  }, []);

  const goToLast = useCallback(async () => {
    setPagerJumping(true);
    setError(null);
    try {
      const lim = pageSizeRef.current;
      const signal = abortRef.current?.signal;
      const nextBoundaries = [null];
      let cont = null;
      for (;;) {
        if (!mountedRef.current || signal?.aborted) {
          return;
        }
        const { namespaces: rows, pagination: pag } = await fetchNamespacesPage(lim, cont, {
          signal,
        });
        if (!rows.length) {
          break;
        }
        if (!pag.has_next) {
          break;
        }
        const last = rows[rows.length - 1];
        const nextB = {
          after_registered_height: last.registered_height,
          after_namespace_slug: last.namespace_slug,
        };
        nextBoundaries.push(nextB);
        cont = nextB;
      }
      if (!mountedRef.current || signal?.aborted) {
        return;
      }
      const lastIdx = Math.max(0, nextBoundaries.length - 1);
      setBoundaries(nextBoundaries);
      setActivePage(lastIdx);
    } catch (err) {
      if (isAbortError(err)) return;
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) {
        setPagerJumping(false);
      }
    }
  }, []);

  const canGoOlder = pagination.has_next && namespaces.length > 0;
  const canGoNewer = activePage > 0;
  const canGoFirst = activePage > 0;
  const canGoLast = canGoOlder;

  return {
    namespaces,
    pagination,
    loading,
    error: visibleError,
    isInitialLoad,
    activePage,
    pagerJumping,
    canGoOlder,
    canGoNewer,
    canGoFirst,
    canGoLast,
    goOlder,
    goNewer,
    goToFirst,
    goToLast,
    refetch: () => loadPage(continuation),
  };
}

export default useNamespaces;
