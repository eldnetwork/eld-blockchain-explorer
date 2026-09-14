import { rpcAbciQuery, isAbortError } from '../api';
import { normalizeAccountAddress } from '../utils/accountAddress';
import useAsyncResource from './useAsyncResource';

function abciQueryGet(path, data, { signal } = {}) {
  return rpcAbciQuery(path, JSON.stringify(data), { signal });
}

async function fetchAccount(address, signal) {
  const normalized = normalizeAccountAddress(address);
  const candidates = [
    address,
    normalized,
    typeof address === 'string' ? address.toLowerCase() : null,
    normalized ? normalized.slice(2) : null,
    normalized ? normalized.slice(2).toUpperCase() : null,
  ].filter(
    (candidate, index, arr) =>
      typeof candidate === 'string' && candidate.length > 0 && arr.indexOf(candidate) === index,
  );

  let foundData = null;
  let resolvedAddress = normalized || address;
  for (const candidate of candidates) {
    const data = await abciQueryGet('cado', `/@eld/account/${candidate}`, { signal });
    if (signal.aborted) {
      const aborted = new DOMException('The operation was aborted.', 'AbortError');
      throw aborted;
    }
    if (data.result?.response?.code === 0 && data.result?.response?.info) {
      foundData = data;
      resolvedAddress = normalizeAccountAddress(candidate) || candidate;
      break;
    }
  }

  if (!foundData?.result?.response?.info) {
    throw new Error('Account not found');
  }

  const accountData = JSON.parse(foundData.result.response.info);

  let eldBalance = null;
  let nonce = null;
  const viewData = await abciQueryGet('account_view', resolvedAddress, { signal });
  if (signal.aborted) {
    const aborted = new DOMException('The operation was aborted.', 'AbortError');
    throw aborted;
  }
  if (viewData.result?.response?.code === 0 && viewData.result?.response?.info) {
    const view = JSON.parse(viewData.result.response.info);
    eldBalance = view.balance;
    nonce = view.nonce;
  }

  return {
    ...accountData,
    address: resolvedAddress,
    eldBalance,
    nonce,
    rawResponse: foundData.result.response,
  };
}

function useAccount(address) {
  const {
    data: account,
    loading,
    error,
  } = useAsyncResource({
    fetcher: async (signal) => {
      try {
        return await fetchAccount(address, signal);
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (err instanceof Error && err.message === 'Account not found') throw err;
        throw new Error('Failed to fetch account: ' + err.message);
      }
    },
    deps: [address],
    enabled: Boolean(address),
  });

  return { account, loading, error };
}

export default useAccount;
