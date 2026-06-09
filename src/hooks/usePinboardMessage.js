import { useEffect, useState } from 'react';
import { RPC_URL } from '../config';

function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

function base64ToUint8Array(base64) {
  // atob expects standard base64 (not URL-safe). If your node uses URL-safe, adjust here.
  const normalized = String(base64 || '').replace(/[\r\n]/g, '');
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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

function usePinboardMessage(wallet, messageId) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMessage() {
      if (!wallet || !messageId) {
        setMessage(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const innerPath = `/@eld/pinboard/post/${wallet}/${messageId}`;
        const data = await pinboardQuery({ innerPath });

        const code = data?.result?.response?.code;
        if (code !== 0) {
          const log = data?.result?.response?.log || data?.result?.response?.info || 'Pinboard post not found';
          setError(log);
          setMessage(null);
          return;
        }

        const info = data?.result?.response?.info;
        if (!info) {
          setError('Missing response.info payload from pinboard post query');
          setMessage(null);
          return;
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

        setMessage({
          meta,
          message_b64: messageB64,
          decodedText,
          decodedBytesLength,
          rawResponse: data?.result?.response ?? null,
        });
      } catch (err) {
        setError(`Failed to fetch pinboard message: ${err.message}`);
        setMessage(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMessage();
  }, [wallet, messageId]);

  return { message, loading, error };
}

export default usePinboardMessage;

