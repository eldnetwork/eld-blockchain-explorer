import { indexerGet, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

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
  const { data, loading, error } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const params = new URLSearchParams({
          order,
          page: String(page),
          page_size: String(pageSize),
        });
        const result = await indexerGet(`/v1/pinboard/posts?${params.toString()}`, { signal });
        const nextItems = Array.isArray(result?.items) ? result.items : [];
        const nextPagination = result?.pagination || {};
        return {
          items: nextItems,
          hasMore: Boolean(nextPagination.has_more),
          page: typeof nextPagination.page === 'number' ? nextPagination.page : page,
          pageSize:
            typeof nextPagination.page_size === 'number' ? nextPagination.page_size : pageSize,
          nextCursor: nextPagination.next_cursor ?? null,
        };
      } catch (err) {
        if (isAbortError(err)) throw err;
        throw new Error(`Failed to fetch pinboard posts: ${err.message}`);
      }
    },
    deps: [order, page, pageSize],
    initialData: {
      items: [],
      hasMore: false,
      page,
      pageSize,
      nextCursor: null,
    },
    resetDataOnError: true,
  });

  return {
    items: data?.items ?? [],
    hasMore: data?.hasMore ?? false,
    loading,
    error,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    nextCursor: data?.nextCursor ?? null,
  };
}

export default usePinboardPosts;
