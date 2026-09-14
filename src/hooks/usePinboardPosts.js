import { useEffect, useState } from 'react';
import { indexerGet, isAbortError } from '../api';

const DEFAULT_PAGE_SIZE = 20;

async function pinboardPostsPageHasItems(pageIndex, pageSize, order, { signal } = {}) {
  const params = new URLSearchParams({
    order,
    page: String(pageIndex),
    page_size: String(pageSize),
  });
  try {
    const data = await indexerGet(`/v1/pinboard/posts?${params.toString()}`, { signal });
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.length > 0;
  } catch (err) {
    if (isAbortError(err)) throw err;
    return false;
  }
}

/**
 * Largest 0-based page index with at least one post (exponential probe + binary search).
 * @param {number} pageSize
 * @param {string} order
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function findLastPinboardPostsPageIndex(pageSize, order, { signal } = {}) {
  if (!(await pinboardPostsPageHasItems(0, pageSize, order, { signal }))) {
    return 0;
  }
  let lo = 0;
  let hi = 1;
  while (await pinboardPostsPageHasItems(hi, pageSize, order, { signal })) {
    lo = hi;
    hi *= 2;
    if (hi > 1_000_000) {
      break;
    }
  }
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await pinboardPostsPageHasItems(mid, pageSize, order, { signal })) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function usePinboardPosts(page = 0, pageSize = DEFAULT_PAGE_SIZE, order = 'desc') {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page,
    page_size: pageSize,
    next_cursor: null,
  });

  useEffect(() => {
    const ac = new AbortController();

    async function fetchPosts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          order,
          page: String(page),
          page_size: String(pageSize),
        });
        const data = await indexerGet(`/v1/pinboard/posts?${params.toString()}`, {
          signal: ac.signal,
        });
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const nextPagination = data?.pagination || {};

        setItems(nextItems);
        setHasMore(Boolean(nextPagination.has_more));
        setPagination({
          page: typeof nextPagination.page === 'number' ? nextPagination.page : page,
          page_size:
            typeof nextPagination.page_size === 'number' ? nextPagination.page_size : pageSize,
          next_cursor: nextPagination.next_cursor ?? null,
        });
      } catch (err) {
        if (isAbortError(err)) return;
        setError(`Failed to fetch pinboard posts: ${err.message}`);
        setItems([]);
        setHasMore(false);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchPosts();
    return () => ac.abort();
  }, [order, page, pageSize]);

  return {
    items,
    hasMore,
    loading,
    error,
    page: pagination.page,
    pageSize: pagination.page_size,
    nextCursor: pagination.next_cursor,
  };
}

export default usePinboardPosts;
