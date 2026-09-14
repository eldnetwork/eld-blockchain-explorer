import { useState, useEffect, useCallback, useRef } from 'react';
import { indexerGet, isAbortError } from '../api';

const DEFAULT_PAGE_SIZE = 20;

/** @typedef {number | null} AfterEpochContinuation */

function epochsQueryParams(limit, afterEpoch, order) {
  const params = new URLSearchParams({
    limit: String(limit),
    order,
  });
  if (afterEpoch != null) {
    params.set('after_epoch', String(afterEpoch));
  }
  return params;
}

async function fetchEpochsPage(limit, afterEpoch, order = 'desc', { signal } = {}) {
  const params = epochsQueryParams(limit, afterEpoch, order);
  const data = await indexerGet(`/epochs?${params}`, { signal });

  if (!data.epochs || !Array.isArray(data.epochs)) {
    throw new Error('Invalid response format');
  }
  if (!data.pagination) {
    throw new Error('Missing pagination in response');
  }

  const sorted = [...data.epochs].sort((a, b) => {
    const ea = a.epoch ?? 0;
    const eb = b.epoch ?? 0;
    return order === 'asc' ? ea - eb : eb - ea;
  });

  return {
    epochs: sorted,
    pagination: data.pagination,
  };
}

/**
 * Cursor-paginated GET /epochs (newest first by default).
 *
 * @param {number} pageSize
 * @param {'desc' | 'asc'} order
 */
function useEpochs(pageSize = DEFAULT_PAGE_SIZE, order = 'desc') {
  const [epochs, setEpochs] = useState([]);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    has_next: false,
    /** @type {number | null} */
    total: null,
  });
  /** `boundaries[i]` — `after_epoch` for slice `i` (`boundaries[0]` is always null). */
  const [boundaries, setBoundaries] = useState(/** @type {AfterEpochContinuation[]} */ ([null]));
  const [activePage, setActivePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pagerJumping, setPagerJumping] = useState(false);

  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;
  const orderRef = useRef(order);
  orderRef.current = order;

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

  const loadPage = useCallback(async (afterEpoch, isRefresh = false, signal) => {
    if (!isRefresh) {
      setLoading(true);
      setError(null);
    }
    try {
      const lim = pageSizeRef.current;
      const ord = orderRef.current;
      const { epochs: rows, pagination: pag } = await fetchEpochsPage(lim, afterEpoch, ord, {
        signal,
      });
      if (signal?.aborted) return;
      setEpochs(rows);
      setPagination({
        limit: pag.limit ?? lim,
        has_next: Boolean(pag.has_next),
        total: pag.total == null ? null : Number(pag.total),
      });
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      setError(err instanceof Error ? err.message : String(err));
      setEpochs([]);
    } finally {
      if (!isRefresh && !signal?.aborted) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  const afterEpoch = boundaries[activePage] ?? null;

  useEffect(() => {
    const ac = new AbortController();
    loadPage(afterEpoch, false, ac.signal);
    return () => ac.abort();
  }, [activePage, afterEpoch, loadPage]);

  useEffect(() => {
    if (pagerJumping) {
      return undefined;
    }
    const ac = new AbortController();
    const id = setInterval(() => {
      loadPage(afterEpoch, true, ac.signal);
    }, 10000);
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, [afterEpoch, loadPage, pagerJumping]);

  const goOlder = useCallback(() => {
    if (!epochs.length || !pagination.has_next) return;
    const last = epochs[epochs.length - 1];
    const nextBoundary = last.epoch;
    const nextIdx = activePage + 1;
    setBoundaries((b) => [...b.slice(0, nextIdx), nextBoundary]);
    setActivePage(nextIdx);
  }, [epochs, pagination.has_next, activePage]);

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
      const ord = orderRef.current;
      const signal = abortRef.current?.signal;
      const nextBoundaries = [null];
      let cont = null;
      for (;;) {
        if (!mountedRef.current || signal?.aborted) {
          return;
        }
        const { epochs: rows, pagination: pag } = await fetchEpochsPage(lim, cont, ord, {
          signal,
        });
        if (!rows.length) {
          break;
        }
        if (!pag.has_next) {
          break;
        }
        const last = rows[rows.length - 1];
        nextBoundaries.push(last.epoch);
        cont = last.epoch;
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

  const canGoOlder = pagination.has_next && epochs.length > 0;
  const canGoNewer = activePage > 0;
  const canGoFirst = activePage > 0;
  const canGoLast = canGoOlder;

  return {
    epochs,
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
    refetch: () => loadPage(afterEpoch),
  };
}

export default useEpochs;
