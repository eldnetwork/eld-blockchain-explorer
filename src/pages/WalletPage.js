import React, { useState, useEffect } from 'react';
import { Box, Heading, VStack, Input, Button, Text, HStack, FormControl, FormLabel, Spacer, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import nacl from 'tweetnacl';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { Buffer } from 'buffer';
import { sha256 } from 'js-sha256';
import { encodeTxToHex, TransferTx, Tx, Payload } from '../tx';
import { createKeyPair } from "../utils";
import { formatELDAmount } from '../utils/formatAmount';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard } from '@fortawesome/free-regular-svg-icons';
import { faCoins, faKey, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { RPC_URL, FAUCET_URL } from '../config';
import { normalizeAccountAddress } from '../utils/accountAddress';
import './ExplorerDataPages.css';
const RLP = require('@ethereumjs/rlp');

function WalletPage() {
  const [password, setPassword] = useState('');
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);

  function getWalletAddress(publicKey) {
    const publicKeyBytes = Buffer.from(publicKey, 'hex');
    const digest = sha256.array(publicKeyBytes); // SHA-256 digest (32 bytes)
    const addressBytes = digest.slice(0, 20); // First 20 bytes
    return "0x" + Buffer.from(addressBytes).toString('hex'); // Hex encode (40 chars)
  }

   // Add useEffect for periodic balance fetching
   useEffect(() => {
    let intervalId;
    
    // Only start interval if wallet exists
    if (wallet?.address) {
      // Initial fetch
      fetchBalance(wallet.address);
      
      // Set up interval for every 2 seconds
      intervalId = setInterval(() => {
        fetchBalance(wallet.address);
      }, 2000);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [wallet]); // Dependency on wallet - runs when wallet changes

  const createWallet = () => {
    if (!password) {
      setError('Password is required to create a wallet');
      return;
    }
    const keypair = nacl.sign.keyPair();
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');
    const publicKey = Buffer.from(keypair.publicKey).toString('hex');
    const encryptedKey = CryptoJS.AES.encrypt(privateKey, password).toString();
    const address = getWalletAddress(publicKey);
    localStorage.setItem('eld_wallet', encryptedKey);
    setWallet({ privateKey, publicKey, address });
    setError(null);
    fetchBalance(address);
  };

  const signIn = () => {
    if (!password) {
      setError('Password is required to sign in');
      return;
    }
    const encryptedKey = localStorage.getItem('eld_wallet');
    if (!encryptedKey) {
      setError('No wallet found. Create one first.');
      return;
    }
    try {
      const decryptedKey = CryptoJS.AES.decrypt(encryptedKey, password).toString(CryptoJS.enc.Utf8);
      if (!decryptedKey || decryptedKey.length !== 128) throw new Error('Invalid decryption');
      const privateKey = decryptedKey;
      const keypair = nacl.sign.keyPair.fromSecretKey(Buffer.from(privateKey, 'hex'));
      const publicKey = Buffer.from(keypair.publicKey).toString('hex');
      const address = getWalletAddress(publicKey);
      setWallet({ privateKey, publicKey, address });
      setError(null);
      fetchBalance(address);
    } catch (err) {
      setError('Invalid password or corrupted wallet data:', err);
    }
  };

  const fetchBalance = async (address) => {
    try {
      const response = await axios.get(
        `${RPC_URL}/abci_query?path="account"&data=${address}`
      );
      const data = response.data;
      if (data.result && data.result.response && data.result.response.info) {
        let info = data.result.response.info;
        const accountData = JSON.parse(info);
        setBalance(accountData.balance || '0');
        setNonce(accountData.nonce || 0);
      } else {
        setBalance('0');
        setNonce(0);
      }
    } catch (err) {
      setBalance('Error fetching balance');
      setError('Failed to fetch balance');
    }
  };

  const sendTransfer = async () => {
    if (!wallet || !recipient || !amount) {
      setError('Wallet, recipient address, and amount are required');
      return;
    }

    try {
      let keyPair = createKeyPair(wallet.privateKey, wallet.publicKey);

      let transfer = new TransferTx(wallet.address, recipient, parseInt(amount));
      let transferPayload = new Payload("Transfer", transfer);
      let tx = new Tx("A", "", nonce + 1, transferPayload, Buffer.from(keyPair.publicKey).toString('hex'));

      tx.sign(keyPair);
      const hex = encodeTxToHex(tx);

      const url = `${RPC_URL}/broadcast_tx_commit?tx=\"${hex}\"`;
      const response = await axios.get(
        url
      );
      if (response.data.result && response.data.result.check_tx.code === 0) {
        setError(null);
        alert('Transfer sent successfully');
        fetchBalance(wallet.address);
      } else {
        setError('Transfer failed: ' + (response.data.result.check_tx.log || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to send transfer: ' + err.message);
    }
  };

  const requestFaucetTokens = async () => {
    if (!wallet) {
      setError('Please sign in or create a wallet first');
      return;
    }
    try {
      const address = getWalletAddress(wallet.publicKey);

      const response = await axios.post(`${FAUCET_URL}/faucet/request`, { address });
      if (response.data.success) {
        setError(null);
        alert('Tokens requested successfully');
        fetchBalance(wallet.address); // Refresh balance
      } else {
        setError('Faucet request failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to request tokens: ' + err.message);
    }
  };

// Transfer Component with Border
function TransferComponent({ recipient, setRecipient, amount, setAmount, sendTransfer }) {
  return (
    <Box className="explorer-page__section" p={4}>
       <Heading as="h3" size="lg" color="gray.100">
                Transfer
              </Heading>
              <Spacer h="30px"/>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel className="explorer-page__muted">Recipient Address</FormLabel>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient address (0x...)"
            maxW="500px" // Max width for input
            className="explorer-page__input"
          />
        </FormControl>
        <FormControl>
          <FormLabel className="explorer-page__muted">Amount</FormLabel>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            maxW="500px" // Max width for input
            className="explorer-page__input"
          />
        </FormControl>
        <Button
          onClick={sendTransfer}
          colorScheme="blue"
          w="400px"
          maxW="500px" // Max width for button
          alignSelf="flex-start" // Left-align the button
          className="explorer-page__action"
        >
          Send
        </Button>
      </VStack>
    </Box>
  );
}

// Faucet Component
function FaucetComponent({ requestFaucetTokens }) {
  return (
    <Box className="explorer-page__section" p={4}>
       <Heading as="h3" size="lg" color="gray.100">
                Faucet
              </Heading>
                <Spacer h="30px"/>
      <VStack spacing={4} align="stretch">
        <Button
          onClick={requestFaucetTokens}
          colorScheme="teal"
          w="400px"
          maxW="500px" // Max width for button
          alignSelf="flex-start" // Left-align the button
          className="explorer-page__action"
        >
          Request Tokens
        </Button>
        <Text className="explorer-page__muted" maxW="500px"> {/* Matches input width */}
          Click above to request airdrop tokens from the faucet.
        </Text>
      </VStack>
    </Box>
  );
}

  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">← Explorer</Link>
        <Text className="explorer-page__crumb-sep">Tools</Text>
        <Text className="explorer-page__crumb-current">Wallet</Text>
      </HStack>

      <Heading as="h1" className="explorer-page__title">ELD WALLET</Heading>
      <VStack spacing={4} align="stretch">
        {!wallet ? (
          <Box className="explorer-page__section" p={4}>
            <FormControl>
              <FormLabel className="explorer-page__muted">Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="explorer-page__input"
              />
            </FormControl>
            <HStack spacing={4} mt={4}>
              <Button onClick={createWallet} colorScheme="blue" className="explorer-page__action">Create New Wallet</Button>
              <Button onClick={signIn} colorScheme="green" className="explorer-page__action">Sign In</Button>
            </HStack>
          </Box>
        ) : (
          <>
  <Box className="explorer-page__section" p={4}>
  <HStack spacing={2} w="full">
  <Box w="24px"> {/* Fixed width for icon */}
  <FontAwesomeIcon icon={faLocationDot}/>
  </Box>
  <Text w="100px" className="explorer-page__muted">Address:</Text> {/* Fixed width for label */}
  <Link as={RouterLink} to={`/account/${normalizeAccountAddress(wallet.address) || wallet.address}`} className="explorer-page__clickable explorer-page__mono">
    {wallet.address}
  </Link>
  </HStack>
  <HStack spacing={2} w="full">

  <Box w="24px"> {/* Fixed width for icon */}
    <FontAwesomeIcon icon={faKey} />
  </Box>
  <Text w="100px" className="explorer-page__muted">Public Key:</Text> {/* Fixed width for label */}
  <Text className="explorer-page__mono">{wallet.publicKey}</Text> {/* Dynamic text takes remaining space */}
</HStack>
<HStack spacing={2} w="full">
  <Box w="24px">
    <FontAwesomeIcon icon={faCoins} />
  </Box>
  <Text w="100px" className="explorer-page__muted">Balance:</Text>
  <Text className="explorer-page__mono">{balance ? formatELDAmount(balance) : 'Loading...'}</Text>
</HStack>
<HStack spacing={2} w="full">
  <Box w="24px">
    <FontAwesomeIcon icon={faClipboard} />
  </Box>
  <Text w="100px" className="explorer-page__muted">Nonce:</Text>
  <Text>{nonce}</Text>
</HStack>
  </Box>
            <TransferComponent
              recipient={recipient}
              setRecipient={setRecipient}
              amount={amount}
              setAmount={setAmount}
              sendTransfer={sendTransfer}
            />
            <FaucetComponent requestFaucetTokens={requestFaucetTokens} />
          </>
        )}
        {error && <Text className="explorer-page__state--error">{error}</Text>}
      </VStack>
    </Box>
  );
}

export default WalletPage;