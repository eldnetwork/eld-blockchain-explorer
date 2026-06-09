import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, VStack, HStack, Link } from '@chakra-ui/react';
import AsciiBox from '../components/AsciiBox';
import useContentManifest from '../hooks/useContentManifest';
import { normalizeAccountAddress } from '../utils/accountAddress';
import './ExplorerDataPages.css';

function ContentManifestPage() {
  const { manifestId } = useParams();
  const navigate = useNavigate();
  const { manifest, loading, error } = useContentManifest(manifestId);
  const isAccountKey = (key) => /(address|owner|signer|sender|recipient|account)/i.test(String(key || ''));

  if (loading) {
    return (
      <Box className="explorer-page__state">
        <Heading as="h2" size="lg" mb={4}>Content Manifest Details</Heading>
        <AsciiBox p={4}>
          <Text textAlign="center" color="gray.700">Loading manifest information...</Text>
        </AsciiBox>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="explorer-page__state explorer-page__state--error">
        <Heading as="h2" size="lg" mb={4}>Content Manifest Details</Heading>
        <AsciiBox p={4}>
          <Text textAlign="center" color="gray.700">Failed to fetch manifest: {error}</Text>
        </AsciiBox>
      </Box>
    );
  }

  if (!manifest) {
    return (
      <Box className="explorer-page__state">
        <Heading as="h2" size="lg" mb={4}>Content Manifest Details</Heading>
        <AsciiBox p={4}>
          <Text textAlign="center" color="gray.700">No manifest found</Text>
        </AsciiBox>
      </Box>
    );
  }

  return (
    <Box className="explorer-page">
      <Heading as="h2" className="explorer-page__title">Content Manifest Details</Heading>
      
      <VStack spacing={4} align="stretch">
        <AsciiBox p={4}>
          <Heading as="h3" size="md" mb={3}>Manifest Information</Heading>
          <VStack spacing={2} align="stretch">
            <HStack>
              <Text fontWeight="bold" w="200px">Manifest ID:</Text>
              <Text fontFamily="mono">{manifestId}</Text>
            </HStack>
            {manifest.name && (
              <HStack>
                <Text fontWeight="bold" w="200px">Name:</Text>
                <Text>{manifest.name}</Text>
              </HStack>
            )}
            {manifest.content_type && (
              <HStack>
                <Text fontWeight="bold" w="200px">Content Type:</Text>
                <Text>{manifest.content_type}</Text>
              </HStack>
            )}
            {manifest.size !== undefined && (
              <HStack>
                <Text fontWeight="bold" w="200px">Size:</Text>
                <Text>{typeof manifest.size === 'number' ? manifest.size.toLocaleString() : manifest.size}</Text>
              </HStack>
            )}
            {manifest.total_size !== undefined && (
              <HStack>
                <Text fontWeight="bold" w="200px">Total Size:</Text>
                <Text>{typeof manifest.total_size === 'number' ? manifest.total_size.toLocaleString() : manifest.total_size}</Text>
              </HStack>
            )}
            {manifest.redundancy_factor !== undefined && (
              <HStack>
                <Text fontWeight="bold" w="200px">Redundancy Factor:</Text>
                <Text>{manifest.redundancy_factor}</Text>
              </HStack>
            )}
            {manifest.created_at && (
              <HStack>
                <Text fontWeight="bold" w="200px">Created At:</Text>
                <Text>{manifest.created_at}</Text>
              </HStack>
            )}
            {manifest.chunks && Array.isArray(manifest.chunks) && (
              <HStack>
                <Text fontWeight="bold" w="200px">Chunks:</Text>
                <Text>{manifest.chunks.length}</Text>
              </HStack>
            )}
            {Object.entries(manifest).map(([key, value]) => {
              if (['name', 'content_type', 'size', 'total_size', 'redundancy_factor', 'created_at', 'chunks'].includes(key)) {
                return null;
              }
              if (typeof value === 'object' && value !== null) {
                return (
                  <Box key={key}>
                    <Text fontWeight="bold" mb={2}>{key}:</Text>
                    <Box pl={4}>
                      <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </Box>
                  </Box>
                );
              }
              return (
                <HStack key={key}>
                  <Text fontWeight="bold" w="200px">{key}:</Text>
                  {isAccountKey(key) ? (
                    <Link onClick={() => navigate(`/account/${normalizeAccountAddress(String(value)) || String(value)}`)} className="explorer-page__clickable explorer-page__mono">
                      {String(value)}
                    </Link>
                  ) : (
                    <Text>{String(value)}</Text>
                  )}
                </HStack>
              );
            })}
          </VStack>
        </AsciiBox>

        {manifest.chunks && Array.isArray(manifest.chunks) && manifest.chunks.length > 0 && (
          <AsciiBox p={4}>
            <Heading as="h3" size="md" mb={3}>Chunks ({manifest.chunks.length})</Heading>
            <VStack spacing={2} align="stretch">
              {manifest.chunks.map((chunk, index) => (
                <Box key={index} p={2} bg="gray.50" borderRadius="0">
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(chunk, null, 2)}
                  </pre>
                </Box>
              ))}
            </VStack>
          </AsciiBox>
        )}
      </VStack>
    </Box>
  );
}

export default ContentManifestPage;

