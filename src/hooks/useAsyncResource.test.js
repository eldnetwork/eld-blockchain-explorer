import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import useAsyncResource from './useAsyncResource';

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useAsyncResource', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setVisibility('visible');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    setVisibility('visible');
  });

  test('polls again after intervalMs with no jitter when random is 0.5', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue('ok');
    await act(async () => {
      renderHook(() => useAsyncResource({ fetcher, deps: [], intervalMs: 1000 }));
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('does not fetch while the tab is hidden', async () => {
    setVisibility('hidden');
    const fetcher = vi.fn().mockResolvedValue('ok');
    await act(async () => {
      renderHook(() => useAsyncResource({ fetcher, deps: [], intervalMs: 1000 }));
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test('stops polling after the tab is hidden', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue('ok');
    await act(async () => {
      renderHook(() => useAsyncResource({ fetcher, deps: [], intervalMs: 1000 }));
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      setVisibility('hidden');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('refreshKey refetches without flipping loading', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const { result, rerender } = renderHook(
      ({ height }) => useAsyncResource({ fetcher, deps: [], refreshKey: height }),
      { initialProps: { height: 1 } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ height: 2 });
    });
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
    expect(result.current.loading).toBe(false);
  });
});
