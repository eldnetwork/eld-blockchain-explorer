const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

export function formatBytes(bytes, digits = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exp;
  const precision = value >= 100 || exp === 0 ? 0 : digits;
  return `${value.toFixed(precision)} ${UNITS[exp]}`;
}

export function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatShortTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sum(values) {
  return values.reduce((acc, n) => acc + n, 0);
}
