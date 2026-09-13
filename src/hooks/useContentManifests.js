import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';

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
    console.error('Error decoding base64:', error);
    return null;
  }
}

// Helper function to deserialize a manifest from bincode bytes
// This attempts to use @bincode/bincode-js if available, otherwise returns raw data
async function deserializeManifest(bincodeBytes) {
  // Try to use @bincode/bincode-js if available
  try {
    // Dynamic import to avoid errors if package is not installed
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

  // Fallback: Return raw data structure
  // The actual deserialization would need the bincode library
  // Structure: id, content_id, metadata, status, created_at, chunks, redundancy_factor, total_size
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
    async function fetchManifests() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${RPC_URL}/abci_query?path=${encodeURIComponent(JSON.stringify('cado_list'))}&data=${encodeURIComponent(JSON.stringify(CONTENT_MANIFEST_PATH))}&prove=false`,
        );

        const data = await response.json();

        console.log('Content manifests response:', data);

        if (data.error || data.result?.response?.code !== 0) {
          const errorMsg = data.result?.response?.log || data.error?.message || 'Query failed';
          console.error('Query failed:', errorMsg, data);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Parse the CADO list from the info or value field
        let cados = null;
        if (data.result?.response?.info) {
          try {
            cados = JSON.parse(data.result.response.info);
            console.log('Parsed CADOs from info:', cados);
          } catch (e) {
            console.error('Failed to parse info field:', e);
          }
        } else if (data.result?.response?.value) {
          // Some responses use value field (base64 encoded)
          try {
            const decodedValue = atob(data.result.response.value);
            cados = JSON.parse(decodedValue);
            console.log('Parsed CADOs from value:', cados);
          } catch (e) {
            console.error('Failed to parse value field:', e);
          }
        }

        if (!cados) {
          console.warn(
            'No CADO data found in response. Response structure:',
            data.result?.response,
          );
          setManifests([]);
          setLoading(false);
          return;
        }

        if (!Array.isArray(cados)) {
          console.error(
            'Invalid response format: expected array of CADOs, got:',
            typeof cados,
            cados,
          );
          setError('Invalid response format: expected array of CADOs');
          setLoading(false);
          return;
        }

        console.log(`Found ${cados.length} CADOs to deserialize`);

        // Process each CADO - try to deserialize, but show CADO data even if deserialization fails
        const deserializationPromises = cados.map(async (cado, index) => {
          try {
            console.log(`Processing CADO ${index + 1}/${cados.length}:`, cado);

            // Extract a key/ID from the CADO structure
            let manifestId =
              cado.key || cado.Immutable?.key || cado.Mutable?.key || `cado-${index}`;

            // Extract data based on CADO type
            const cadoData = cado.Immutable?.data || cado.Mutable?.data;

            // Base manifest object from CADO
            const baseManifest = {
              id: manifestId,
              _cadoType: cado.Immutable ? 'Immutable' : 'Mutable',
              _cado: cado,
              _index: index,
            };

            // Try to deserialize if we have data
            if (cadoData) {
              try {
                // Decode base64 to get bincode bytes
                const bincodeBytes = base64ToUint8Array(cadoData);

                if (bincodeBytes) {
                  console.log(
                    `CADO ${index + 1} decoded, bincode bytes length:`,
                    bincodeBytes.length,
                  );

                  // Try to deserialize bincode to ContentManifest
                  const deserialized = await deserializeManifest(bincodeBytes);

                  // If deserialization returned something useful (not just _raw), merge it
                  if (deserialized && !deserialized._note) {
                    console.log(`CADO ${index + 1} deserialized successfully:`, deserialized);
                    // Use deserialized ID if available
                    if (deserialized.id || deserialized.manifest_id) {
                      baseManifest.id = deserialized.id || deserialized.manifest_id;
                    }
                    return {
                      ...deserialized,
                      ...baseManifest,
                    };
                  } else {
                    console.log(
                      `CADO ${index + 1} deserialization returned raw data, using CADO structure`,
                    );
                  }
                }
              } catch (deserializeErr) {
                console.warn(
                  `Failed to deserialize CADO ${index + 1}, using CADO data:`,
                  deserializeErr,
                );
              }
            }

            // Return CADO data even if deserialization failed or wasn't attempted
            return baseManifest;
          } catch (err) {
            console.error(`Failed to process CADO ${index + 1}:`, err);
            // Still return a basic manifest so it shows up
            return {
              id: cado.key || `cado-${index}`,
              _cadoType: cado.Immutable ? 'Immutable' : 'Mutable',
              _cado: cado,
              _index: index,
              _error: err.message,
            };
          }
        });

        // Wait for all processing to complete
        const processedManifests = await Promise.all(deserializationPromises);

        console.log(`Processed ${processedManifests.length} manifests from ${cados.length} CADOs`);

        setManifests(processedManifests);
      } catch (err) {
        setError('Failed to fetch content manifests: ' + err.message);
        console.error('Error fetching content manifests:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchManifests();
    const interval = setInterval(fetchManifests, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return { manifests, loading, error };
}

export default useContentManifests;
