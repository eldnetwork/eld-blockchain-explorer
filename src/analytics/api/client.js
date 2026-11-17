// Prod: https://analytics.eld.network + /health (no /api prefix, no port).
// Dev: /analytics-api (Vite proxy → ANALYTICS_API_URL).
const ANALYTICS_API_BASE = (import.meta.env.VITE_ANALYTICS_API_URL || '/analytics-api').replace(
  /\/$/,
  '',
);

async function getJson(path) {
  const response = await fetch(`${ANALYTICS_API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${path} failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined;
  }
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  return JSON.parse(text);
}

export function fetchHealth() {
  return getJson('/health');
}

export function fetchLatestDisk() {
  return getJson('/analytics/usage/latest');
}

export function fetchDiskHistory(limit = 24) {
  return getJson(`/analytics/usage/history?limit=${limit}`);
}
