import { useEffect, useState } from 'react';
import { rpcPost, isAbortError } from '../api';

const GC_METRICS_PATH = '/@eld/pinboard/gc_metrics';

function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

async function queryGcMetrics(signal) {
  return rpcPost(
    {
      id: -1,
      method: 'abci_query',
      params: {
        path: 'pinboard',
        data: stringToHex(GC_METRICS_PATH),
        prove: false,
      },
    },
    { signal },
  );
}

function usePinboardGcMetrics(refreshMs = 10000) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let firstFetch = true;
    const ac = new AbortController();

    async function fetchMetrics() {
      if (!cancelled && firstFetch) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await queryGcMetrics(ac.signal);
        if (cancelled || ac.signal.aborted) return;

        const code = data?.result?.response?.code;

        if (code !== 0) {
          const log =
            data?.result?.response?.log ||
            data?.result?.response?.info ||
            'GC metrics query failed';
          setError(log);
          return;
        }

        const info = data?.result?.response?.info;
        if (!info) {
          setError('Missing response.info payload from gc_metrics query');
          return;
        }

        const parsed = JSON.parse(info);
        setMetrics(parsed);
      } catch (err) {
        if (isAbortError(err) || cancelled) return;
        setError(`Failed to fetch GC metrics: ${err.message}`);
      } finally {
        if (!cancelled && !ac.signal.aborted) {
          setLoading(false);
          firstFetch = false;
        }
      }
    }

    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, refreshMs);

    return () => {
      cancelled = true;
      ac.abort();
      clearInterval(intervalId);
    };
  }, [refreshMs]);

  return { metrics, loading, error };
}

export default usePinboardGcMetrics;
