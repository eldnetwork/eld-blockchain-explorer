import { sum } from './format';

export function isDiskSnapshot(value) {
  if (value == null || typeof value !== 'object') return false;
  return typeof value.collected_at === 'string';
}

export function snapshotTotals(snapshot) {
  const tendermintNodes = snapshot?.tendermint_nodes ?? [];
  const abciApps = snapshot?.abci_apps ?? [];
  const tendermint_total = sum(tendermintNodes.map((n) => n.data_dir_bytes));
  const abci_total = sum(abciApps.map((n) => n.data_dir_bytes));
  const abci_rocksdb = sum(abciApps.map((n) => n.rocksdb_bytes));
  const abci_capacity = sum(abciApps.map((n) => n.capacity_bytes));
  return {
    tendermint_total,
    abci_total,
    abci_rocksdb,
    abci_capacity,
    cluster_total: tendermint_total + abci_total,
  };
}

export function toSeries(history) {
  return history
    .filter(isDiskSnapshot)
    .sort((a, b) => a.collected_at.localeCompare(b.collected_at))
    .map((snapshot) => {
      const totals = snapshotTotals(snapshot);
      const point = {
        collected_at: snapshot.collected_at,
        label: snapshot.collected_at,
        tendermint_total: totals.tendermint_total,
        abci_total: totals.abci_total,
        abci_rocksdb: totals.abci_rocksdb,
        abci_capacity: totals.abci_capacity,
        cluster_total: totals.cluster_total,
      };

      for (const node of snapshot.tendermint_nodes ?? []) {
        point[`tm_${node.node_id}`] = node.data_dir_bytes;
      }
      for (const app of snapshot.abci_apps ?? []) {
        point[`abci_${app.node_id}`] = app.data_dir_bytes;
      }

      return point;
    });
}
