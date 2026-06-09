import { useEffect, useState } from 'react';
import { RPC_URL } from '../config';

const DEFAULT_PAGE_SIZE = 50;

function bytesToHex(bytes) {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

async function pinboardFeedQuery({ order, page, pageSize }) {
  const payload = JSON.stringify({
    order,
    page,
    page_size: pageSize,
  });

  const bytes = new TextEncoder().encode(payload);
  const hexData = bytesToHex(bytes);

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: -1,
      method: 'abci_query',
      params: {
        path: 'pinboard_feed',
        data: hexData,
        prove: false,
      },
    }),
  });

  return response.json();
}

function usePinboardFeed(order = 'desc', page = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [effectivePage, setEffectivePage] = useState(page);
  const [effectivePageSize, setEffectivePageSize] = useState(pageSize);
  const [effectiveOrder, setEffectiveOrder] = useState(order);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFeed() {
      setLoading(true);
      setError(null);

      try {
        const data = await pinboardFeedQuery({ order, page, pageSize });

        const code = data?.result?.response?.code;
        if (code !== 0) {
          const log = data?.result?.response?.log || data?.result?.response?.info || 'Pinboard feed query failed';
          setError(log);
          setItems([]);
          setHasMore(false);
          return;
        }

        if (!data?.result?.response?.info) {
          setError('Missing response.info payload from pinboard_feed query');
          setItems([]);
          setHasMore(false);
          return;
        }

        const payload = JSON.parse(data.result.response.info);
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setEffectivePage(typeof payload.page === 'number' ? payload.page : page);
        setEffectivePageSize(typeof payload.page_size === 'number' ? payload.page_size : pageSize);
        setEffectiveOrder(typeof payload.order === 'string' ? payload.order : order);
        setHasMore(Boolean(payload.has_more));
      } catch (err) {
        setError(`Failed to fetch pinboard feed: ${err.message}`);
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();
  }, [order, page, pageSize]);

  return {
    items,
    hasMore,
    page: effectivePage,
    pageSize: effectivePageSize,
    order: effectiveOrder,
    loading,
    error,
  };
}

export default usePinboardFeed;

