import { useEffect, useRef, useState } from 'react';
import { isAbortError } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';
import { nextDelay, startJitteredPoll } from '../utils/pollSchedule';
import usePageVisible from './usePageVisible';

function defaultErrorMessage(err) {
  if (err instanceof Error && err.message) return err.message;
  if (err == null) return 'Failed to load';
  return String(err);
}

function resolveErrorMessage(errorMessage, err) {
  return typeof errorMessage === 'function' ? errorMessage(err) : errorMessage;
}

function depsKey(enabled, deps) {
  return `${enabled ? '1' : '0'}:${JSON.stringify(deps)}`;
}

/**
 * Shared abortable fetcher with optional polling and fetchWithRetry.
 * Loading is derived from the request key so effects never call setState synchronously.
 *
 * Polling uses a recursive timeout with ±20% jitter and pauses while the tab is hidden.
 * `refreshKey` triggers a silent refresh (`load(true)`) without changing the request key.
 *
 * @template T
 * @param {object} options
 * @param {(signal: AbortSignal) => Promise<T>} options.fetcher
 * @param {readonly unknown[]} [options.deps]
 * @param {boolean} [options.enabled]
 * @param {number | null} [options.intervalMs]
 * @param {unknown} [options.refreshKey]
 * @param {boolean} [options.retry]
 * @param {string | ((err?: unknown) => string)} [options.errorMessage]
 * @param {T} [options.initialData]
 * @param {boolean} [options.resetDataOnError]
 * @param {boolean} [options.clearOnDisabled]
 * @param {(err: unknown) => void} [options.onError]
 */
function useAsyncResource({
  fetcher,
  deps = [],
  enabled = true,
  intervalMs = null,
  refreshKey,
  retry = false,
  errorMessage = defaultErrorMessage,
  initialData = null,
  resetDataOnError = false,
  clearOnDisabled = false,
  onError,
}) {
  const visible = usePageVisible();
  const active = enabled && visible;
  const requestKey = depsKey(active, deps);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const errorMessageRef = useRef(errorMessage);
  errorMessageRef.current = errorMessage;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;
  const resetDataOnErrorRef = useRef(resetDataOnError);
  resetDataOnErrorRef.current = resetDataOnError;

  const loadRef = useRef(/** @type {null | ((isRefresh: boolean) => Promise<void>)} */ (null));
  const processedRefreshKeyRef = useRef(refreshKey);

  const [snapshot, setSnapshot] = useState({
    key: requestKey,
    data: initialData,
    error: null,
    completed: !active,
    isInitialLoad: true,
  });

  const pending = active && snapshot.key !== requestKey;
  const loading = active && (pending || !snapshot.completed);
  const data = !enabled && clearOnDisabled ? initialDataRef.current : snapshot.data;
  const error = !enabled
    ? clearOnDisabled
      ? null
      : snapshot.error
    : snapshot.key === requestKey
      ? snapshot.error
      : null;

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const ac = new AbortController();
    let cancelled = false;
    let retryTimeoutId = null;
    /** @type {null | (() => void)} */
    let cancelPoll = null;

    async function load(isRefresh) {
      if (cancelled || ac.signal.aborted) return;

      const applySuccess = (value) => {
        setSnapshot({
          key: requestKey,
          data: value,
          error: null,
          completed: true,
          isInitialLoad: false,
        });
      };

      const applyFailure = (err) => {
        if (isRefresh) return;
        onErrorRef.current?.(err);
        setSnapshot((prev) => ({
          key: requestKey,
          data: resetDataOnErrorRef.current ? initialDataRef.current : prev.data,
          error: resolveErrorMessage(errorMessageRef.current, err),
          completed: true,
          isInitialLoad: false,
        }));
      };

      if (retry) {
        const result = await fetchWithRetry(() => fetcherRef.current(ac.signal), {
          signal: ac.signal,
          cancelled: () => cancelled,
          isRefresh,
          onExhausted: intervalMs
            ? () => {
                retryTimeoutId = setTimeout(() => {
                  if (!cancelled) load(false);
                }, nextDelay(intervalMs));
              }
            : undefined,
        });
        if (cancelled || result.aborted) return;
        if (!result.ok) {
          applyFailure();
          return;
        }
        applySuccess(result.value);
        return;
      }

      try {
        const value = await fetcherRef.current(ac.signal);
        if (cancelled || ac.signal.aborted) return;
        applySuccess(value);
      } catch (err) {
        if (cancelled || isAbortError(err) || ac.signal.aborted) return;
        applyFailure(err);
      }
    }

    loadRef.current = load;
    processedRefreshKeyRef.current = refreshKey;

    void load(false).finally(() => {
      if (!intervalMs || cancelled) return;
      cancelPoll = startJitteredPoll({
        intervalMs,
        isCancelled: () => cancelled,
        isPaused: () => typeof document !== 'undefined' && document.visibilityState !== 'visible',
        onTick: () => load(true),
      });
    });

    return () => {
      cancelled = true;
      ac.abort();
      cancelPoll?.();
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
    // refreshKey is synced onto processedRefreshKeyRef when this effect starts so a
    // concurrent refreshKey change does not double-fetch with load(false).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- requestKey captures enabled/deps/visibility
  }, [requestKey, active, intervalMs, retry]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    if (refreshKey === undefined) {
      return undefined;
    }
    if (Object.is(processedRefreshKeyRef.current, refreshKey)) {
      return undefined;
    }
    processedRefreshKeyRef.current = refreshKey;
    void loadRef.current?.(true);
    return undefined;
  }, [refreshKey, active]);

  return {
    data,
    loading,
    error,
    isInitialLoad: snapshot.isInitialLoad,
  };
}

export default useAsyncResource;
