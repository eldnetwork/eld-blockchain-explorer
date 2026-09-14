import { RPC_URL } from '../config';
import { requestJson } from './http';

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * Tendermint / node RPC GET (e.g. `/status`, `/block?height=1`).
 * @param {string} path
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export function rpcGet(path, options = {}) {
  return requestJson(joinUrl(RPC_URL, path), options);
}

/**
 * Tendermint JSON-RPC POST (e.g. abci_query via POST body).
 * @param {{ method: string, params?: unknown, id?: number|string }} payload
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export function rpcPost(payload, options = {}) {
  return requestJson(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...payload }),
    ...options,
  });
}

/**
 * Convenience GET abci_query with Tendermint-style query params.
 * @param {string} path query path value (without quotes)
 * @param {string} [data]
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export function rpcAbciQuery(path, data = '', options = {}) {
  const q = `path="${path}"&data=${data === '' ? '""' : data}&prove=false`;
  return rpcGet(`/abci_query?${q}`, options);
}
