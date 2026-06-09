import { Buffer } from 'buffer';
import { RPC_URL, API_URL } from '../config';
import {
  executionStatusFromBlockResult,
  resolveTransactionExecutionStatus,
  deliverTxLogFromAbciResult,
  firstNonEmptyTrimmed,
  deliverTxFailureMessage,
} from './transactionStatus';

/**
 * Decode one entry from result.block.data.txs[i] (base64) to Eld Tx JSON.
 * @param {string} txBase64
 * @returns {object|null}
 */
export function decodeEldTxFromBlockBase64(txBase64) {
  try {
    const raw = Buffer.from(txBase64, 'base64');
    const txHex = raw.toString('utf-8');
    const txJson = Buffer.from(txHex, 'hex').toString('utf-8');
    return JSON.parse(txJson);
  } catch {
    try {
      return JSON.parse(Buffer.from(txBase64, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
}

/**
 * @param {number} blockHeight
 * @returns {Promise<Array<{ code: number, log: string, events?: Array }>|null>}
 */
export async function fetchBlockTxResults(blockHeight) {
  const res = await fetch(`${RPC_URL}/block_results?height=${blockHeight}`);
  const data = await res.json();
  const results = data?.result?.txs_results;
  return Array.isArray(results) ? results : null;
}

/**
 * @param {number} blockHeight
 * @param {string} [apiUrl]
 */
export async function fetchIndexedTransactionsForBlock(blockHeight, apiUrl = API_URL) {
  const blockIndexed = [];
  let continuation = null;
  const PAGE = 80;

  for (let guard = 0; guard < 500; guard++) {
    const params = new URLSearchParams({
      limit: String(PAGE),
      block_height: String(blockHeight),
    });
    if (continuation) {
      params.set('after_height', String(continuation.after_height));
      params.set('after_index', String(continuation.after_index));
    }
    const response = await fetch(`${apiUrl}/transactions?${params}`);
    const data = await response.json();
    const batch = Array.isArray(data?.transactions) ? data.transactions : [];
    blockIndexed.push(...batch);

    const hasMore = batch.length > 0 && data?.pagination?.has_next;
    if (!hasMore) break;
    continuation = {
      after_height: batch[batch.length - 1].block_height,
      after_index: batch[batch.length - 1].block_index,
    };
  }

  return blockIndexed.filter((tx) => tx.block_height === blockHeight);
}

/**
 * @param {object} tx
 * @returns {string}
 */
export function formatBlockTxListLabel(tx) {
  if (tx.id) {
    const txId = tx.id;
    return txId.length > 26 ? `${txId.slice(0, 10)}...${txId.slice(-6)}` : txId;
  }
  const challengeId = tx.parsedTx?.payload?.challenge_id;
  if (typeof challengeId === 'string' && challengeId.length > 0) {
    return challengeId.length > 20
      ? `${challengeId.slice(0, 8)}...${challengeId.slice(-6)}`
      : challengeId;
  }
  return `#${tx.blockIndex}`;
}

/**
 * Build transaction-page shape from Tendermint block bytes + block_results.
 */
export function buildTransactionViewFromRpc({
  blockHeight,
  blockIndex,
  parsedTx,
  abciResult,
  blockTime,
}) {
  const code = abciResult?.code != null ? Number(abciResult.code) : null;
  const status = code === 0 ? 'Success' : code != null ? 'Failed' : 'Unknown';
  const timestamp = blockTime
    ? Math.floor(new Date(blockTime).getTime() / 1000)
    : 0;

  return {
    id: null,
    block_height: blockHeight,
    block_index: blockIndex,
    timestamp,
    block_time: blockTime || null,
    gas_used: abciResult?.gas_used ?? null,
    status,
    abci_code: code,
    abci_log: deliverTxLogFromAbciResult(abciResult),
    tx: parsedTx,
    rpc_events: Array.isArray(abciResult?.events) ? abciResult.events : [],
  };
}

export function mergeIndexedWithRpcView(indexed, rpcView) {
  return {
    ...rpcView,
    ...indexed,
    tx: indexed.tx || rpcView.tx,
    status: indexed.status || rpcView.status,
    abci_code: indexed.abci_code ?? rpcView.abci_code,
    abci_log: firstNonEmptyTrimmed(
      rpcView.abci_log,
      indexed.abci_log,
      indexed.abciLog,
      indexed.log,
      indexed.reason,
      indexed.error,
      indexed.message
    ),
    gas_used: indexed.gas_used ?? rpcView.gas_used,
    timestamp: indexed.timestamp ?? rpcView.timestamp,
    rpc_events: rpcView.rpc_events,
  };
}

/**
 * Load one transaction at block index from Tendermint RPC (optionally enriched from indexer).
 * @param {number|string} blockHeight
 * @param {number|string} blockIndex
 */
export async function fetchBlockTransactionAtIndex(blockHeight, blockIndex) {
  const height = parseInt(blockHeight, 10);
  const index = parseInt(blockIndex, 10);
  if (Number.isNaN(height) || Number.isNaN(index)) {
    return null;
  }

  const [blockRes, resultsRes, indexedList] = await Promise.all([
    fetch(`${RPC_URL}/block?height=${height}`),
    fetch(`${RPC_URL}/block_results?height=${height}`),
    fetchIndexedTransactionsForBlock(height),
  ]);

  const block = (await blockRes.json())?.result?.block;
  const blockResults = (await resultsRes.json())?.result?.txs_results;
  const txs = block?.data?.txs;
  if (!Array.isArray(txs) || index < 0 || index >= txs.length) {
    return null;
  }

  const parsedTx = decodeEldTxFromBlockBase64(txs[index]);
  if (!parsedTx) {
    return null;
  }

  const rpcView = buildTransactionViewFromRpc({
    blockHeight: height,
    blockIndex: index,
    parsedTx,
    abciResult: blockResults?.[index],
    blockTime: block?.header?.time,
  });

  const indexed = indexedList.find((tx) => tx.block_index === index);
  return indexed ? mergeIndexedWithRpcView(indexed, rpcView) : rpcView;
}

/**
 * @returns {Array<{
 *   blockIndex: number,
 *   blockHeight: number,
 *   id: string|null,
 *   canNavigate: boolean,
 *   parsedTx: object,
 *   tx: { payload: { type: string }, fee: number },
 *   executionStatus: { success: boolean, failed: boolean, unknown: boolean, label: string },
 *   abciLog: string|null,
 * }>}
 */
export function buildBlockTransactionRows(
  parsedTxs,
  indexedTransactions,
  blockResults,
  blockHeight
) {
  const indexedByBlockIndex = new Map(
    indexedTransactions.map((tx) => [tx.block_index, tx])
  );

  return parsedTxs.map(({ parsedData, index }) => {
    const indexed = indexedByBlockIndex.get(index);
    const abciResult = blockResults?.[index];
    const executionStatus = indexed
      ? resolveTransactionExecutionStatus(indexed)
      : executionStatusFromBlockResult(abciResult);

    const id = indexed?.id ?? null;

    return {
      blockIndex: index,
      blockHeight,
      id,
      canNavigate: true,
      parsedTx: parsedData,
      tx: {
        payload: { type: parsedData.payload?.type || 'Unknown' },
        fee: parsedData.fee ?? 0,
      },
      executionStatus,
      abciLog: firstNonEmptyTrimmed(
        deliverTxFailureMessage(indexed),
        deliverTxLogFromAbciResult(abciResult)
      ),
    };
  });
}

/**
 * @param {{ header: { height: string | number }, data?: { txs?: string[] } }} block
 */
export async function loadBlockTransactions(block) {
  const blockHeight = parseInt(block.header.height, 10);
  const parsedTxs = (block.data?.txs || [])
    .map((txBase64, index) => {
      const parsedData = decodeEldTxFromBlockBase64(txBase64);
      return parsedData ? { parsedData, index } : null;
    })
    .filter(Boolean);

  const [indexed, blockResults] = await Promise.all([
    fetchIndexedTransactionsForBlock(blockHeight),
    fetchBlockTxResults(blockHeight),
  ]);

  return buildBlockTransactionRows(parsedTxs, indexed, blockResults, blockHeight);
}
