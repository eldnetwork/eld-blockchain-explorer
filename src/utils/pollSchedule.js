/**
 * ±20% jitter so many tabs do not share the same poll beat.
 * @param {number} intervalMs
 * @returns {number}
 */
export function nextDelay(intervalMs) {
  const jitter = intervalMs * 0.2;
  return intervalMs + (Math.random() * 2 - 1) * jitter;
}

function isDocumentHidden() {
  return typeof document !== 'undefined' && document.visibilityState !== 'visible';
}

/**
 * Recursive timeout poller. Skips ticks while the document is hidden (or `isPaused`).
 * @param {{
 *   intervalMs: number,
 *   isCancelled?: () => boolean,
 *   isPaused?: () => boolean,
 *   onTick: () => unknown,
 * }} options
 * @returns {() => void} cancel
 */
export function startJitteredPoll({ intervalMs, isCancelled, isPaused, onTick }) {
  let timeoutId = null;
  let stopped = false;

  const schedule = () => {
    if (stopped || !intervalMs || isCancelled?.()) return;
    timeoutId = setTimeout(() => {
      if (stopped || isCancelled?.()) return;
      if (isPaused?.() || isDocumentHidden()) {
        schedule();
        return;
      }
      Promise.resolve(onTick()).finally(schedule);
    }, nextDelay(intervalMs));
  };

  schedule();

  return () => {
    stopped = true;
    if (timeoutId != null) clearTimeout(timeoutId);
    timeoutId = null;
  };
}
