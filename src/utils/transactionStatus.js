/** @param {...unknown} values */
export function firstNonEmptyTrimmed(...values) {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

/**
 * Human-readable DeliverTx message from Tendermint `block_results` entry.
 * @param {{ log?: string, info?: string, raw_log?: string, message?: string } | null | undefined} abciResult
 */
export function deliverTxLogFromAbciResult(abciResult) {
  if (!abciResult) return null;
  return firstNonEmptyTrimmed(
    abciResult.log,
    abciResult.info,
    abciResult.raw_log,
    abciResult.message
  );
}

/**
 * Failure / deliver log from an explorer transaction object (indexer and/or merged RPC).
 * @param {Record<string, unknown> | null | undefined} tx
 */
export function deliverTxFailureMessage(tx) {
  if (!tx) return null;
  return firstNonEmptyTrimmed(
    tx.abci_log,
    tx.abciLog,
    tx.log,
    tx.reason,
    tx.error,
    tx.message,
    tx.info,
    tx.raw_log
  );
}

/**
 * Execution status from an indexed transaction row.
 * @param {{ status?: string, abci_code?: number | null, abci_log?: string | null } | null | undefined} indexedTx
 */
export function resolveTransactionExecutionStatus(indexedTx) {
  if (!indexedTx) {
    return { success: false, failed: false, unknown: true, label: 'UNKNOWN' };
  }

  const status = String(indexedTx.status || '').toLowerCase();
  if (status === 'success') {
    return { success: true, failed: false, unknown: false, label: 'SUCCESS' };
  }
  if (status === 'failed') {
    return { success: false, failed: true, unknown: false, label: 'FAILED' };
  }

  if (indexedTx.abci_code != null) {
    return executionStatusFromAbciCode(Number(indexedTx.abci_code));
  }

  return { success: false, failed: false, unknown: true, label: 'UNKNOWN' };
}

/**
 * @param {number} code
 */
export function executionStatusFromAbciCode(code) {
  if (code === 0) {
    return { success: true, failed: false, unknown: false, label: 'SUCCESS' };
  }
  return { success: false, failed: true, unknown: false, label: 'FAILED' };
}

/**
 * @param {{ code?: number | null } | null | undefined} abciResult
 */
export function executionStatusFromBlockResult(abciResult) {
  if (!abciResult || abciResult.code == null) {
    return { success: false, failed: false, unknown: true, label: 'UNKNOWN' };
  }
  return executionStatusFromAbciCode(Number(abciResult.code));
}
