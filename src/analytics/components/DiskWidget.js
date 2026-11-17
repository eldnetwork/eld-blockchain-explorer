import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatBytes, formatShortTime, formatTime, sum } from '../lib/format';
import { snapshotTotals, toSeries } from '../lib/series';

const COLORS = {
  tendermint: '#62d58b',
  abci: '#ff7a18',
  cluster: '#8eb2ff',
  grid: 'var(--lh-border)',
  tick: 'var(--lh-faint)',
  muted: 'var(--lh-muted)',
};

function BytesTooltip({ active, payload, label }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__time">{formatTime(label)}</div>
      <ul>
        {payload.map((entry) => (
          <li key={entry.name}>
            <span style={{ background: entry.color }} />
            {entry.name}: {formatBytes(entry.value ?? 0)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiskWidget({ latest, history }) {
  const tendermintNodes = latest.tendermint_nodes ?? [];
  const abciApps = latest.abci_apps ?? [];
  const series = toSeries(history.length ? history : [latest]);
  const totals = snapshotTotals(latest);
  const tmTotals = {
    data: sum(tendermintNodes.map((n) => n.data_dir_bytes)),
    txIndex: sum(tendermintNodes.map((n) => n.tx_index_db_bytes)),
    evidence: sum(tendermintNodes.map((n) => n.evidence_db_bytes)),
  };
  const abciTotals = {
    data: sum(abciApps.map((n) => n.data_dir_bytes)),
    rocksdb: sum(abciApps.map((n) => n.rocksdb_bytes)),
    capacity: sum(abciApps.map((n) => n.capacity_bytes)),
  };

  return (
    <section className="disk-widget">
      <header className="disk-widget__header">
        <div>
          <p className="eyebrow">Disk analytics</p>
          <h2>Cluster storage</h2>
        </div>
        <div className="disk-widget__meta">
          {latest.block_height != null ? (
            <>
              <span>Latest snapshot block height</span>
              <strong>{latest.block_height.toLocaleString()}</strong>
            </>
          ) : null}
          <span>Latest sample</span>
          <strong>{formatTime(latest.collected_at)}</strong>
        </div>
      </header>

      <div className="stat-strip">
        <div className="stat">
          <span>Cluster data</span>
          <strong>{formatBytes(totals.cluster_total)}</strong>
        </div>
        <div className="stat">
          <span>Tendermint</span>
          <strong>{formatBytes(totals.tendermint_total)}</strong>
        </div>
        <div className="stat">
          <span>ABCI apps</span>
          <strong>{formatBytes(totals.abci_total)}</strong>
        </div>
      </div>

      <div className="chart-panel">
        <div className="chart-panel__title">
          <h3>Disk over time</h3>
          <p>
            Snapshots are taken every 30 minutes.{' '}
            {series.length === 1
              ? 'Only one sample so far — the line will fill in as history grows.'
              : `${series.length} samples from /analytics/usage/history.`}
          </p>
        </div>
        <div className="chart-panel__body">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="collected_at"
                tickFormatter={formatShortTime}
                tick={{ fill: COLORS.tick, fontSize: 11, fontFamily: 'IoskeleyMono, monospace' }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(v) => formatBytes(v, 0)}
                tick={{ fill: COLORS.tick, fontSize: 11, fontFamily: 'IoskeleyMono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<BytesTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="plainline"
                wrapperStyle={{
                  fontSize: 11,
                  color: COLORS.muted,
                  fontFamily: 'IoskeleyMono, monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              />
              <Area
                type="monotone"
                dataKey="abci_total"
                name="ABCI data"
                stroke={COLORS.abci}
                fill={COLORS.abci}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: series.length < 3 ? 4 : 0 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="tendermint_total"
                name="Tendermint data"
                stroke={COLORS.tendermint}
                fill={COLORS.tendermint}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: series.length < 3 ? 4 : 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="cluster_total"
                name="Cluster total"
                stroke={COLORS.cluster}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: series.length < 3 ? 4 : 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="latest-grid">
        <div className="panel">
          <h3>Tendermint nodes</h3>
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Data</th>
                <th>Tx index</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {tendermintNodes.map((node) => (
                <tr key={node.node_id}>
                  <td>{node.node_id}</td>
                  <td>{formatBytes(node.data_dir_bytes)}</td>
                  <td>{formatBytes(node.tx_index_db_bytes)}</td>
                  <td>{formatBytes(node.evidence_db_bytes)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td>Total</td>
                <td>{formatBytes(tmTotals.data)}</td>
                <td>{formatBytes(tmTotals.txIndex)}</td>
                <td>{formatBytes(tmTotals.evidence)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="panel">
          <h3>ABCI apps</h3>
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Data</th>
                <th>RocksDB</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {abciApps.map((app) => (
                <tr key={app.node_id}>
                  <td>{app.node_id}</td>
                  <td>{formatBytes(app.data_dir_bytes)}</td>
                  <td>{formatBytes(app.rocksdb_bytes)}</td>
                  <td>{formatBytes(app.capacity_bytes)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td>Total</td>
                <td>{formatBytes(abciTotals.data)}</td>
                <td>{formatBytes(abciTotals.rocksdb)}</td>
                <td>{formatBytes(abciTotals.capacity)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

export default DiskWidget;
