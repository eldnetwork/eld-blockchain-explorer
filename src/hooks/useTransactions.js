import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../config';

const DEFAULT_PAGE_SIZE = 20;

/** @typedef {{ after_height: number, after_index: number } | null} Continuation */

function transactionsQueryParams(limit, continuation) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (continuation != null) {
    params.set('after_height', String(continuation.after_height));
    params.set('after_index', String(continuation.after_index));
  }
  return params;
}

async function fetchTransactionsPage(limit, continuation) {
  const params = transactionsQueryParams(limit, continuation);
  const response = await fetch(`${API_URL}/transactions?${params}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();

  if (!data.transactions || !Array.isArray(data.transactions)) {
    throw new Error('Invalid response format');
  }
  if (!data.pagination) {
    throw new Error('Missing pagination in response');
  }

  const sorted = [...data.transactions].sort((a, b) => {
    const ha = a.block_height ?? 0;
    const hb = b.block_height ?? 0;
    if (hb !== ha) return hb - ha;
    const ia = a.block_index ?? 0;
    const ib = b.block_index ?? 0;
    return ib - ia;
  });

  return {
    transactions: sorted,
    pagination: data.pagination,
  };
}

/**
 * Chronological GET /transactions: first page omits after_*; older pages send after_* from last row.
 *
 * @param {number} pageSize
 */
function useTransactions(pageSize = DEFAULT_PAGE_SIZE) {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    has_next: false,
    /** @type {number | null} */
    total: null,
  });
  /** `boundaries[i]` — continuation tuple for fetching slice `i` (`boundaries[0]` is always null). */
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
      const { transactions: txs, pagination: pag } = await fetchTransactionsPage(lim, continuation);
      setTransactions(txs);
      setPagination({
        limit: pag.limit ?? lim,
        has_next: Boolean(pag.has_next),
        total: pag.total == null ? null : Number(pag.total),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTransactions([]);
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
    if (!transactions.length || !pagination.has_next) return;
    const last = transactions[transactions.length - 1];
    const nextBoundary = {
      after_height: last.block_height,
      after_index: last.block_index,
    };
    const nextIdx = activePage + 1;
    setBoundaries((b) => [...b.slice(0, nextIdx), nextBoundary]);
    setActivePage(nextIdx);
  }, [transactions, pagination.has_next, activePage]);

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
        const { transactions: txs, pagination: pag } = await fetchTransactionsPage(lim, cont);
        if (!txs.length) {
          break;
        }
        if (!pag.has_next) {
          break;
        }
        const last = txs[txs.length - 1];
        const nextB = {
          after_height: last.block_height,
          after_index: last.block_index,
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

  const canGoOlder = pagination.has_next && transactions.length > 0;
  const canGoNewer = activePage > 0;
  const canGoFirst = activePage > 0;
  const canGoLast = canGoOlder;

  return {
    transactions,
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

export default useTransactions;
