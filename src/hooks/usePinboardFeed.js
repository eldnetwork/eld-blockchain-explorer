import { rpcPost, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

const DEFAULT_PAGE_SIZE = 50;

function bytesToHex(bytes) {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

async function pinboardFeedQuery({ order, page, pageSize, signal }) {
  const payload = JSON.stringify({
    order,
    page,
    page_size: pageSize,
  });

  const bytes = new TextEncoder().encode(payload);
  const hexData = bytesToHex(bytes);

  return rpcPost(
    {
      id: -1,
      method: 'abci_query',
      params: {
        path: 'pinboard_feed',
        data: hexData,
        prove: false,
      },
    },
    { signal },
  );
}

function usePinboardFeed(order = 'desc', page = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const { data, loading, error } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const rpcData = await pinboardFeedQuery({ order, page, pageSize, signal });

        const code = rpcData?.result?.response?.code;
        if (code !== 0) {
          throw new Error(
            rpcData?.result?.response?.log ||
              rpcData?.result?.response?.info ||
              'Pinboard feed query failed',
          );
        }

        if (!rpcData?.result?.response?.info) {
          throw new Error('Missing response.info payload from pinboard_feed query');
        }

        const payload = JSON.parse(rpcData.result.response.info);
        return {
          items: Array.isArray(payload.items) ? payload.items : [],
          hasMore: Boolean(payload.has_more),
          page: typeof payload.page === 'number' ? payload.page : page,
          pageSize: typeof payload.page_size === 'number' ? payload.page_size : pageSize,
          order: typeof payload.order === 'string' ? payload.order : order,
        };
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (
          err instanceof Error &&
          (err.message === 'Missing response.info payload from pinboard_feed query' ||
            err.message === 'Pinboard feed query failed' ||
            !err.message.startsWith('HTTP'))
        ) {
          throw err;
        }
        throw new Error(`Failed to fetch pinboard feed: ${err.message}`);
      }
    },
    deps: [order, page, pageSize],
    initialData: {
      items: [],
      hasMore: false,
      page,
      pageSize,
      order,
    },
    resetDataOnError: true,
  });

  return {
    items: data?.items ?? [],
    hasMore: data?.hasMore ?? false,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    order: data?.order ?? order,
    loading,
    error,
  };
}

export default usePinboardFeed;
