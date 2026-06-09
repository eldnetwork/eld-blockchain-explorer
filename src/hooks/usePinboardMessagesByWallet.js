import { useEffect, useState } from 'react';
import { RPC_URL } from '../config';

const DEFAULT_PAGE_SIZE = 100;

// Helper function to convert ASCII string to hex bytes (no UTF-8 multibyte chars expected here).
function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

async function pinboardQuery({ innerPath }) {
  const hexData = stringToHex(innerPath);

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: -1,
      method: 'abci_query',
      params: {
        path: 'pinboard',
        data: hexData,
        prove: false,
      },
    }),
  });

  return response.json();
}

function usePinboardMessagesByWallet(wallet, page = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [effectivePage, setEffectivePage] = useState(page);
  const [effectivePageSize, setEffectivePageSize] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMessages() {
      if (!wallet) {
        setMessages([]);
        setHasMore(false);
        setEffectivePage(page);
        setEffectivePageSize(pageSize);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const innerPath = `/@eld/pinboard/wallet/${wallet}/${page}/${pageSize}`;
        const data = await pinboardQuery({ innerPath });

        const code = data?.result?.response?.code;
        if (code !== 0) {
          const log = data?.result?.response?.log || data?.result?.response?.info || 'Pinboard query failed';
          setError(log);
          setMessages([]);
          setHasMore(false);
          return;
        }

        if (!data?.result?.response?.info) {
          setError('Missing response.info payload from pinboard query');
          setMessages([]);
          setHasMore(false);
          return;
        }

        const payload = JSON.parse(data.result.response.info);
        setMessages(Array.isArray(payload.items) ? payload.items : []);
        setEffectivePage(typeof payload.page === 'number' ? payload.page : page);
        setEffectivePageSize(typeof payload.page_size === 'number' ? payload.page_size : pageSize);
        setHasMore(Boolean(payload.has_more));
      } catch (err) {
        setError(`Failed to fetch pinboard messages: ${err.message}`);
        setMessages([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [wallet, page, pageSize]);

  return { messages, hasMore, page: effectivePage, pageSize: effectivePageSize, loading, error };
}

export default usePinboardMessagesByWallet;

