import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange) {
  document.addEventListener('visibilitychange', onStoreChange);
  return () => document.removeEventListener('visibilitychange', onStoreChange);
}

function getSnapshot() {
  return document.visibilityState === 'visible';
}

function getServerSnapshot() {
  return true;
}

function usePageVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default usePageVisible;
