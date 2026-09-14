import { useEffect, useState } from 'react';
import { rpcPost, isAbortError } from '../api';

const DEFAULT_PAGE_SIZE = 100;

function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

async function pinboardQuery({ innerPath, signal }) {
  return rpcPost(
    {
      id: -1,
      method: 'abci_query',
      params: {
        path: 'pinboard',
        data: stringToHex(innerPath),
        prove: false,
      },
    },
    { signal },
  );
}

function usePinboardMessagesByTag(tag, page = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [effectivePage, setEffectivePage] = useState(page);
  const [effectivePageSize, setEffectivePageSize] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tag) {
      setMessages([]);
      setHasMore(false);
      setEffectivePage(page);
      setEffectivePageSize(pageSize);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const ac = new AbortController();

    async function fetchMessages() {
      setLoading(true);
      setError(null);

      try {
        const innerPath = `/@eld/pinboard/tag/${tag}/${page}/${pageSize}`;
        const data = await pinboardQuery({ innerPath, signal: ac.signal });

        const code = data?.result?.response?.code;
        if (code !== 0) {
          const log =
            data?.result?.response?.log || data?.result?.response?.info || 'Pinboard query failed';
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
        if (isAbortError(err)) return;
        setError(`Failed to fetch pinboard messages: ${err.message}`);
        setMessages([]);
        setHasMore(false);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchMessages();
    return () => ac.abort();
  }, [tag, page, pageSize]);

  return { messages, hasMore, page: effectivePage, pageSize: effectivePageSize, loading, error };
}

export default usePinboardMessagesByTag;
