const DEFAULT_TIMEOUT_MS = 15000;

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isAbortError(err) {
  return (
    (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') ||
    (typeof DOMException !== 'undefined' &&
      err instanceof DOMException &&
      err.name === 'AbortError')
  );
}

/**
 * JSON HTTP helper with timeout + AbortSignal support.
 * @param {string} url
 * @param {{
 *   method?: string,
 *   body?: string,
 *   headers?: Record<string, string>,
 *   signal?: AbortSignal,
 *   timeoutMs?: number,
 * }} [options]
 */
export async function requestJson(url, options = {}) {
  const { method = 'GET', body, headers = {}, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onOuterAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      const aborted = new DOMException('The operation was aborted.', 'AbortError');
      throw aborted;
    }
    signal.addEventListener('abort', onOuterAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      method,
      body,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.status = response.status;
      err.url = url;
      throw err;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onOuterAbort);
    }
  }
}

/**
 * Dev-only logger (no payload dumps in production).
 * @param {...unknown} args
 */
export function debugLog(...args) {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}
