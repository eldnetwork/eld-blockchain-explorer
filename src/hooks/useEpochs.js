import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../config';

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

async function fetchEpochsPage(limit, afterEpoch, order = 'desc') {
  const params = epochsQueryParams(limit, afterEpoch, order);
  const response = await fetch(`${API_URL}/epochs?${params}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();

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
  const [boundaries, setBoundaries] = useState(
    /** @type {AfterEpochContinuation[]} */ ([null])
  );
  const [activePage, setActivePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pagerJumping, setPagerJumping] = useState(false);

  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;
  const orderRef = useRef(order);
  orderRef.current = order;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(async (afterEpoch, isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
      setError(null);
    }
    try {
      const lim = pageSizeRef.current;
      const ord = orderRef.current;
      const { epochs: rows, pagination: pag } = await fetchEpochsPage(lim, afterEpoch, ord);
      setEpochs(rows);
      setPagination({
        limit: pag.limit ?? lim,
        has_next: Boolean(pag.has_next),
        total: pag.total == null ? null : Number(pag.total),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEpochs([]);
    } finally {
      if (!isRefresh) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  const afterEpoch = boundaries[activePage] ?? null;

  useEffect(() => {
    loadPage(afterEpoch);
  }, [activePage, afterEpoch, loadPage]);

  useEffect(() => {
    if (pagerJumping) {
      return undefined;
    }
    const id = setInterval(() => {
      loadPage(afterEpoch, true);
    }, 10000);
    return () => clearInterval(id);
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
      const nextBoundaries = [null];
      let cont = null;
      for (;;) {
        if (!mountedRef.current) {
          return;
        }
        const { epochs: rows, pagination: pag } = await fetchEpochsPage(lim, cont, ord);
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
