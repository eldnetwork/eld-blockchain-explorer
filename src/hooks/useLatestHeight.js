import { useSyncExternalStore } from 'react';
import { fetchRpcStatus } from '../api';
import { startJitteredPoll } from '../utils/pollSchedule';

const HEAD_POLL_MS = 8000;

let height = 0;
let subscriberCount = 0;
const listeners = new Set();
/** @type {null | (() => void)} */
let cancelPoll = null;
/** @type {null | (() => void)} */
let cancelVisibility = null;

function emit() {
  listeners.forEach((listener) => listener());
}

async function tick() {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return;
  }
  try {
    const status = await fetchRpcStatus();
    const next = parseInt(status?.result?.sync_info?.latest_block_height, 10);
    if (Number.isFinite(next) && next !== height) {
      height = next;
      emit();
    }
  } catch {
    // keep last height
  }
}

function start() {
  if (cancelPoll) return;
  void tick();
  cancelPoll = startJitteredPoll({
    intervalMs: HEAD_POLL_MS,
    isCancelled: () => subscriberCount === 0,
    isPaused: () => typeof document !== 'undefined' && document.visibilityState !== 'visible',
    onTick: tick,
  });
  if (typeof document !== 'undefined') {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    cancelVisibility = () => document.removeEventListener('visibilitychange', onVisibility);
  }
}

function stop() {
  cancelPoll?.();
  cancelPoll = null;
  cancelVisibility?.();
  cancelVisibility = null;
}

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  subscriberCount += 1;
  if (subscriberCount === 1) start();
  return () => {
    listeners.delete(onStoreChange);
    subscriberCount -= 1;
    if (subscriberCount === 0) stop();
  };
}

function getSnapshot() {
  return height;
}

function getServerSnapshot() {
  return 0;
}

/**
 * One jittered `/status` poll per tab. Lists should refetch when this value changes.
 * @returns {number}
 */
function useLatestHeight() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** @internal vitest isolation */
export function __resetLatestHeightForTests() {
  height = 0;
  subscriberCount = 0;
  listeners.clear();
  stop();
}

export default useLatestHeight;
