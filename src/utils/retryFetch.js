import { isAbortError } from '../api/http';

export const MAX_RETRIES = 5;
export const RETRY_BASE_MS = 1000;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {() => Promise<T>} fetchOnce
 * @param {{
 *   signal?: AbortSignal,
 *   cancelled?: () => boolean,
 *   isRefresh?: boolean,
 *   onExhausted?: () => void,
 * }} [options]
 * @returns {Promise<{ ok: true, value: T } | { ok: false, aborted?: boolean }>}
 */
export async function fetchWithRetry(fetchOnce, options = {}) {
  const { signal, cancelled, isRefresh = false, onExhausted } = options;
  const isCancelled = () => Boolean(signal?.aborted || cancelled?.());

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (isCancelled()) return { ok: false, aborted: true };

    try {
      const value = await fetchOnce();
      if (isCancelled()) return { ok: false, aborted: true };
      return { ok: true, value };
    } catch (err) {
      if (isCancelled() || isAbortError(err)) return { ok: false, aborted: true };

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }

      if (!isRefresh && onExhausted) {
        onExhausted();
      }
      return { ok: false };
    }
  }
  return { ok: false };
}
