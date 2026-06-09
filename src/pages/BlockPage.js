import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import useBlock from '../hooks/useBlock';
import { Box, Heading, Text, List, ListItem, HStack, Skeleton, Link } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import AsciiBox from '../components/AsciiBox';
import { normalizeAccountAddress } from '../utils/accountAddress';
import { loadBlockTransactions, formatBlockTxListLabel } from '../utils/blockTransactions';
import './BlockPage.css';

function BlockPage() {
  const { height } = useParams();
  const navigate = useNavigate();
  const { block, loading, error } = useBlock(height);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    async function parseTransactions() {
      if (!block || !block.data || !block.data.txs || block.data.txs.length === 0) {
        setTransactions([]);
        return;
      }

      setTxLoading(true);
      try {
        const rows = await loadBlockTransactions(block);
        setTransactions(rows);
      } catch (err) {
        console.error('Error parsing transactions:', err);
        setTransactions([]);
      } finally {
        setTxLoading(false);
      }
    }

    if (block) {
      parseTransactions();
    }
  }, [block]);

  const goToBlockTransaction = (blockIndex) => {
    navigate(`/block/${height}/tx/${blockIndex}`);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    return dateTimeString.replace('T', ' ').split('.')[0];
  };

  const statusBadgeClass = (executionStatus) => {
    if (executionStatus.success) return 'explorer-record__tx-status--ok';
    if (executionStatus.failed) return 'explorer-record__tx-status--bad';
    return 'explorer-record__tx-status--unknown';
  };

  if (loading) return <Box className="explorer-record__state">Loading block...</Box>;
  if (error) return <Box className="explorer-record__state explorer-record__state--error">Error: {error}</Box>;
  if (!block) return <Box className="explorer-record__state">No block found</Box>;

  const header = block.header || {};
  const blockId = block.block_id || {};
  const lastCommit = block.last_commit || {};
  const txCount = block.data?.txs ? block.data.txs.length : 0;

  return (
    <Box className="explorer-record">
      <HStack className="explorer-record__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">← Explorer</Link>
        <Text className="explorer-record__crumb-sep">Block</Text>
        <Text className="explorer-record__crumb-current">{header.height}</Text>
      </HStack>

      <Heading className="explorer-record__title" as="h1">
        BLOCK <Text as="span">#{header.height}</Text>
      </Heading>

      <Box mb={6}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">
          ← Back
        </Link>
      </Box>

      <section className="explorer-record__section">
        <h2><span /> BASIC INFORMATION</h2>
        <div className="explorer-record__kv-grid">
          <div><span>HEIGHT</span><strong>{header.height || 'N/A'}</strong></div>
          <div><span>CHAIN ID</span><strong>{header.chain_id || 'N/A'}</strong></div>
          <div><span>TIME</span><strong>{formatDateTime(header.time) || 'N/A'}</strong></div>
          <div><span>TX COUNT</span><strong>{txCount}</strong></div>
        </div>
      </section>

      <section className="explorer-record__section">
        <h2><span /> BLOCK ID</h2>
        <div className="explorer-record__kv-grid">
          <div><span>HASH</span><strong className="explorer-record__mono">{blockId.hash || 'N/A'}</strong></div>
          {blockId.parts && <div><span>PARTS TOTAL</span><strong>{blockId.parts.total}</strong></div>}
          {blockId.parts && <div><span>PARTS HASH</span><strong className="explorer-record__mono">{blockId.parts.hash || 'N/A'}</strong></div>}
        </div>
      </section>

      <section className="explorer-record__section">
        <h2><span /> HEADER HASHES</h2>
        <div className="explorer-record__kv-grid">
          <div><span>LAST BLOCK ID</span><strong className="explorer-record__mono">{header.last_block_id?.hash || 'N/A'}</strong></div>
          <div><span>LAST COMMIT HASH</span><strong className="explorer-record__mono">{header.last_commit_hash || 'N/A'}</strong></div>
          <div><span>DATA HASH</span><strong className="explorer-record__mono">{header.data_hash || 'N/A'}</strong></div>
          <div><span>VALIDATORS HASH</span><strong className="explorer-record__mono">{header.validators_hash || 'N/A'}</strong></div>
          <div><span>NEXT VALIDATORS</span><strong className="explorer-record__mono">{header.next_validators_hash || 'N/A'}</strong></div>
          <div><span>CONSENSUS HASH</span><strong className="explorer-record__mono">{header.consensus_hash || 'N/A'}</strong></div>
          <div><span>APP HASH</span><strong className="explorer-record__mono">{header.app_hash || 'N/A'}</strong></div>
          <div><span>LAST RESULTS HASH</span><strong className="explorer-record__mono">{header.last_results_hash || 'N/A'}</strong></div>
          <div><span>EVIDENCE HASH</span><strong className="explorer-record__mono">{header.evidence_hash || 'N/A'}</strong></div>
        </div>
      </section>

      {header.proposer_address && (
        <section className="explorer-record__section">
          <h2><span /> PROPOSER</h2>
          <div className="explorer-record__kv-grid">
            <div>
              <span>ADDRESS</span>
              <strong className="explorer-record__mono">
                <Link onClick={() => navigate(`/account/${normalizeAccountAddress(header.proposer_address) || header.proposer_address}`)} className="explorer-record__tx-hash">
                  {header.proposer_address}
                </Link>
              </strong>
            </div>
          </div>
        </section>
      )}

      {lastCommit.signatures && lastCommit.signatures.length > 0 && (
        <section className="explorer-record__section">
          <h2><span /> LAST COMMIT</h2>
          <div className="explorer-record__kv-grid">
            <div><span>HEIGHT</span><strong>{lastCommit.height || 'N/A'}</strong></div>
            <div><span>ROUND</span><strong>{lastCommit.round || 'N/A'}</strong></div>
            <div><span>SIGNATURES</span><strong>{lastCommit.signatures.length}</strong></div>
            <div><span>BLOCK ID HASH</span><strong className="explorer-record__mono">{lastCommit.block_id?.hash || 'N/A'}</strong></div>
          </div>
        </section>
      )}

      {block.data.txs && block.data.txs.length > 0 && (
        <section className="explorer-record__section">
          <h2><span /> TRANSACTIONS ({txCount})</h2>
          {txLoading ? (
            <List spacing={3}>
              {block.data.txs.map((_, index) => (
                <ListItem key={index}>
                  <AsciiBox p={2} className="explorer-record__tx-item">
                    <HStack spacing={4}>
                      <Skeleton height="20px" width="20px" />
                      <Skeleton height="20px" width="300px" />
                      <Skeleton height="20px" width="150px" />
                    </HStack>
                  </AsciiBox>
                </ListItem>
              ))}
            </List>
          ) : transactions.length > 0 ? (
            <List spacing={2}>
              {transactions.map((tx) => {
                const txType = tx.tx?.payload?.type || 'unknown';
                const hashLabel = formatBlockTxListLabel(tx);
                const hashTitle = tx.id || tx.abciLog || hashLabel;
                return (
                  <ListItem
                    key={`block-${tx.blockIndex}-${tx.id ?? 'none'}`}
                    onClick={tx.canNavigate ? () => goToBlockTransaction(tx.blockIndex) : undefined}
                    cursor={tx.canNavigate ? 'pointer' : 'default'}
                    _hover={tx.canNavigate ? { opacity: 0.9 } : undefined}
                    transition="all 0.2s"
                  >
                    <AsciiBox p={2} className="explorer-record__tx-item">
                      <HStack spacing={4} justify="space-between" minW="0">
                        <HStack spacing={3} minW="0" flex="1">
                          <FontAwesomeIcon icon={faReceipt} />
                          <Text
                            className="explorer-record__tx-hash"
                            isTruncated
                            title={hashTitle}
                          >
                            {hashLabel}
                          </Text>
                        </HStack>
                        <HStack spacing={3} flexShrink={0}>
                          <span className={`explorer-record__tx-status ${statusBadgeClass(tx.executionStatus)}`}>
                            {tx.executionStatus.label}
                          </span>
                          <Text className="explorer-record__tx-type">{String(txType).replace(/_/g, ' ')}</Text>
                        </HStack>
                      </HStack>
                    </AsciiBox>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box p={4} color="gray.500">Unable to load transaction details</Box>
          )}
        </section>
      )}

    </Box>
  );
}

export default BlockPage;