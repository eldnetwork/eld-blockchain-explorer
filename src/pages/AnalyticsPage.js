import { useEffect, useState } from 'react';
import { fetchDiskHistory, fetchHealth, fetchLatestDisk } from '../analytics/api/client';
import DiskWidget from '../analytics/components/DiskWidget';
import { isDiskSnapshot } from '../analytics/lib/series';
import './AnalyticsPage.css';

const REFRESH_MS = 30_000;
const HISTORY_LIMIT = 48;

function AnalyticsPage() {
  const [state, setState] = useState({ status: 'loading' });
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [latestRaw, historyRaw] = await Promise.all([
          fetchLatestDisk(),
          fetchDiskHistory(HISTORY_LIMIT),
        ]);
        const history = (Array.isArray(historyRaw) ? historyRaw : []).filter(isDiskSnapshot);
        const latest = isDiskSnapshot(latestRaw)
          ? latestRaw
          : [...history].sort((a, b) => a.collected_at.localeCompare(b.collected_at)).at(-1);
        let healthy = true;
        try {
          await fetchHealth();
        } catch {
          healthy = false;
        }
        if (cancelled) return;
        setUpdatedAt(new Date());
        if (!latest) {
          setState({ status: 'empty', healthy });
          return;
        }
        setState({ status: 'ready', latest, history, healthy });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        });
      }
    }

    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const apiLabel =
    state.status === 'ready' || state.status === 'empty'
      ? state.healthy
        ? 'up'
        : 'down'
      : state.status === 'error'
        ? 'down'
        : '…';

  return (
    <div className="analytics-page">
      <header className="analytics-page__header">
        <div>
          <p className="eyebrow">Local cluster</p>
          <h1>Disk analytics</h1>
        </div>
        <div className="analytics-page__meta">
          <div className="analytics-page__meta-row">
            <span className="analytics-page__meta-label">api:</span>
            <span
              className={`analytics-page__meta-value${
                apiLabel === 'up' ? ' is-ok' : apiLabel === 'down' ? ' is-bad' : ''
              }`}
            >
              {apiLabel}
            </span>
          </div>
          <div className="analytics-page__meta-row">
            <span className="analytics-page__meta-label">refreshed:</span>
            <span className="analytics-page__meta-value">
              {updatedAt ? updatedAt.toLocaleTimeString() : '--'}
            </span>
          </div>
        </div>
      </header>

      <main>
        {state.status === 'loading' && <p className="status-line">Loading disk analytics…</p>}
        {state.status === 'empty' && (
          <div className="status-line">
            <p>No disk snapshot yet.</p>
            <p className="muted">
              Snapshots are taken every 30 minutes. <code>/analytics/usage/latest</code> returned
              nothing, so the collector may still be starting.
            </p>
          </div>
        )}
        {state.status === 'error' && (
          <div className="status-line error">
            <p>Could not reach the analytics API.</p>
            <p>{state.message}</p>
            <p className="muted">
              Check <code>VITE_ANALYTICS_API_URL</code> / the Vite <code>/analytics-api</code> proxy
              (<code>ANALYTICS_API_URL</code>).
            </p>
          </div>
        )}
        {state.status === 'ready' && <DiskWidget latest={state.latest} history={state.history} />}
      </main>
    </div>
  );
}

export default AnalyticsPage;
