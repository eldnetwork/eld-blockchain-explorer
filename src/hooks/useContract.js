import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function useContract(contractId) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContract() {
      if (!contractId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Remove 0x prefix if present for the API call
        const id = contractId.startsWith('0x') ? contractId.slice(2) : contractId;
        const url = `${API_URL}/contract?id=${encodeURIComponent(id)}`;
        console.log('Fetching contract from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Contract data received:', data);
        
        setContract(data);
      } catch (err) {
        console.error('Error fetching contract:', err);
        setError('Failed to fetch contract: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContract();
  }, [contractId]);

  return { contract, loading, error };
}

export default useContract;


