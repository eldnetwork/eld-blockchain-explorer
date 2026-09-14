import { rpcPost, isAbortError } from '../api';
import useAsyncResource from './useAsyncResource';

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
  const {
    data: metrics,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        const data = await queryGcMetrics(signal);
        const code = data?.result?.response?.code;

        if (code !== 0) {
          throw new Error(
            data?.result?.response?.log ||
              data?.result?.response?.info ||
              'GC metrics query failed',
          );
        }

        const info = data?.result?.response?.info;
        if (!info) {
          throw new Error('Missing response.info payload from gc_metrics query');
        }

        return JSON.parse(info);
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (
          err instanceof Error &&
          (err.message === 'Missing response.info payload from gc_metrics query' ||
            !err.message.startsWith('HTTP'))
        ) {
          throw err;
        }
        throw new Error(`Failed to fetch GC metrics: ${err.message}`);
      }
    },
    deps: [refreshMs],
    intervalMs: refreshMs,
  });

  return { metrics, loading, error };
}

export default usePinboardGcMetrics;
