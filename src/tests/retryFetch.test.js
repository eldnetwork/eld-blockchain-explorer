import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchWithRetry, MAX_RETRIES } from '../utils/retryFetch';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns the value on the first success', async () => {
    const fetchOnce = vi.fn().mockResolvedValue(42);
    await expect(fetchWithRetry(fetchOnce)).resolves.toEqual({ ok: true, value: 42 });
    expect(fetchOnce).toHaveBeenCalledTimes(1);
  });

  test('retries after a failure then succeeds', async () => {
    const fetchOnce = vi.fn().mockRejectedValueOnce(new Error('nope')).mockResolvedValueOnce('yes');
    const pending = fetchWithRetry(fetchOnce);
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ ok: true, value: 'yes' });
    expect(fetchOnce).toHaveBeenCalledTimes(2);
  });

  test('calls onExhausted after MAX_RETRIES and returns ok: false', async () => {
    const fetchOnce = vi.fn().mockRejectedValue(new Error('fail'));
    const onExhausted = vi.fn();
    const pending = fetchWithRetry(fetchOnce, { onExhausted });
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ ok: false });
    expect(fetchOnce).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    expect(onExhausted).toHaveBeenCalledTimes(1);
  });

  test('does not call onExhausted for a failed refresh', async () => {
    const fetchOnce = vi.fn().mockRejectedValue(new Error('fail'));
    const onExhausted = vi.fn();
    const pending = fetchWithRetry(fetchOnce, { onExhausted, isRefresh: true });
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ ok: false });
    expect(onExhausted).not.toHaveBeenCalled();
  });

  test('returns aborted when the signal is already aborted', async () => {
    const ac = new AbortController();
    ac.abort();
    const fetchOnce = vi.fn();
    await expect(fetchWithRetry(fetchOnce, { signal: ac.signal })).resolves.toEqual({
      ok: false,
      aborted: true,
    });
    expect(fetchOnce).not.toHaveBeenCalled();
  });

  test('returns aborted on AbortError from fetchOnce', async () => {
    const fetchOnce = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
    await expect(fetchWithRetry(fetchOnce)).resolves.toEqual({ ok: false, aborted: true });
  });
});
