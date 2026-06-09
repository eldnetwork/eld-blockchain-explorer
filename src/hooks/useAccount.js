import { useState, useEffect } from 'react';
import { RPC_URL } from '../config';
import { normalizeAccountAddress } from '../utils/accountAddress';

// Helper function to convert string to hex
function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

function useAccount(address) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function queryAccountByAddress(addressValue) {
      const path = `/@eld/account/${addressValue}`;
      const hexData = stringToHex(path);

      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'abci_query',
          params: {
            path: 'cado',
            data: hexData,
            prove: false
          }
        })
      });

      return response.json();
    }

    async function queryAccountView(addressValue) {
      const hexData = stringToHex(addressValue);

      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'abci_query',
          params: {
            path: 'account_view',
            data: hexData,
            prove: false,
          },
        }),
      });

      return response.json();
    }

    async function fetchAccount() {
      setLoading(true);
      setError(null);
      try {
        if (!address) {
          setError('Address is required');
          setLoading(false);
          return;
        }

        const normalized = normalizeAccountAddress(address);
        const candidates = [
          address,
          normalized,
          typeof address === 'string' ? address.toLowerCase() : null,
          normalized ? normalized.slice(2) : null,
          normalized ? normalized.slice(2).toUpperCase() : null,
        ].filter((candidate, index, arr) => typeof candidate === 'string' && candidate.length > 0 && arr.indexOf(candidate) === index);

        let foundData = null;
        let resolvedAddress = normalized || address;
        for (const candidate of candidates) {
          const data = await queryAccountByAddress(candidate);
          if (data.result?.response?.code === 0 && data.result?.response?.info) {
            foundData = data;
            resolvedAddress = normalizeAccountAddress(candidate) || candidate;
            break;
          }
        }

        if (!foundData) {
          setError('Account not found');
          setLoading(false);
          return;
        }

        if (foundData.result?.response?.info) {
          const accountData = JSON.parse(foundData.result.response.info);

          let eldBalance = null;
          let nonce = null;
          const viewData = await queryAccountView(resolvedAddress);
          if (viewData.result?.response?.code === 0 && viewData.result?.response?.info) {
            const view = JSON.parse(viewData.result.response.info);
            eldBalance = view.balance;
            nonce = view.nonce;
          }

          setAccount({
            ...accountData,
            address: resolvedAddress,
            eldBalance,
            nonce,
            rawResponse: foundData.result.response,
          });
        } else {
          setError('Account not found');
        }
      } catch (err) {
        setError('Failed to fetch account: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (address) fetchAccount();
  }, [address]);

  return { account, loading, error };
}

export default useAccount;