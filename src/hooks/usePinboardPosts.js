import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const DEFAULT_PAGE_SIZE = 20;

async function pinboardPostsPageHasItems(pageIndex, pageSize, order) {
  const params = new URLSearchParams({
    order,
    page: String(pageIndex),
    page_size: String(pageSize),
  });
  const response = await fetch(`${API_URL}/v1/pinboard/posts?${params.toString()}`);
  if (!response.ok) {
    return false;
  }
  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.length > 0;
}

/**
 * Largest 0-based page index with at least one post (exponential probe + binary search).
 */
export async function findLastPinboardPostsPageIndex(pageSize, order) {
  if (!(await pinboardPostsPageHasItems(0, pageSize, order))) {
    return 0;
  }
  let lo = 0;
  let hi = 1;
  while (await pinboardPostsPageHasItems(hi, pageSize, order)) {
    lo = hi;
    hi *= 2;
    if (hi > 1_000_000) {
      break;
    }
  }
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await pinboardPostsPageHasItems(mid, pageSize, order)) {
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
    async function fetchPosts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          order,
          page: String(page),
          page_size: String(pageSize),
        });
        const response = await fetch(`${API_URL}/v1/pinboard/posts?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const nextPagination = data?.pagination || {};

        setItems(nextItems);
        setHasMore(Boolean(nextPagination.has_more));
        setPagination({
          page: typeof nextPagination.page === 'number' ? nextPagination.page : page,
          page_size: typeof nextPagination.page_size === 'number' ? nextPagination.page_size : pageSize,
          next_cursor: nextPagination.next_cursor ?? null,
        });
      } catch (err) {
        setError(`Failed to fetch pinboard posts: ${err.message}`);
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
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
