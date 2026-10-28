const inflight = new Map();
const cache = new Map();

/**
 * Module-level inflight + TTL cache. Cached fetchers ignore subscriber abort:
 * unmount only stops listening; TTL and tab visibility bound the work.
 *
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fetcher
 * @param {{ ttlMs?: number }} [options]
 * @returns {Promise<T>}
 */
export function cachedFetch(key, fetcher, { ttlMs = 8000 } = {}) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return Promise.resolve(hit.value);
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetcher()
    .then((value) => {
      cache.set(key, { value, at: Date.now() });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** @internal vitest isolation */
export function __resetQueryCacheForTests() {
  inflight.clear();
  cache.clear();
}
