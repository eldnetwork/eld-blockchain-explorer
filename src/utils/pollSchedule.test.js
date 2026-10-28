import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextDelay, startJitteredPoll } from './pollSchedule';

describe('nextDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('stays within ±20% of the interval', () => {
    for (let i = 0; i < 50; i += 1) {
      const delay = nextDelay(10_000);
      expect(delay).toBeGreaterThanOrEqual(8000);
      expect(delay).toBeLessThanOrEqual(12_000);
    }
  });

  test('returns the exact interval when Math.random is 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(nextDelay(1000)).toBe(1000);
  });
});

describe('startJitteredPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('calls onTick after the interval and reschedules', async () => {
    const onTick = vi.fn().mockResolvedValue(undefined);
    const cancel = startJitteredPoll({ intervalMs: 1000, onTick });
    expect(onTick).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onTick).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(onTick).toHaveBeenCalledTimes(2);
    cancel();
  });

  test('skips onTick while the document is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    const onTick = vi.fn().mockResolvedValue(undefined);
    const cancel = startJitteredPoll({ intervalMs: 1000, onTick });
    await vi.advanceTimersByTimeAsync(5000);
    expect(onTick).not.toHaveBeenCalled();
    cancel();
  });

  test('cancel prevents further ticks', async () => {
    const onTick = vi.fn().mockResolvedValue(undefined);
    const cancel = startJitteredPoll({ intervalMs: 1000, onTick });
    cancel();
    await vi.advanceTimersByTimeAsync(5000);
    expect(onTick).not.toHaveBeenCalled();
  });
});
