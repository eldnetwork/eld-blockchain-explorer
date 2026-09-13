import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Button, HStack, Link, Text } from '@chakra-ui/react';
import ExplorerFooter from './ExplorerFooter';
import { SunIcon, MoonIcon } from './ThemeIcons';
import AppRoutes from '../AppRoutes';
import useChainId from '../hooks/useChainId';
import { RPC_URL } from '../config';
import { BACKGROUND_COLOR, LIGHT_TEXT_COLOR } from '../utils/constants';

function ExplorerAppShell() {
  const { chainId } = useChainId();
  const [nodeVersion, setNodeVersion] = useState('--');
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

  useEffect(() => {
    let isMounted = true;

    const loadNodeVersion = async () => {
      try {
        const response = await fetch(`${RPC_URL}/abci_info`);
        if (!response.ok) {
          throw new Error(`Failed to load node version: ${response.status}`);
        }

        const payload = await response.json();
        const responseData = payload?.result?.response?.data;
        const parsedData = responseData ? JSON.parse(responseData) : null;
        const resolvedVersion =
          parsedData?.eld_app_version || payload?.result?.response?.version || '--';

        if (isMounted) {
          setNodeVersion(resolvedVersion);
        }
      } catch (_error) {
        if (isMounted) {
          setNodeVersion('--');
        }
      }
    };

    loadNodeVersion();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box
      className={`explorer-home-shell ${isLightTheme ? 'explorer-home-shell--light' : ''}`}
      bg={BACKGROUND_COLOR}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <Box className="explorer-home-shell__header-group">
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
          <Link
            as={RouterLink}
            to="/"
            _hover={{ textDecoration: 'none' }}
            className="explorer-home-shell__brand"
          >
            <Box className="explorer-home-shell__brand-mark">E</Box>
            <HStack className="explorer-home-shell__brand-text" spacing={2} align="center">
              <Text>ELD</Text>
              <Text>{'//'}</Text>
              <Text>BLOCKCHAIN EXPLORER</Text>
            </HStack>
          </Link>

          <HStack className="explorer-home-shell__meta" spacing={6} align="center">
            <HStack spacing={2} align="center">
              <Box className="explorer-home-shell__network-stack">
                <HStack className="explorer-home-shell__network-metric" spacing={2}>
                  <Text className="explorer-home-shell__chain-label">network:</Text>
                  <Text className="explorer-home-shell__chain-id">{chainId || 'unknown'}</Text>
                </HStack>
                <HStack className="explorer-home-shell__network-metric" spacing={2}>
                  <Text className="explorer-home-shell__chain-label">eld node version:</Text>
                  <Text className="explorer-home-shell__chain-id">{nodeVersion}</Text>
                </HStack>
              </Box>
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
        <Box className="explorer-home-shell__whitelist-banner" role="status">
          <Text className="explorer-home-shell__whitelist-banner-text">
            FOLLOW ELD ON{' '}
            <Link
              href="https://x.com/eld_network"
              className="explorer-home-shell__whitelist-banner-link"
              isExternal
              textDecoration="underline"
              textUnderlineOffset="2px"
              _hover={{ textDecoration: 'underline', opacity: 0.82 }}
            >
              X / TWITTER
            </Link>
          </Text>
        </Box>
      </Box>
      <Box as="main" flex="1 0 auto">
        <AppRoutes />
      </Box>
      <ExplorerFooter />
    </Box>
  );
}

export default ExplorerAppShell;
