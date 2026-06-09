import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../config';

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

async function fetchNamespacesPage(limit, continuation) {
  const params = namespacesQueryParams(limit, continuation);
  const response = await fetch(`${API_URL}/v1/namespaces?${params}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();

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
function useNamespaces(pageSize = DEFAULT_PAGE_SIZE) {
  const [namespaces, setNamespaces] = useState([]);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    has_next: false,
    /** @type {number | null} */
    total: null,
  });
  const [boundaries, setBoundaries] = useState(
    /** @type {Continuation[]} */ ([null])
  );
  const [activePage, setActivePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pagerJumping, setPagerJumping] = useState(false);

  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(async (continuation, isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
      setError(null);
    }
    try {
      const lim = pageSizeRef.current;
      const { namespaces: rows, pagination: pag } = await fetchNamespacesPage(lim, continuation);
      setNamespaces(rows);
      setPagination({
        limit: pag.limit ?? lim,
        has_next: Boolean(pag.has_next),
        total: pag.total == null ? null : Number(pag.total),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setNamespaces([]);
    } finally {
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  const continuation = boundaries[activePage] ?? null;

  useEffect(() => {
    loadPage(continuation);
  }, [activePage, continuation, loadPage]);

  useEffect(() => {
    if (pagerJumping) {
      return undefined;
    }
    const id = setInterval(() => {
      loadPage(continuation, true);
    }, 5000);
    return () => clearInterval(id);
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
      const nextBoundaries = [null];
      let cont = null;
      for (;;) {
        if (!mountedRef.current) {
          return;
        }
        const { namespaces: rows, pagination: pag } = await fetchNamespacesPage(lim, cont);
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
      if (!mountedRef.current) {
        return;
      }
      const lastIdx = Math.max(0, nextBoundaries.length - 1);
      setBoundaries(nextBoundaries);
      setActivePage(lastIdx);
    } catch (err) {
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
    error,
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
