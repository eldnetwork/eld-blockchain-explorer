import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';

function useBlock(height) {
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBlock() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${RPC_URL}/block?height=${height}`);
        const data = await response.json();
        console.log({ data })
        if (data.result && data.result.block) {
          setBlock(data.result.block);
        } else {
          setError('Block not found');
        }
      } catch (err) {
        setError('Failed to fetch block: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (height) fetchBlock();
  }, [height]);

  return { block, loading, error };
}

export default useBlock;