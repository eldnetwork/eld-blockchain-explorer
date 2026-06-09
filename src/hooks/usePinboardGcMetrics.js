import { useEffect, useState } from 'react';
import { RPC_URL } from '../config';

const GC_METRICS_PATH = '/@eld/pinboard/gc_metrics';

function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

async function queryGcMetrics() {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: -1,
      method: 'abci_query',
      params: {
        path: 'pinboard',
        data: stringToHex(GC_METRICS_PATH),
        prove: false,
      },
    }),
  });

  return response.json();
}

function usePinboardGcMetrics(refreshMs = 10000) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let firstFetch = true;

    async function fetchMetrics() {
      if (!cancelled && firstFetch) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await queryGcMetrics();
        const code = data?.result?.response?.code;

        if (code !== 0) {
          const log = data?.result?.response?.log || data?.result?.response?.info || 'GC metrics query failed';
          if (!cancelled) setError(log);
          return;
        }

        const info = data?.result?.response?.info;
        if (!info) {
          if (!cancelled) setError('Missing response.info payload from gc_metrics query');
          return;
        }

        const parsed = JSON.parse(info);
        if (!cancelled) setMetrics(parsed);
      } catch (err) {
        if (!cancelled) setError(`Failed to fetch GC metrics: ${err.message}`);
      } finally {
        if (!cancelled) {
          setLoading(false);
          firstFetch = false;
        }
      }
    }

    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [refreshMs]);

  return { metrics, loading, error };
}

export default usePinboardGcMetrics;

