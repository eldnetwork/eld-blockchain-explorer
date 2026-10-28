import { afterEach, describe, expect, test, vi } from 'vitest';
import { cachedFetch, __resetQueryCacheForTests } from './queryCache';

describe('cachedFetch', () => {
  afterEach(() => {
    __resetQueryCacheForTests();
    vi.useRealTimers();
  });

  test('returns a TTL hit without calling the fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue('once');
    await expect(cachedFetch('k', fetcher, { ttlMs: 1000 })).resolves.toBe('once');
    await expect(cachedFetch('k', fetcher, { ttlMs: 1000 })).resolves.toBe('once');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('shares one inflight promise across concurrent callers', async () => {
    let resolveFetch;
    const fetcher = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const a = cachedFetch('shared', fetcher, { ttlMs: 1000 });
    const b = cachedFetch('shared', fetcher, { ttlMs: 1000 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolveFetch('ok');
    await expect(a).resolves.toBe('ok');
    await expect(b).resolves.toBe('ok');
  });

  test('does not cache errors; the next call retries', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('recovered');
    await expect(cachedFetch('err', fetcher, { ttlMs: 1000 })).rejects.toThrow('fail');
    await expect(cachedFetch('err', fetcher, { ttlMs: 1000 })).resolves.toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('calls the fetcher again after the TTL expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const fetcher = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
    await expect(cachedFetch('ttl', fetcher, { ttlMs: 1000 })).resolves.toBe('a');
    vi.setSystemTime(new Date('2026-01-01T00:00:01.001Z'));
    await expect(cachedFetch('ttl', fetcher, { ttlMs: 1000 })).resolves.toBe('b');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
