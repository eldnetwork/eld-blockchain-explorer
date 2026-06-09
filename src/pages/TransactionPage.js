import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import useTransaction from '../hooks/useTransaction';
import useBlockTransaction from '../hooks/useBlockTransaction';
import useEvents from '../hooks/useEvents';
import useContract from '../hooks/useContract';
import { Box, Heading, Text, VStack, HStack, Link, List, ListItem } from '@chakra-ui/react';
import AsciiBox from '../components/AsciiBox';
import { formatELDAmount } from '../utils/formatAmount';
import { normalizeAccountAddress } from '../utils/accountAddress';
import { resolveTransactionExecutionStatus, deliverTxFailureMessage } from '../utils/transactionStatus';
import { formatEventForDisplay } from '../utils/eventDisplay';
import './TransactionPage.css';

function TransactionPage() {
  const { hash, height: blockHeightParam, index: blockIndexParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // /tx/:hash, /transaction?id=..., or /block/:height/tx/:index (Tendermint RPC)
  const transactionId = hash || searchParams.get('id');
  const fromBlockRoute =
    blockHeightParam != null &&
    blockIndexParam != null &&
    !Number.isNaN(parseInt(blockIndexParam, 10));
  const blockHeight = fromBlockRoute ? blockHeightParam : null;
  const blockIndex = fromBlockRoute ? parseInt(blockIndexParam, 10) : null;

  const { transaction: blockTx, loading: blockLoading, error: blockError } = useBlockTransaction(
    blockHeight,
    blockIndex
  );
  const { transaction: indexerTx, loading: indexerLoading, error: indexerError } = useTransaction(
    fromBlockRoute ? null : transactionId
  );
  const transaction = fromBlockRoute ? blockTx : indexerTx;
  const loading = fromBlockRoute ? blockLoading : indexerLoading;
  const error = fromBlockRoute ? blockError : indexerError;

  const eventsTxId = transaction?.id || (fromBlockRoute ? null : transactionId);
  const { events: apiEvents, loading: eventsLoading, error: eventsError } = useEvents(eventsTxId);
  const rpcEvents = transaction?.rpc_events || [];
  const events = eventsTxId ? apiEvents : rpcEvents;
  const eventsLoadingResolved = eventsTxId ? eventsLoading : false;
  const eventsErrorResolved = eventsTxId ? eventsError : null;

  const [contractId, setContractId] = useState(null);

  // Extract contract_id from AddContract transaction
  useEffect(() => {
    if (!transaction) return;
    
    const tx = transaction.tx || {};
    const payload = tx.payload || {};
    const txType = payload.type || 'Unknown';
    
    if (txType === 'AddContract') {
      // Check payload first
      let id = payload.contract_id || payload.id;
      
      // If not in payload, check events for contract_id
      if (!id && events && events.length > 0) {
        const contractEvent = events.find(e => e.contract_id || e.id);
        id = contractEvent?.contract_id || contractEvent?.id;
      }
      
      setContractId(id);
    } else {
      setContractId(null);
    }
  }, [transaction, events]);

  // Call useContract hook before any early returns (React Hooks rule)
  const { contract, loading: contractLoading, error: contractError } = useContract(contractId);

  // Extract WASM bytecode (before early returns)
  const tx = transaction?.tx || {};
  const payload = tx.payload || {};
  const txType = payload.type || 'Unknown';
  const isAddContract = txType === 'AddContract';
  const wasmBytecode = isAddContract ? payload.wasm_byte_code : null;

  if (loading) return <Box className="explorer-tx__state">Loading transaction...</Box>;
  if (error) return <Box className="explorer-tx__state explorer-tx__state--error">Error: {error}</Box>;
  if (!transaction) return <Box className="explorer-tx__state">No transaction found</Box>;

  const isTransfer = txType === 'Transfer';
  const txId =
    transaction.id ||
    (fromBlockRoute
      ? `block ${transaction.block_height} · index ${transaction.block_index}`
      : transactionId || 'unknown');
  const txIdShort = transaction.id
    ? transaction.id.length > 16
      ? `${transaction.id.slice(0, 6)}...${transaction.id.slice(-4)}`
      : transaction.id
    : fromBlockRoute
      ? `#${transaction.block_index}`
      : txId.length > 16
        ? `${txId.slice(0, 6)}...${txId.slice(-4)}`
        : txId;
  const timestampDisplay = transaction.timestamp
    ? new Date(transaction.timestamp * 1000).toLocaleString()
    : transaction.block_time
      ? new Date(transaction.block_time).toLocaleString()
      : 'N/A';
  const executionStatus = resolveTransactionExecutionStatus(transaction);
  const statusLabel = executionStatus.unknown
    ? String(transaction.status || 'Unknown').toUpperCase()
    : executionStatus.label;
  const statusClass = executionStatus.success
    ? 'explorer-tx__status--ok'
    : executionStatus.failed
      ? 'explorer-tx__status--bad'
      : 'explorer-tx__status--unknown';
  const failureReason =
    deliverTxFailureMessage(transaction) ||
    (executionStatus.failed && transaction.abci_code != null
      ? `ABCI code ${transaction.abci_code}`
      : null);
  const failureCalloutText =
    failureReason ||
    (executionStatus.failed
      ? 'This transaction failed on chain, but no deliver log was included in the API response.'
      : null);

  const payloadEntries = Object.entries(payload).filter(([key]) => key !== 'type' && key !== 'sender' && (!isAddContract || key !== 'wasm_byte_code'));
  const renderAccountLink = (rawValue, className) => {
    const value = String(rawValue);

    return (
      <Link onClick={() => navigate(`/account/${normalizeAccountAddress(value) || value}`)} className={className || 'explorer-tx__sender-link'}>
        {value}
      </Link>
    );
  };

  return (
    <Box className="explorer-tx">
      <HStack className="explorer-tx__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-tx__crumb-link">← Explorer</Link>
        <Text className="explorer-tx__crumb-sep">TX</Text>
        <Text className="explorer-tx__crumb-current">{txIdShort}</Text>
      </HStack>

      <Heading className="explorer-tx__title" as="h1">TRANSACTION</Heading>

      <Box mb={6}>
        <Link as={RouterLink} to="/" className="explorer-tx__crumb-link">
          ← Back
        </Link>
      </Box>

      {executionStatus.failed && failureCalloutText && (
        <AsciiBox mb={5} p={4} className="explorer-tx__failure-callout">
          <Text className="explorer-tx__failure-callout-label">Failure reason (DeliverTx)</Text>
          <Text className="explorer-tx__mono explorer-tx__pre explorer-tx__failure-callout-body">{failureCalloutText}</Text>
        </AsciiBox>
      )}

      <section className="explorer-tx__section">
        <h2><span /> GENERAL INFORMATION</h2>
        <div className="explorer-tx__kv-grid">
          <div><span>TRANSACTION ID</span><strong className="explorer-tx__mono">{txId}</strong></div>
          <div>
            <span>STATUS</span>
            <strong>
              <em className={`explorer-tx__status ${statusClass}`}>
                ● {statusLabel}
              </em>
            </strong>
          </div>
          <div>
            <span>BLOCK HEIGHT</span>
            <strong>
              <Link onClick={() => navigate(`/block/${transaction.block_height}`)} className="explorer-tx__block-link">
                {transaction.block_height}
              </Link>
            </strong>
          </div>
          <div><span>BLOCK INDEX</span><strong>{transaction.block_index}</strong></div>
          <div><span>TIMESTAMP</span><strong>{timestampDisplay}</strong></div>
          {transaction.gas_used != null && <div><span>GAS USED</span><strong>{transaction.gas_used}</strong></div>}
        </div>
      </section>

      <section className="explorer-tx__section">
        <h2><span /> TRANSACTION DATA</h2>
        <div className="explorer-tx__kv-grid">
          <div><span>TYPE</span><strong>{txType}</strong></div>
          {tx.nonce !== undefined && <div><span>NONCE</span><strong>{tx.nonce}</strong></div>}
          {tx.fee !== undefined && <div><span>FEE</span><strong className="explorer-tx__mono">{formatELDAmount(tx.fee)}</strong></div>}
          {tx.sig && <div><span>SIGNATURE</span><strong className="explorer-tx__mono">{tx.sig}</strong></div>}
          {tx.public_key && <div><span>PUBLIC KEY</span><strong className="explorer-tx__mono">{tx.public_key}</strong></div>}
        </div>
      </section>

      <section className="explorer-tx__section">
        <h2><span /> PAYLOAD DETAILS</h2>
        <div className="explorer-tx__kv-grid">
          {payload.sender && (
            <div>
              <span>SENDER</span>
              <strong>
                <Link onClick={() => navigate(`/account/${normalizeAccountAddress(payload.sender) || payload.sender}`)} className="explorer-tx__sender-link">
                  {payload.sender}
                </Link>
              </strong>
            </div>
          )}
          {payloadEntries.map(([key, value]) => {
            if (isTransfer && key === 'recipient') {
              return (
                <div key={key}>
                  <span>RECIPIENT</span>
                  <strong>
                    <Link onClick={() => navigate(`/account/${normalizeAccountAddress(String(value)) || value}`)} className="explorer-tx__mono">
                      {String(value)}
                    </Link>
                  </strong>
                </div>
              );
            }

            const shouldFormatAmount = key === 'amount';
            const isAddressField = /(address|owner|signer|sender|recipient|account)/i.test(String(key));
            const valueAsString = typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : shouldFormatAmount ? formatELDAmount(value) : String(value);
            return (
              <div key={key}>
                <span>{String(key).replace(/_/g, ' ').toUpperCase()}</span>
                <strong className={typeof value === 'object' ? 'explorer-tx__mono explorer-tx__pre' : shouldFormatAmount ? 'explorer-tx__mono' : undefined}>
                  {typeof value === 'object' && value !== null ? valueAsString : isAddressField ? renderAccountLink(valueAsString) : valueAsString}
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="explorer-tx__section">
        <h2><span /> EVENTS</h2>
        {eventsLoadingResolved ? (
          <Text className="explorer-tx__muted">Loading events...</Text>
        ) : eventsErrorResolved ? (
          <Text className="explorer-tx__muted">Failed to load events: {eventsErrorResolved}</Text>
        ) : events.length === 0 ? (
          <Text className="explorer-tx__muted">No events found</Text>
        ) : (
          <List spacing={2} p={3}>
            {events.map((event, index) => (
              <ListItem key={index}>
                <AsciiBox p={2} className="explorer-tx__event-item">
                  <Text className="explorer-tx__mono explorer-tx__pre">{JSON.stringify(formatEventForDisplay(event), null, 2)}</Text>
                </AsciiBox>
              </ListItem>
            ))}
          </List>
        )}
      </section>

      {isAddContract && (wasmBytecode || contractId) && (
        <section className="explorer-tx__section">
          <h2><span /> CONTRACT CODE</h2>
          <div className="explorer-tx__kv-grid">
            {contractId && <div><span>CONTRACT ID</span><strong className="explorer-tx__mono">{contractId}</strong></div>}
            {wasmBytecode && (
              <div>
                <span>WASM BYTECODE</span>
                <strong className="explorer-tx__mono explorer-tx__pre">
                  {typeof wasmBytecode === 'string' ? wasmBytecode : JSON.stringify(wasmBytecode)}
                </strong>
              </div>
            )}
            {!wasmBytecode && contractLoading && <div><span>STATUS</span><strong>Loading contract code...</strong></div>}
            {!wasmBytecode && contractError && <div><span>ERROR</span><strong>{contractError}</strong></div>}
            {!wasmBytecode && contract && <div><span>WASM BYTECODE</span><strong className="explorer-tx__mono explorer-tx__pre">{contract.code}</strong></div>}
          </div>
        </section>
      )}

    </Box>
  );
}

export default TransactionPage;