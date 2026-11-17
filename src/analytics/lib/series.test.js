import { describe, expect, it } from 'vitest';
import { isDiskSnapshot, snapshotTotals, toSeries } from './series';

function snapshot(partial) {
  return {
    tendermint_nodes: [],
    abci_apps: [],
    ...partial,
  };
}

describe('snapshotTotals', () => {
  it('sums tendermint and ABCI data dirs', () => {
    const totals = snapshotTotals(
      snapshot({
        collected_at: '2026-10-12T00:00:00Z',
        tendermint_nodes: [
          {
            node_id: 'tm-0',
            data_dir_bytes: 100,
            evidence_db_bytes: 0,
            tx_index_db_bytes: 0,
          },
        ],
        abci_apps: [
          {
            node_id: 'abci-0',
            data_dir_bytes: 50,
            rocksdb_bytes: 30,
            capacity_bytes: 20,
          },
        ],
      }),
    );

    expect(totals.tendermint_total).toBe(100);
    expect(totals.abci_total).toBe(50);
    expect(totals.abci_rocksdb).toBe(30);
    expect(totals.abci_capacity).toBe(20);
    expect(totals.cluster_total).toBe(150);
  });

  it('returns zeros when the API has no snapshot', () => {
    const totals = snapshotTotals(null);
    expect(totals.tendermint_total).toBe(0);
    expect(totals.abci_total).toBe(0);
    expect(totals.cluster_total).toBe(0);
  });
});

describe('toSeries', () => {
  it('sorts by collected_at and maps per-node keys', () => {
    const series = toSeries([
      snapshot({
        collected_at: '2026-10-12T01:00:00Z',
        tendermint_nodes: [
          {
            node_id: 'tm-0',
            data_dir_bytes: 20,
            evidence_db_bytes: 0,
            tx_index_db_bytes: 0,
          },
        ],
      }),
      snapshot({
        collected_at: '2026-10-12T00:00:00Z',
        abci_apps: [
          {
            node_id: 'abci-0',
            data_dir_bytes: 10,
            rocksdb_bytes: 0,
            capacity_bytes: 0,
          },
        ],
      }),
    ]);

    expect(series).toHaveLength(2);
    expect(series[0]?.collected_at).toBe('2026-10-12T00:00:00Z');
    expect(series[0]?.['abci_abci-0']).toBe(10);
    expect(series[1]?.['tm_tm-0']).toBe(20);
  });

  it('skips null history entries from the API', () => {
    const series = toSeries([null, snapshot({ collected_at: '2026-10-12T00:00:00Z' })]);

    expect(series).toHaveLength(1);
    expect(series[0]?.collected_at).toBe('2026-10-12T00:00:00Z');
    expect(isDiskSnapshot(null)).toBe(false);
  });
});
