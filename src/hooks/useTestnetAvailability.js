import { useState, useEffect } from 'react';
import { rpcGet, isAbortError, debugLog } from '../api';

function useTestnetAvailability() {
  const [isTestnetAvailable, setIsTestnetAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const ac = new AbortController();

    const checkTestnetAvailability = async () => {
      try {
        const data = await rpcGet('/status', { signal: ac.signal });
        if (data.result?.sync_info?.latest_block_height) {
          setIsTestnetAvailable(true);
        } else {
          setIsTestnetAvailable(false);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        debugLog('Error checking testnet availability:', err);
        setIsTestnetAvailable(false);
      } finally {
        if (!ac.signal.aborted) setIsChecking(false);
      }
    };

    checkTestnetAvailability();
    const interval = setInterval(checkTestnetAvailability, 30000);
    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, []);

  return { isTestnetAvailable, isChecking };
}

export default useTestnetAvailability;
