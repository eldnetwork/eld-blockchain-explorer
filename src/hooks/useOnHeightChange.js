import { useEffect, useRef } from 'react';

/**
 * Invoke `onChange` when `latestHeight` advances after the first observed value.
 * Used so paginated lists can silent-refresh without treating the first height as a refetch.
 *
 * @param {number} latestHeight
 * @param {boolean} enabled
 * @param {() => (void | (() => void))} onChange
 */
function useOnHeightChange(latestHeight, enabled, onChange) {
  const prevRef = useRef(/** @type {number | null} */ (null));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled || latestHeight <= 0) {
      return undefined;
    }
    if (prevRef.current == null) {
      prevRef.current = latestHeight;
      return undefined;
    }
    if (prevRef.current === latestHeight) {
      return undefined;
    }
    prevRef.current = latestHeight;
    return onChangeRef.current();
  }, [latestHeight, enabled]);
}

export default useOnHeightChange;
