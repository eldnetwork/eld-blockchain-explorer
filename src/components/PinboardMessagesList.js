import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, HStack, List, ListItem, Text } from '@chakra-ui/react';
import AsciiBox from './AsciiBox';
import { BORDER_RADIUS } from '../constants';
import { normalizeAccountAddress } from '../utils/accountAddress';

function getFirstDefined(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function resolveMessageId(item) {
  const meta = item?.meta ?? item;
  return (
    getFirstDefined(item, ['message_id', 'messageId', 'id', 'messageId']) ??
    getFirstDefined(meta, ['message_id', 'messageId', 'id', 'message_id']) ??
    null
  );
}

function resolveOriginalSigner(item) {
  const meta = item?.meta ?? item;
  return (
    getFirstDefined(item, ['original_signer', 'originalSigner']) ??
    getFirstDefined(meta, ['original_signer', 'originalSigner']) ??
    getFirstDefined(meta, ['wallet', 'signer']) ??
    null
  );
}

function resolveTag(item) {
  const meta = item?.meta ?? item;
  return (
    getFirstDefined(item, ['tag', 'tags']) ??
    getFirstDefined(meta, ['tag', 'tags']) ??
    null
  );
}

function PinboardMessagesList({ messages, onMessageClick, loading, showIndex = true }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <List spacing={3}>
        {Array(10)
          .fill(0)
          .map((_, idx) => (
            <ListItem key={idx}>
              <AsciiBox p={4}>
                <HStack spacing={4} w="full">
                  <Box flex="0 0 auto" width="40px" height="20px" bg="var(--lh-ghost-primary, #1f242b)" borderRadius={BORDER_RADIUS} />
                  <Box flex="1" height="20px" bg="var(--lh-ghost-primary, #1f242b)" borderRadius={BORDER_RADIUS} />
                </HStack>
              </AsciiBox>
            </ListItem>
          ))}
      </List>
    );
  }

  if (!messages || messages.length === 0) return <Box p={2}>No messages found</Box>;

  return (
    <List spacing={3} mt={2}>
      {messages.map((item, index) => {
        const messageId = resolveMessageId(item);
        const originalSigner = resolveOriginalSigner(item);
        const tag = resolveTag(item);

        return (
          <ListItem
            key={messageId ? `${messageId}-${index}` : index}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ opacity: 0.85 }}
            onClick={() => {
              if (!onMessageClick) return;
              onMessageClick({ wallet: originalSigner, messageId, item });
            }}
          >
            <AsciiBox p={4} className="explorer-page__list-item">
              <HStack justify="space-between" w="full" align="flex-start">
                <Box flex="1" minW={0}>
                  <Text fontSize="xs" className="explorer-page__muted" fontFamily="mono">
                    {showIndex ? `#${index + 1}` : ''}
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.100" fontFamily="mono" isTruncated title={messageId || ''}>
                    {messageId ? `Message: ${String(messageId)}` : 'Message: (unknown id)'}
                  </Text>
                  <Text
                    as="button"
                    type="button"
                    fontSize="xs"
                    className="explorer-page__muted explorer-page__clickable"
                    fontFamily="mono"
                    isTruncated
                    title={originalSigner || ''}
                    textAlign="left"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!originalSigner) return;
                      navigate(`/account/${normalizeAccountAddress(originalSigner) || originalSigner}`);
                    }}
                  >
                    {originalSigner ? `Signer: ${originalSigner}` : 'Signer: (unknown)'}
                  </Text>
                  {tag && (
                    <Text fontSize="xs" className="explorer-page__muted">
                      Tag: {Array.isArray(tag) ? tag.join(', ') : String(tag)}
                    </Text>
                  )}
                </Box>
              </HStack>
            </AsciiBox>
          </ListItem>
        );
      })}
    </List>
  );
}

export default PinboardMessagesList;

