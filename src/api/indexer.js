import { API_URL } from '../config';
import { requestJson } from './http';

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * Explorer / indexer API GET.
 * @param {string} path
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export function indexerGet(path, options = {}) {
  return requestJson(joinUrl(API_URL, path), options);
}
