import { Component } from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Catches render errors in the route tree so the shell stays visible.
 */
class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('RouteErrorBoundary', error);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Box className="explorer-page" p={8} maxW="720px" mx="auto">
          <Heading as="h1" className="explorer-page__title" mb={4}>
            Something went wrong
          </Heading>
          <Text className="explorer-page__muted" mb={6}>
            This page hit an unexpected error. You can return home and keep browsing the explorer.
          </Text>
          <Button
            as={RouterLink}
            to="/"
            colorScheme="orange"
            onClick={() => this.setState({ error: null })}
          >
            Back to explorer
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
