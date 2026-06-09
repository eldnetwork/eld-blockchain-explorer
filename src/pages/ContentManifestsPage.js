import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, List, ListItem, HStack, Text, Skeleton, Badge, VStack } from '@chakra-ui/react';
import useContentManifests from '../hooks/useContentManifests';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';
import AsciiBox from '../components/AsciiBox';
import './ExplorerDataPages.css';

function ContentManifestList({ manifests, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <List spacing={3}>
        {Array(10).fill(0).map((_, index) => (
          <ListItem key={index}>
            <AsciiBox p={4}>
              <HStack spacing={4} w="full">
                <Skeleton height="20px" width="40px" />
                <Skeleton height="20px" width="300px" />
                <Skeleton height="20px" width="150px" />
              </HStack>
            </AsciiBox>
          </ListItem>
        ))}
      </List>
    );
  }

  if (manifests.length === 0) {
    return <Box p={4}>No content manifests found</Box>;
  }

  return (
    <List spacing={3}>
      {manifests.map((manifest, index) => {
        // Handle different manifest formats - could be an object with id, or just an id string
        // Also handle nested metadata structure
        const manifestId = manifest.id || manifest.manifest_id || manifest;
        const manifestData = typeof manifest === 'object' ? manifest : { id: manifest };
        
        // Extract metadata if nested
        const name = manifestData.name || manifestData.metadata?.name;
        const content_type = manifestData.content_type || manifestData.metadata?.content_type;
        const size = manifestData.size !== undefined ? manifestData.size : manifestData.metadata?.size;
        
        return (
          <ListItem
            key={manifestId || index}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ opacity: 0.8 }}
            onClick={() => {
              if (manifestId) {
                navigate(`/content-manifest/${encodeURIComponent(manifestId)}`);
              }
            }}
          >
            <AsciiBox p={4}>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Badge bg="white" color="gray.700" fontSize="sm">#{index + 1}</Badge>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700" fontFamily="mono">
                      {manifestId ? `${String(manifestId).slice(0, 20)}...${String(manifestId).slice(-10)}` : 'N/A'}
                    </Text>
                    {manifestData._cadoType && (
                      <Badge bg="gray.200" color="gray.700" fontSize="xs">{manifestData._cadoType}</Badge>
                    )}
                  </HStack>
                  {size !== undefined && (
                    <Text fontSize="sm" color="gray.600">
                      Size: {typeof size === 'number' ? size.toLocaleString() : size}
                    </Text>
                  )}
                </HStack>
                {name && (
                  <Text fontSize="xs" color="gray.500">
                    Name: {name}
                  </Text>
                )}
                {content_type && (
                  <Text fontSize="xs" color="gray.500">
                    Content Type: {content_type}
                  </Text>
                )}
                {manifestData.content_id && (
                  <Text fontSize="xs" color="gray.500" fontFamily="mono" isTruncated>
                    Content ID: {manifestData.content_id}
                  </Text>
                )}
                {manifestData.total_size !== undefined && (
                  <Text fontSize="xs" color="gray.500">
                    Total Size: {typeof manifestData.total_size === 'number' ? manifestData.total_size.toLocaleString() : manifestData.total_size}
                  </Text>
                )}
                {manifestData.redundancy_factor !== undefined && (
                  <Text fontSize="xs" color="gray.500">
                    Redundancy Factor: {manifestData.redundancy_factor}
                  </Text>
                )}
                {manifestData.created_at !== undefined && (
                  <Text fontSize="xs" color="gray.500">
                    Created At: {typeof manifestData.created_at === 'number' ? new Date(manifestData.created_at).toLocaleString() : manifestData.created_at}
                  </Text>
                )}
                {manifestData.chunks && Array.isArray(manifestData.chunks) && (
                  <Text fontSize="xs" color="gray.500">
                    Chunks: {manifestData.chunks.length}
                  </Text>
                )}
                {manifestData.status && (
                  <Text fontSize="xs" color="gray.500">
                    Status: {typeof manifestData.status === 'object' ? JSON.stringify(manifestData.status) : manifestData.status}
                  </Text>
                )}
                {manifestData._note && (
                  <Text fontSize="xs" color="orange.500" fontStyle="italic">
                    {manifestData._note}
                  </Text>
                )}
                {manifestData._cado && (manifestData._cado.key || manifestData._cado.Immutable?.key || manifestData._cado.Mutable?.key) && (
                  <Text fontSize="xs" color="gray.500" fontFamily="mono" isTruncated>
                    CADO Key: {manifestData._cado.key || manifestData._cado.Immutable?.key || manifestData._cado.Mutable?.key}
                  </Text>
                )}
                {manifestData._error && (
                  <Text fontSize="xs" color="red.500">
                    Error: {manifestData._error}
                  </Text>
                )}
                {!name && !content_type && !manifestData.content_id && !manifestData.total_size && !manifestData._note && (
                  <Text fontSize="xs" color="gray.400" fontStyle="italic">
                    CADO data available (deserialization may be required for full details)
                  </Text>
                )}
              </VStack>
            </AsciiBox>
          </ListItem>
        );
      })}
    </List>
  );
}

function ContentManifestsPage() {
  const { manifests, loading, error } = useContentManifests();

  return (
    <Box className="explorer-page">
      <HStack spacing={2} mb={6}>
        <FontAwesomeIcon icon={faFolder} />
        <Heading as="h1" className="explorer-page__title" m={0}>
          Content Manifests
        </Heading>
      </HStack>

      {error ? (
        <Box p={4} className="explorer-page__state--error">Error: {error}</Box>
      ) : (
        <>
          {!loading && manifests.length > 0 && (
            <AsciiBox mb={4} p={3} className="explorer-page__card">
              <Text fontSize="sm" color="gray.100">
                Total Manifests: {manifests.length}
              </Text>
            </AsciiBox>
          )}
          <ContentManifestList manifests={manifests} loading={loading} />
        </>
      )}
    </Box>
  );
}

export default ContentManifestsPage;
