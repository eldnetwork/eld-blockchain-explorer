import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';

function useTestnetAvailability() {
  const [isTestnetAvailable, setIsTestnetAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTestnetAvailability = async () => {
      try {
        const response = await fetch(`${RPC_URL}/status`);
        if (!response.ok) {
          throw new Error('Status endpoint not available');
        }
        const data = await response.json();
        if (data.result?.sync_info?.latest_block_height) {
          setIsTestnetAvailable(true);
        } else {
          setIsTestnetAvailable(false);
        }
      } catch (err) {
        console.error('Error checking testnet availability:', err);
        setIsTestnetAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkTestnetAvailability();
    // Refresh check every 30 seconds
    const interval = setInterval(checkTestnetAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isTestnetAvailable, isChecking };
}

export default useTestnetAvailability;

