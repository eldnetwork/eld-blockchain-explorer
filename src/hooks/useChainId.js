import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';

function useChainId() {
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChainId() {
      try {
        const response = await fetch(`${RPC_URL}/status`);
        const data = await response.json();
        
        if (data.result?.node_info?.network) {
          setChainId(data.result.node_info.network);
        }
      } catch (err) {
        console.error('Error fetching chain ID:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChainId();
  }, []);

  return { chainId, loading };
}

export default useChainId;

