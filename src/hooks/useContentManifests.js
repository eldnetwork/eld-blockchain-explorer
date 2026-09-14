import { useState, useEffect } from 'react';
import { rpcAbciQuery, isAbortError, debugLog } from '../api';

// Path prefix for content manifest CADOs
const CONTENT_MANIFEST_PATH = '/@eld/content_manifest/';

// Helper function to decode base64 to Uint8Array
function base64ToUint8Array(base64) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    debugLog('Error decoding base64:', error);
    return null;
  }
}

// Helper function to deserialize a manifest from bincode bytes
async function deserializeManifest(bincodeBytes) {
  try {
    const bincodeModule = await import('@bincode/bincode-js').catch(() => null);
    if (
      bincodeModule &&
      bincodeModule.deserialize &&
      typeof bincodeModule.deserialize === 'function'
    ) {
      return bincodeModule.deserialize(bincodeBytes);
    }
  } catch (_e) {
    // Package not available, continue with fallback
  }

  return {
    _raw: Array.from(bincodeBytes),
    _note: 'Bincode deserialization requires @bincode/bincode-js package',
  };
}

function useContentManifests() {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ac = new AbortController();

    async function fetchManifests() {
      setLoading(true);
      setError(null);
      try {
        const data = await rpcAbciQuery('cado_list', JSON.stringify(CONTENT_MANIFEST_PATH), {
          signal: ac.signal,
        });

        if (data.error || data.result?.response?.code !== 0) {
          const errorMsg = data.result?.response?.log || data.error?.message || 'Query failed';
          debugLog('Query failed:', errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        let cados = null;
        if (data.result?.response?.info) {
          try {
            cados = JSON.parse(data.result.response.info);
          } catch (e) {
            debugLog('Failed to parse info field:', e);
          }
        } else if (data.result?.response?.value) {
          try {
            const decodedValue = atob(data.result.response.value);
            cados = JSON.parse(decodedValue);
          } catch (e) {
            debugLog('Failed to parse value field:', e);
          }
        }

        if (!cados) {
          setManifests([]);
          setLoading(false);
          return;
        }

        if (!Array.isArray(cados)) {
          setError('Invalid response format: expected array of CADOs');
          setLoading(false);
          return;
        }

        const deserializationPromises = cados.map(async (cado, index) => {
          try {
            let manifestId =
              cado.key || cado.Immutable?.key || cado.Mutable?.key || `cado-${index}`;

            const cadoData = cado.Immutable?.data || cado.Mutable?.data;

            const baseManifest = {
              id: manifestId,
              _cadoType: cado.Immutable ? 'Immutable' : 'Mutable',
              _cado: cado,
              _index: index,
            };

            if (cadoData) {
              try {
                const bincodeBytes = base64ToUint8Array(cadoData);

                if (bincodeBytes) {
                  const deserialized = await deserializeManifest(bincodeBytes);

                  if (deserialized && !deserialized._note) {
                    if (deserialized.id || deserialized.manifest_id) {
                      baseManifest.id = deserialized.id || deserialized.manifest_id;
                    }
                    return {
                      ...deserialized,
                      ...baseManifest,
                    };
                  }
                }
              } catch (deserializeErr) {
                debugLog(`Failed to deserialize CADO ${index + 1}:`, deserializeErr);
              }
            }

            return baseManifest;
          } catch (err) {
            debugLog(`Failed to process CADO ${index + 1}:`, err);
            return {
              id: cado.key || `cado-${index}`,
              _cadoType: cado.Immutable ? 'Immutable' : 'Mutable',
              _cado: cado,
              _index: index,
              _error: err.message,
            };
          }
        });

        const processedManifests = await Promise.all(deserializationPromises);
        if (ac.signal.aborted) return;
        setManifests(processedManifests);
      } catch (err) {
        if (isAbortError(err)) return;
        setError('Failed to fetch content manifests: ' + err.message);
        debugLog('Error fetching content manifests:', err);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchManifests();
    const interval = setInterval(fetchManifests, 10000);
    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, []);

  return { manifests, loading, error };
}

export default useContentManifests;
