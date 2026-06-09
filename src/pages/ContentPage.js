import React from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, HStack, Link } from '@chakra-ui/react';
import useContent from '../hooks/useContent';
import { normalizeAccountAddress } from '../utils/accountAddress';
import './ExplorerDataPages.css';

function ContentPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { content, loading, error } = useContent(contentId);
  const isAccountKey = (key) => /(address|owner|signer|sender|recipient|account)/i.test(String(key || ''));

  if (loading) {
    return (
      <Box className="explorer-page__state">
        <Text>Loading content information...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="explorer-page__state explorer-page__state--error">
        <Text>Failed to fetch content: {error}</Text>
      </Box>
    );
  }

  if (!content) {
    return (
      <Box className="explorer-page__state">
        <Text>No content found</Text>
      </Box>
    );
  }

  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">← Explorer</Link>
        <Text className="explorer-page__crumb-sep">Content</Text>
        <Text className="explorer-page__crumb-current">{contentId}</Text>
      </HStack>

      <Heading as="h1" className="explorer-page__title">CONTENT DETAILS</Heading>

      <section className="explorer-page__section">
        <h2><span /> CONTENT INFORMATION</h2>
        <div className="explorer-page__kv-grid">
          <div>
            <span>CONTENT ID</span>
            <strong className="explorer-page__mono">{contentId}</strong>
          </div>
            {content.name && (
              <div><span>NAME</span><strong>{content.name}</strong></div>
            )}
            {content.content_type && (
              <div><span>CONTENT TYPE</span><strong>{content.content_type}</strong></div>
            )}
            {content.size !== undefined && (
              <div><span>SIZE</span><strong>{typeof content.size === 'number' ? content.size.toLocaleString() : content.size}</strong></div>
            )}
            {content.hash && (
              <div><span>HASH</span><strong className="explorer-page__mono">{content.hash}</strong></div>
            )}
            {content.created_at && (
              <div><span>CREATED AT</span><strong>{content.created_at}</strong></div>
            )}
            {Object.entries(content).map(([key, value]) => {
              if (['name', 'content_type', 'size', 'hash', 'created_at'].includes(key)) {
                return null;
              }
              if (typeof value === 'object' && value !== null) {
                return (
                  <div key={key}>
                    <span>{key.toUpperCase()}</span>
                    <strong className="explorer-page__mono">{JSON.stringify(value, null, 2)}</strong>
                  </div>
                );
              }
              return (
                <div key={key}>
                  <span>{key.toUpperCase()}</span>
                  <strong>
                    {isAccountKey(key) ? (
                      <Link onClick={() => navigate(`/account/${normalizeAccountAddress(String(value)) || String(value)}`)} className="explorer-page__clickable explorer-page__mono">
                        {String(value)}
                      </Link>
                    ) : (
                      String(value)
                    )}
                  </strong>
                </div>
              );
            })}
        </div>
      </section>
    </Box>
  );
}

export default ContentPage;

