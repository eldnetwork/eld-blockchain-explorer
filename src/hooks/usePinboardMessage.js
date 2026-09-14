import { rpcPost, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

function base64ToUint8Array(base64) {
  const normalized = String(base64 || '').replace(/[\r\n]/g, '');
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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

function usePinboardMessage(wallet, messageId) {
  const {
    data: message,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const innerPath = `/@eld/pinboard/post/${wallet}/${messageId}`;
        const data = await pinboardQuery({ innerPath, signal });

        const code = data?.result?.response?.code;
        if (code !== 0) {
          throw new Error(
            data?.result?.response?.log ||
              data?.result?.response?.info ||
              'Pinboard post not found',
          );
        }

        const info = data?.result?.response?.info;
        if (!info) {
          throw new Error('Missing response.info payload from pinboard post query');
        }

        const payload = JSON.parse(info);
        const meta = payload?.meta ?? null;
        const messageB64 = payload?.message_b64 ?? null;

        let decodedText = null;
        let decodedBytesLength = null;
        if (messageB64) {
          const bytes = base64ToUint8Array(messageB64);
          decodedBytesLength = bytes.length;
          try {
            decodedText = new TextDecoder('utf-8').decode(bytes);
          } catch {
            decodedText = null;
          }
        }

        return {
          meta,
          message_b64: messageB64,
          decodedText,
          decodedBytesLength,
          rawResponse: data?.result?.response ?? null,
        };
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (
          err instanceof Error &&
          (err.message === 'Missing response.info payload from pinboard post query' ||
            err.message === 'Pinboard post not found' ||
            !err.message.startsWith('HTTP'))
        ) {
          throw err;
        }
        throw new Error(`Failed to fetch pinboard message: ${err.message}`);
      }
    },
    deps: [wallet, messageId],
    enabled: Boolean(wallet && messageId),
    clearOnDisabled: true,
    resetDataOnError: true,
  });

  return { message, loading, error };
}

export default usePinboardMessage;
