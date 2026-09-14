import { useState, useEffect } from 'react';
import { rpcAbciQuery, isAbortError } from '../api';
import { normalizeAccountAddress } from '../utils/accountAddress';

function abciQueryGet(path, data, { signal } = {}) {
  return rpcAbciQuery(path, JSON.stringify(data), { signal });
}

function useAccount(address) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!address) return undefined;

    const ac = new AbortController();

    async function queryAccountByAddress(addressValue) {
      return abciQueryGet('cado', `/@eld/account/${addressValue}`, { signal: ac.signal });
    }

    async function queryAccountView(addressValue) {
      return abciQueryGet('account_view', addressValue, { signal: ac.signal });
    }

    async function fetchAccount() {
      setLoading(true);
      setError(null);
      try {
        const normalized = normalizeAccountAddress(address);
        const candidates = [
          address,
          normalized,
          typeof address === 'string' ? address.toLowerCase() : null,
          normalized ? normalized.slice(2) : null,
          normalized ? normalized.slice(2).toUpperCase() : null,
        ].filter(
          (candidate, index, arr) =>
            typeof candidate === 'string' &&
            candidate.length > 0 &&
            arr.indexOf(candidate) === index,
        );

        let foundData = null;
        let resolvedAddress = normalized || address;
        for (const candidate of candidates) {
          const data = await queryAccountByAddress(candidate);
          if (ac.signal.aborted) return;
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
          if (ac.signal.aborted) return;
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
        if (isAbortError(err)) return;
        setError('Failed to fetch account: ' + err.message);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    fetchAccount();
    return () => ac.abort();
  }, [address]);

  return { account, loading, error };
}

export default useAccount;
