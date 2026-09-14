import { indexerGet, rpcGet, rpcAbciQuery, isAbortError } from '../api';
import { normalizeAccountAddress } from './accountAddress';

/**
 * @typedef {{ kind: string, path: string }} SearchHit
 */

/**
 * Resolve a search query to an in-app route.
 * Tries height → tx → account → validator → capacity provider → content → namespace.
 *
 * @param {string} raw
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<SearchHit | null>}
 */
export async function resolveSearchQuery(raw, options = {}) {
  const q = String(raw || '').trim();
  if (!q) return null;

  const { signal } = options;

  // Block height
  if (/^\d+$/.test(q)) {
    try {
      await rpcGet(`/block?height=${q}`, { signal });
      return { kind: 'block', path: `/block/${q}` };
    } catch (err) {
      if (isAbortError(err)) throw err;
      // still navigate — BlockPage can show not found
      return { kind: 'block', path: `/block/${q}` };
    }
  }

  const lower = q.toLowerCase();
  const hexBody = lower.startsWith('0x') ? lower.slice(2) : lower;
  const isHex = /^[0-9a-f]+$/.test(hexBody);

  // Tx hash (32 bytes)
  if (isHex && hexBody.length === 64) {
    const id = lower.startsWith('0x') ? lower : `0x${hexBody}`;
    try {
      const data = await indexerGet(`/transaction?id=${encodeURIComponent(id)}`, { signal });
      const tx = data.transaction || data.data || data;
      if (tx && (tx.id || tx.tx)) {
        return { kind: 'tx', path: `/tx/${id}` };
      }
    } catch (err) {
      if (isAbortError(err)) throw err;
    }
    return { kind: 'tx', path: `/tx/${id}` };
  }

  // Account / validator / capacity provider (20 bytes)
  const address = normalizeAccountAddress(q);
  if (address) {
    try {
      const data = await rpcAbciQuery('active_validators', '', { signal });
      const info = data?.result?.response?.info;
      const parsed = info ? JSON.parse(info) : null;
      const validators = parsed?.validators || parsed?.active_validators || [];
      if (
        Array.isArray(validators) &&
        validators.some((v) => normalizeAccountAddress(v.address) === address)
      ) {
        return { kind: 'validator', path: `/validator/${address}` };
      }
    } catch (err) {
      if (isAbortError(err)) throw err;
    }

    try {
      const data = await rpcAbciQuery('capacity_validators', '', { signal });
      const info = data?.result?.response?.info;
      const parsed = info ? JSON.parse(info) : null;
      const providers =
        parsed?.capacity_validators || parsed?.all_providers || parsed?.active_providers || [];
      if (
        Array.isArray(providers) &&
        providers.some((p) => normalizeAccountAddress(p.address) === address)
      ) {
        return { kind: 'capacity-provider', path: `/capacity-provider/${address}` };
      }
    } catch (err) {
      if (isAbortError(err)) throw err;
    }

    return { kind: 'account', path: `/account/${address}` };
  }

  // Content id — try indexer
  try {
    await indexerGet(`/content/${encodeURIComponent(q)}`, { signal });
    return { kind: 'content', path: `/content/${encodeURIComponent(q)}` };
  } catch (err) {
    if (isAbortError(err)) throw err;
  }

  // Namespace slug
  try {
    const data = await indexerGet(`/v1/namespace/${encodeURIComponent(q)}`, { signal });
    if (data && data.registered !== false) {
      return { kind: 'namespace', path: `/namespaces/${encodeURIComponent(q)}` };
    }
  } catch (err) {
    if (isAbortError(err)) throw err;
  }

  // Epoch id (non-decimal already handled; allow epoch- prefixed)
  if (/^epoch[-_]?/i.test(q) || /^e\d+$/i.test(q)) {
    return { kind: 'epoch', path: `/epoch/${encodeURIComponent(q)}` };
  }

  return null;
}
