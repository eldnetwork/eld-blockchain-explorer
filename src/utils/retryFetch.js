export const MAX_RETRIES = 5;
export const RETRY_BASE_MS = 1000;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {() => Promise<T>} fetchOnce
 * @param {{ cancelled: () => boolean, isRefresh?: boolean, onExhausted?: () => void }} options
 * @returns {Promise<{ ok: true, value: T } | { ok: false }>}
 */
export async function fetchWithRetry(fetchOnce, { cancelled, isRefresh = false, onExhausted }) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (cancelled()) return { ok: false };

    try {
      const value = await fetchOnce();
      if (cancelled()) return { ok: false };
      return { ok: true, value };
    } catch {
      if (cancelled()) return { ok: false };

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
