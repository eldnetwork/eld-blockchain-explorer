import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import useAccount from '../hooks/useAccount';
import useTransactionsBySender from '../hooks/useTransactionsBySender';
import { Box, Heading, Text, VStack, HStack, List, ListItem, Link } from '@chakra-ui/react';
import AsciiBox from '../components/AsciiBox';
import { formatELDAmount } from '../utils/formatAmount';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { normalizeAccountAddress } from '../utils/accountAddress';
import './ExplorerDataPages.css';

function AccountPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  const { account, loading, error } = useAccount(address);
  const { transactions, loading: txLoading, error: txError } = useTransactionsBySender(address);

  // Helper to convert byte array to hex string
  const bytesToHex = (bytes) => {
    if (!Array.isArray(bytes)) return 'N/A';
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Helper to format datetime
  const formatDateTime = (timestamp) => {
    if (!timestamp || timestamp === 'N/A') return 'N/A';
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp * 1000);
      return date.toISOString().replace('T', ' ').split('.')[0];
    }
    if (typeof timestamp === 'string') {
      return timestamp.replace('T', ' ').split('.')[0].replace('Z', '');
    }
    return timestamp;
  };

  // Navigate to transaction page
  const goToTransaction = (hash) => {
    navigate(`/tx/${hash}`);
  };

  if (loading) {
    return (
      <Box className="explorer-page__state">
        <Text>Loading account information...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="explorer-page__state explorer-page__state--error">
        <Text>Failed to fetch account: {error}</Text>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box className="explorer-page__state">
        <Text>No account found</Text>
      </Box>
    );
  }

  const mutable = account.Mutable || {};
  const metadata = mutable.metadata || {};

  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">← Explorer</Link>
        <Text className="explorer-page__crumb-sep">Account</Text>
        <Text className="explorer-page__crumb-current">{address}</Text>
      </HStack>

      <Heading className="explorer-page__title" as="h1">ACCOUNT DETAILS</Heading>

      <section className="explorer-page__section">
        <h2><span /> GENERAL INFORMATION</h2>
        <div className="explorer-page__kv-grid">
          <div>
            <span>ADDRESS</span>
            <strong className="explorer-page__mono">{address}</strong>
          </div>
          {account.eldBalance != null && account.eldBalance !== undefined && (
            <div>
              <span>BALANCE</span>
              <strong className="explorer-page__mono">{formatELDAmount(account.eldBalance)}</strong>
            </div>
          )}
          {account.nonce != null && account.nonce !== undefined && (
            <div>
              <span>NONCE</span>
              <strong>{account.nonce}</strong>
            </div>
          )}
          {metadata.type_ && (
            <div>
              <span>TYPE</span>
              <strong>{metadata.type_}</strong>
            </div>
          )}
          {metadata.owner && (
            <div>
              <span>OWNER</span>
              <strong className="explorer-page__mono">
                <Link onClick={() => navigate(`/account/${normalizeAccountAddress(metadata.owner) || metadata.owner}`)} className="explorer-page__clickable explorer-page__mono">
                  {metadata.owner}
                </Link>
              </strong>
            </div>
          )}
        </div>
      </section>

      {mutable.hash && (
        <section className="explorer-page__section">
          <h2><span /> HASH</h2>
          <div className="explorer-page__kv-grid">
            <div>
              <span>HASH</span>
              <strong className="explorer-page__mono">{bytesToHex(mutable.hash)}</strong>
            </div>
          </div>
        </section>
      )}

      {mutable.latest_hash && (
        <section className="explorer-page__section">
          <h2><span /> LATEST HASH</h2>
          <div className="explorer-page__kv-grid">
            <div>
              <span>LATEST HASH</span>
              <strong className="explorer-page__mono">{bytesToHex(mutable.latest_hash)}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="explorer-page__section">
        <h2><span /> TRANSACTIONS</h2>
        <Box p={4}>
          {txLoading ? (
            <Text className="explorer-page__muted">Loading transactions...</Text>
          ) : txError ? (
            <Text className="explorer-page__state--error">Error loading transactions: {txError}</Text>
          ) : transactions.length === 0 ? (
            <Text className="explorer-page__muted">No transactions found</Text>
          ) : (
            <List spacing={2}>
              {transactions.map((tx) => {
                const txHash = tx.id || tx.hash || tx.tx_hash || 'unknown';
                const timestamp = tx.timestamp || tx.time || tx.created_at || 'N/A';
                const txType = tx.tx?.payload?.type || 
                              tx.type || 
                              tx.transaction_type || 
                              tx.payload?.type || 
                              tx.payload_type ||
                              'Unknown';
                
                return (
                  <ListItem
                    key={txHash}
                    onClick={() => goToTransaction(txHash)}
                    cursor="pointer"
                    _hover={{ opacity: 0.9 }}
                    transition="all 0.2s"
                  >
                    <AsciiBox p={2} className="explorer-page__list-item">
                      <VStack spacing={2} align="stretch" display={{ base: 'flex', md: 'none' }}>
                        <HStack spacing={4} w="full" minW="0">
                          <FontAwesomeIcon icon={faReceipt} flexShrink={0} />
                          <Text 
                            flex="1"
                            minW="0"
                            isTruncated
                            title={txHash}
                          >
                            {txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-10)}` : txHash}
                          </Text>
                          <HStack spacing={1} flexShrink={0} minW="0" maxW={{ base: "150px", md: "none" }}>
                            <FontAwesomeIcon icon={faClock} color="grey" flexShrink={0} />
                            <Text className="explorer-page__muted" fontSize="sm" noOfLines={{ base: 1 }}>{formatDateTime(timestamp)}</Text>
                          </HStack>
                        </HStack>
                        <Text 
                          fontSize="sm" 
                          className="explorer-page__muted"
                          fontWeight="medium"
                          isTruncated
                          title={txType}
                        >
                          {txType}
                        </Text>
                      </VStack>
                      <HStack spacing={4} w="full" justify="space-between" minW="0" display={{ base: 'none', md: 'flex' }}>
                        <HStack spacing={4} flex="1" minW="0">
                          <FontAwesomeIcon icon={faReceipt} flexShrink={0} />
                          <Text 
                            flex="0 0 auto"
                            minW="0"
                            maxW="200px"
                            isTruncated
                            title={txHash}
                          >
                            {txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-10)}` : txHash}
                          </Text>
                          <HStack spacing={1} flex="0 0 auto" minW="0" maxW={{ base: "150px", md: "none" }}>
                            <FontAwesomeIcon icon={faClock} color="grey" flexShrink={0} />
                            <Text className="explorer-page__muted" fontSize="sm" noOfLines={{ base: 1 }}>{formatDateTime(timestamp)}</Text>
                          </HStack>
                        </HStack>
                        <Text 
                          fontSize="sm" 
                          className="explorer-page__muted"
                          fontWeight="medium"
                          flex="0 0 auto"
                          minW="0"
                          maxW="150px"
                          isTruncated
                          title={txType}
                        >
                          {txType}
                        </Text>
                      </HStack>
                    </AsciiBox>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </section>
    </Box>
  );
}

export default AccountPage;