import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Box, Flex, Heading, Input, Button, VStack, HStack, Link, Text } from '@chakra-ui/react';
import TransactionPage from './pages/TransactionPage';
import AccountPage from './pages/AccountPage';
import BlocksPage from './pages/BlocksPage';
import BlockPage from './pages/BlockPage';
import WalletPage from './pages/WalletPage';
import ContentPage from './pages/ContentPage';
import EpochDashboard from './components/EpochDashboard';
import ValidatorStats from './components/ValidatorStats';
import TransactionsList from './components/TransactionsList';
import EpochsList from './components/EpochsList';
import NamespacesList from './components/NamespacesList';
import PinboardContentList from './components/PinboardContentList';
import ValidatorsPage from './pages/ValidatorsPage';
import ValidatorPage from './pages/ValidatorPage';
import SingleValidatorPage from './pages/SingleValidatorPage';
import CapacityProvidersPage from './pages/CapacityProvidersPage';
import PinboardPage from './pages/PinboardPage';
import PinboardPostPage from './pages/PinboardPostPage';
import SingleEpochPage from './pages/SingleEpochPage';
import NamespacePage from './pages/NamespacePage';
import './pages/ExplorerHomePage.css';
import AsciiBox from './components/AsciiBox';
import ExplorerFooter from './components/ExplorerFooter';
import { SunIcon, MoonIcon } from './components/ThemeIcons';
import useChainId from './hooks/useChainId';
import useTestnetAvailability from './hooks/useTestnetAvailability';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { BACKGROUND_COLOR, BOX_BG_COLOR, DARK_TEXT_COLOR, LIGHT_TEXT_COLOR, BORDER_RADIUS } from './constants';

function LegacyStorageValidatorRedirect() {
  const { address } = useParams();
  return <Navigate to={`/capacity-provider/${address ?? ''}`} replace />;
}

function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const { isTestnetAvailable, isChecking } = useTestnetAvailability();
  const navigate = useNavigate();

  const handleSearch = () => {
    const trimmedInput = searchInput.trim();
    if (!trimmedInput) return;

    const isHex = trimmedInput.startsWith('0x') && /^[0-9a-fA-F]+$/.test(trimmedInput.slice(2));
    const inputLength = trimmedInput.length;

    if (/^\d+$/.test(trimmedInput)) {
      navigate(`/block/${trimmedInput}`);
    } else if (isHex) {
      if (inputLength === 66) {
        navigate(`/tx/${trimmedInput}`);
      } else if (inputLength === 42) {
        navigate(`/account/${trimmedInput}`);
      } else {
        alert('Invalid hex length: Transaction hash (66 chars with 0x) or account ID (42 chars with 0x)');
      }
    } else {
      alert('Invalid input: Enter a block height (numbers), transaction hash (66-char hex with 0x), or account ID (42-char hex with 0x)');
    }
    setSearchInput('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return null; // Hide everything while checking
  }

  // Show error message if testnet is not available - hide everything else
  if (!isTestnetAvailable) {
    return (
      <Box p={4} w="100%" maxW="100%" overflowX="hidden" display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <AsciiBox className="explorer-home-shell__testnet-unavailable-panel" p={8} borderRadius={BORDER_RADIUS}>
          <Text textAlign="center" fontSize="lg" fontWeight="medium">
            Testnet is not available at the moment
          </Text>
        </AsciiBox>
      </Box>
    );
  }

  // Show normal home page if testnet is available
  return (
    <Box
      className="explorer-home"
      p={4}
      w="100%"
      maxW="100%"
      overflowX="hidden"
      bg={BACKGROUND_COLOR}
      color={DARK_TEXT_COLOR}
    >
      
      <VStack className="explorer-home__stack" spacing={4} align="stretch" w="100%" maxW="100%">
        <Box className="explorer-home__hero">
          <Heading className="explorer-home__title" as="h1">
            Eld Blockchain Explorer
          </Heading>
          <Text className="explorer-home__subtitle">
            Explore blocks, transactions, and network activity on Eld testnet
          </Text>
        </Box>

        <HStack className="explorer-home__search-row" spacing={2} align="flex-start" w="100%" maxW="100%">
          <AsciiBox className="explorer-home__search-shell" p={0} bg={BOX_BG_COLOR} borderRadius={BORDER_RADIUS} display="inline-block" w={{ base: 'calc(100% - 48px)', md: 'auto' }} maxW="100%">
            <Input
              className="explorer-home__search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by block hash, transaction, or address..."
              size="md"
              width={{ base: '100%', md: '760px' }}
              maxW="100%"
              bg="transparent"
              border="none"
              px={2}
              py={2}
              _hover={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
              _focusVisible={{
                outline: "none",
              }}
            />
          </AsciiBox>
          <Button className="explorer-home__search-button" onClick={handleSearch} colorScheme="gray" flexShrink={0} sx={{ borderRadius: `${BORDER_RADIUS} !important` }}><FontAwesomeIcon icon={faMagnifyingGlass} /></Button>
        </HStack>
        <EpochDashboard />
        <ValidatorStats />
        <Flex
          className="explorer-home__lists"
          direction={{ base: 'column', lg: 'row' }}
          spacing={4}
          align="flex-start"
          gap={4}
          wrap="wrap"
        >
          <Box
            className="explorer-home__column explorer-home__column--chain"
            display={{ base: 'contents', lg: 'flex' }}
            flexDirection={{ lg: 'column' }}
            flex={{ base: '1 1 100%', lg: '1 1 0' }}
            minW="0"
            w={{ base: '100%', lg: 'auto' }}
            maxW={{ base: '100%', lg: 'calc(50% - 8px)' }}
            gap={4}
          >
            <Box order={{ base: 1, lg: 'unset' }} w="full">
              <BlocksPage />
            </Box>
            <Box order={{ base: 4, lg: 'unset' }} w="full">
              <EpochsList />
            </Box>
            <Box order={{ base: 5, lg: 'unset' }} w="full">
              <NamespacesList />
            </Box>
          </Box>
          <Box
            className="explorer-home__column explorer-home__column--feed"
            display={{ base: 'contents', lg: 'flex' }}
            flexDirection={{ lg: 'column' }}
            flex={{ base: '1 1 100%', lg: '1 1 0' }}
            minW="0"
            w={{ base: '100%', lg: 'auto' }}
            maxW={{ base: '100%', lg: 'calc(50% - 8px)' }}
            gap={4}
          >
            <Box order={{ base: 2, lg: 'unset' }} w="full">
              <PinboardContentList />
            </Box>
            <Box order={{ base: 3, lg: 'unset' }} w="full">
              <TransactionsList />
            </Box>
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
}

function ExplorerAppShell() {
  const { chainId } = useChainId();
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem('eld-home-theme') === 'light';
  });

  const handleThemeToggle = () => {
    setIsLightTheme((prev) => {
      const nextIsLight = !prev;
      window.localStorage.setItem('eld-home-theme', nextIsLight ? 'light' : 'dark');
      return nextIsLight;
    });
  };

  return (
    <Box
      className={`explorer-home-shell ${isLightTheme ? 'explorer-home-shell--light' : ''}`}
      bg={BACKGROUND_COLOR}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <Flex
        className="explorer-home-shell__header"
        as="nav"
        p={4}
        bg="black"
        color={LIGHT_TEXT_COLOR}
        justify="space-between"
        align="center"
        sx={{ borderRadius: '0 !important' }}
      >
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }} className="explorer-home-shell__brand">
          <Box className="explorer-home-shell__brand-mark">E</Box>
          <HStack className="explorer-home-shell__brand-text" spacing={2} align="center">
            <Text>ELD</Text>
            <Text>{'//'}</Text>
            <Text>BLOCKCHAIN EXPLORER</Text>
          </HStack>
        </Link>

        <HStack className="explorer-home-shell__meta" spacing={6} align="center">
          <HStack spacing={2} align="center">
            <Text className="explorer-home-shell__chain-label">network:</Text>
            <Text className="explorer-home-shell__chain-id">{chainId || 'unknown'}</Text>
            <Button
              className="explorer-home-shell__theme-toggle"
              onClick={handleThemeToggle}
              variant="ghost"
              aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
              title={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
              minW="34px"
              h="34px"
              p={0}
              _hover={{ bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
            >
              {isLightTheme ? <MoonIcon /> : <SunIcon />}
            </Button>
          </HStack>
          <Link href="https://eld.network" className="explorer-home-shell__intro-link" isExternal>
            ELD INTRO -&gt;
          </Link>
        </HStack>
      </Flex>
      <Box as="main" flex="1 0 auto">
        <Routes>
          <Route path="/tx/:hash" element={<TransactionPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
          <Route path="/account/:address" element={<AccountPage />} />
          <Route path="/block/:height/tx/:index" element={<TransactionPage />} />
          <Route path="/block/:height" element={<BlockPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/validators" element={<ValidatorsPage />} />
          <Route path="/capacity-providers" element={<CapacityProvidersPage />} />
          <Route path="/storage-providers" element={<Navigate to="/capacity-providers" replace />} />
          <Route path="/pinboard" element={<PinboardPage />} />
          <Route path="/pinboard/post/:wallet/:messageId" element={<PinboardPostPage />} />
          <Route path="/validator/:address" element={<ValidatorPage />} />
          <Route path="/capacity-provider/:address" element={<SingleValidatorPage />} />
          <Route path="/storage-validator/:address" element={<LegacyStorageValidatorRedirect />} />
          <Route path="/content/:contentId" element={<ContentPage />} />
          <Route path="/epoch/:epochId" element={<SingleEpochPage />} />
          <Route path="/namespaces/:namespaceSlug" element={<NamespacePage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Box>
      <ExplorerFooter />
    </Box>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ExplorerAppShell />
    </BrowserRouter>
  );
}

export default App;
