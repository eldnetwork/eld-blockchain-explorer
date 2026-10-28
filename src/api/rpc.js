import { RPC_URL } from '../config';
import { requestJson } from './http';
import { cachedFetch } from './queryCache';

const STATUS_TTL_MS = 3000;

const BOOL_PARAMS = new Set(['prove']);
const INT_PARAMS = new Set(['height', 'minHeight', 'maxHeight']);
const BYTE_PARAMS = new Set(['data']);

function unquoteRpcValue(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') return parsed;
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

function utf8ToHex(text) {
  const bytes = new TextEncoder().encode(String(text));
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Turn a Tendermint URI (`/status`, `/block?height=1`) into JSON-RPC params.
 * eld-tendermint-rs only accepts `POST /`. Quoted query values match the old GET form.
 * @param {string} path
 * @returns {{ method: string, params: Record<string, unknown> }}
 */
export function rpcPathToPost(path) {
  const queryAt = path.indexOf('?');
  const pathname = queryAt === -1 ? path : path.slice(0, queryAt);
  const search = queryAt === -1 ? '' : path.slice(queryAt + 1);
  /** @type {Record<string, unknown>} */
  const params = {};

  if (search) {
    for (const part of search.split('&')) {
      if (!part) continue;
      const eq = part.indexOf('=');
      const key = eq === -1 ? part : part.slice(0, eq);
      const raw = eq === -1 ? '' : part.slice(eq + 1);
      const value = unquoteRpcValue(raw);
      if (BYTE_PARAMS.has(key)) {
        params[key] = utf8ToHex(value);
      } else if (BOOL_PARAMS.has(key)) {
        params[key] = value === true || value === 'true';
      } else if (INT_PARAMS.has(key) && /^-?\d+$/.test(String(value))) {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    }
  }

  return { method: pathname.replace(/^\//, ''), params };
}

/**
 * Tendermint RPC. Callers still pass URI paths (`/status`, `/block?height=1`).
 * The request is JSON-RPC `POST /`, which both Go Tendermint and eld-tendermint-rs accept.
 * @param {string} path
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export function rpcGet(path, options = {}) {
  const { method, params } = rpcPathToPost(path);
  /** @type {{ method: string, params?: Record<string, unknown> }} */
  const payload = { method };
  if (Object.keys(params).length > 0) payload.params = params;
  return rpcPost(payload, options);
}

/**
 * Shared `status` fetch. Ignores subscriber abort; TTL is 3s.
 * @returns {Promise<unknown>}
 */
export function fetchRpcStatus() {
  return cachedFetch('rpc:status', () => rpcGet('/status'), { ttlMs: STATUS_TTL_MS });
}

/**
 * Current summary header (`SH:`). Params are ignored.
 * Resolves to `null` when the store has no summary header.
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export function fetchRpcSummary(options = {}) {
  return rpcPost({ method: 'summary', params: {} }, options).then((data) => {
    if (data?.error) {
      if (data.error.data === 'summary not found') return null;
      const err = new Error(data.error.message || 'RPC error');
      err.code = data.error.code;
      err.data = data.error.data;
      throw err;
    }
    if (!data?.result || typeof data.result !== 'object') {
      throw new Error('No summary in response');
    }
    return data.result;
  });
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
 * ABCI query as JSON-RPC `POST /`.
 * `data` is a quoted string, matching the old URI form (`""` or `JSON.stringify`).
 * @param {string} path query path value (without quotes)
 * @param {string} [data]
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export function rpcAbciQuery(path, data = '', options = {}) {
  const q = `path="${path}"&data=${data === '' ? '""' : data}&prove=false`;
  return rpcGet(`/abci_query?${q}`, options);
}
