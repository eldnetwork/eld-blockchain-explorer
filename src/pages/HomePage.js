import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Input, Button, VStack, HStack, Text } from '@chakra-ui/react';
import BlocksPage from './BlocksPage';
import EpochDashboard from '../components/EpochDashboard';
import ValidatorStats from '../components/ValidatorStats';
import TransactionsList from '../components/TransactionsList';
import EpochsList from '../components/EpochsList';
import NamespacesList from '../components/NamespacesList';
import PinboardContentList from '../components/PinboardContentList';
import AsciiBox from '../components/AsciiBox';
import useTestnetAvailability from '../hooks/useTestnetAvailability';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { BACKGROUND_COLOR, BOX_BG_COLOR, DARK_TEXT_COLOR, BORDER_RADIUS } from '../utils/constants';
import './ExplorerHomePage.css';

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
        alert(
          'Invalid hex length: Transaction hash (66 chars with 0x) or account ID (42 chars with 0x)',
        );
      }
    } else {
      alert(
        'Invalid input: Enter a block height (numbers), transaction hash (66-char hex with 0x), or account ID (42-char hex with 0x)',
      );
    }
    setSearchInput('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  if (isChecking) {
    return null;
  }

  if (!isTestnetAvailable) {
    return (
      <Box
        p={4}
        w="100%"
        maxW="100%"
        overflowX="hidden"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="50vh"
      >
        <AsciiBox
          className="explorer-home-shell__testnet-unavailable-panel"
          p={8}
          borderRadius={BORDER_RADIUS}
        >
          <Text textAlign="center" fontSize="lg" fontWeight="medium">
            Testnet is not available at the moment
          </Text>
        </AsciiBox>
      </Box>
    );
  }

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
        <Flex
          className="explorer-home__intro"
          align="center"
          justify="center"
          gap={{ base: 3, md: 5 }}
        >
          <Box
            as="img"
            className="explorer-home__logo"
            src="/images/cube_fire_400x400.png"
            alt=""
            aria-hidden="true"
          />
          <VStack className="explorer-home__intro-copy" spacing={4} align="stretch" minW={0}>
            <Box className="explorer-home__hero">
              <Heading className="explorer-home__title" as="h1">
                Eld Blockchain Explorer
              </Heading>
              <Text className="explorer-home__subtitle">
                Explore blocks, transactions, and network activity on Eld testnet
              </Text>
            </Box>

            <HStack
              className="explorer-home__search-row"
              spacing={2}
              align="flex-start"
              w="100%"
              maxW="100%"
            >
              <AsciiBox
                className="explorer-home__search-shell"
                p={0}
                bg={BOX_BG_COLOR}
                borderRadius={BORDER_RADIUS}
                display="inline-block"
                w={{ base: 'calc(100% - 48px)', md: 'auto' }}
                maxW="100%"
              >
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
                  _hover={{ bg: 'transparent' }}
                  _focus={{ bg: 'transparent' }}
                  _focusVisible={{
                    outline: 'none',
                  }}
                />
              </AsciiBox>
              <Button
                className="explorer-home__search-button"
                onClick={handleSearch}
                colorScheme="gray"
                flexShrink={0}
                sx={{ borderRadius: `${BORDER_RADIUS} !important` }}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            </HStack>
          </VStack>
        </Flex>
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
              <TransactionsList />
            </Box>
            <Box order={{ base: 3, lg: 'unset' }} w="full">
              <PinboardContentList />
            </Box>
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
}

export default HomePage;
