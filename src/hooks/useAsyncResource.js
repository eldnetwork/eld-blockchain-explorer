import { useEffect, useRef, useState } from 'react';
import { isAbortError } from '../api';
import { fetchWithRetry } from '../utils/retryFetch';

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
 * @template T
 * @param {object} options
 * @param {(signal: AbortSignal) => Promise<T>} options.fetcher
 * @param {readonly unknown[]} [options.deps]
 * @param {boolean} [options.enabled]
 * @param {number | null} [options.intervalMs]
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
  retry = false,
  errorMessage = defaultErrorMessage,
  initialData = null,
  resetDataOnError = false,
  clearOnDisabled = false,
  onError,
}) {
  const requestKey = depsKey(enabled, deps);

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

  const [snapshot, setSnapshot] = useState({
    key: requestKey,
    data: initialData,
    error: null,
    completed: !enabled,
    isInitialLoad: true,
  });

  const pending = enabled && snapshot.key !== requestKey;
  const loading = enabled && (pending || !snapshot.completed);
  const data = !enabled && clearOnDisabled ? initialDataRef.current : snapshot.data;
  const error = !enabled
    ? clearOnDisabled
      ? null
      : snapshot.error
    : snapshot.key === requestKey
      ? snapshot.error
      : null;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const ac = new AbortController();
    let cancelled = false;
    let retryTimeoutId = null;

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
                }, intervalMs);
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

    load(false);

    const intervalId = intervalMs
      ? setInterval(() => {
          load(true);
        }, intervalMs)
      : null;

    return () => {
      cancelled = true;
      ac.abort();
      if (intervalId) clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [requestKey, enabled, intervalMs, retry]);

  return {
    data,
    loading,
    error,
    isInitialLoad: snapshot.isInitialLoad,
  };
}

export default useAsyncResource;
