import { rpcPost, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

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

function parsePinboardListPayload(data, page, pageSize, fallbackError) {
  const code = data?.result?.response?.code;
  if (code !== 0) {
    throw new Error(data?.result?.response?.log || data?.result?.response?.info || fallbackError);
  }

  if (!data?.result?.response?.info) {
    throw new Error('Missing response.info payload from pinboard query');
  }

  const payload = JSON.parse(data.result.response.info);
  return {
    messages: Array.isArray(payload.items) ? payload.items : [],
    hasMore: Boolean(payload.has_more),
    page: typeof payload.page === 'number' ? payload.page : page,
    pageSize: typeof payload.page_size === 'number' ? payload.page_size : pageSize,
  };
}

function wrapPinboardError(err) {
  if (isAbortError(err)) return err;
  if (
    err instanceof Error &&
    (err.message === 'Missing response.info payload from pinboard query' ||
      err.message === 'Pinboard query failed' ||
      !err.message.startsWith('HTTP'))
  ) {
    return err;
  }
  return new Error(`Failed to fetch pinboard messages: ${err.message}`);
}

function usePinboardMessagesByTag(tag, page = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const { data, loading, error } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const innerPath = `/@eld/pinboard/tag/${tag}/${page}/${pageSize}`;
        const rpcData = await pinboardQuery({ innerPath, signal });
        return parsePinboardListPayload(rpcData, page, pageSize, 'Pinboard query failed');
      } catch (err) {
        throw wrapPinboardError(err);
      }
    },
    deps: [tag, page, pageSize],
    enabled: Boolean(tag),
    clearOnDisabled: true,
    resetDataOnError: true,
    initialData: { messages: [], hasMore: false, page, pageSize },
  });

  return {
    messages: data?.messages ?? [],
    hasMore: data?.hasMore ?? false,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    loading,
    error,
  };
}

export default usePinboardMessagesByTag;
