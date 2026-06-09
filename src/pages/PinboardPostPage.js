import React, { useMemo } from 'react';
import { Box, Heading, HStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import usePinboardPostByPath from '../hooks/usePinboardPostByPath';
import useNamespace from '../hooks/useNamespace';
import { normalizeAccountAddress } from '../utils/accountAddress';
import { parseCustomNamespaceSlugFromCadoPath } from '../utils/namespacePath';
import './BlockPage.css';
import './TransactionPage.css';
import './PinboardPostPage.css';

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function normalizeContentType(raw) {
  if (raw == null || raw === '') return null;
  const base = String(raw).split(';')[0].trim().toLowerCase();
  return base || null;
}

function bytesMatchPngSig(bytes) {
  if (!bytes || bytes.length < PNG_SIG.length) return false;
  return PNG_SIG.every((b, i) => bytes[i] === b);
}

function decodeBase64Payload(messageB64) {
  if (!messageB64) {
    return { ok: false, bytes: null, normalizedB64: null, error: 'empty' };
  }

  try {
    const normalized = String(messageB64).replace(/[\r\n]/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const base64 = normalized + padding;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { ok: true, bytes, normalizedB64: base64 };
  } catch {
    return { ok: false, bytes: null, normalizedB64: null, error: 'invalid_base64' };
  }
}

/**
 * Uses `meta.content_type` when present (GET /v1/pinboard/post).
 * Supports application/json, application/text, text/plain, image/png; unknown types use UTF-8 + legacy JSON heuristic.
 */
function decodePinboardContent(messageB64, contentTypeRaw) {
  const declared = normalizeContentType(contentTypeRaw);
  const { ok, bytes, normalizedB64, error } = decodeBase64Payload(messageB64);

  if (!ok) {
    return {
      renderKind: error === 'empty' ? 'none' : 'invalid',
      text: null,
      dataUrl: null,
      bytesLength: null,
      declared,
      effectiveKind: error === 'empty' ? 'none' : 'invalid',
      jsonError: null,
    };
  }

  const bytesLength = bytes.length;

  if (declared === 'image/png') {
    const dataUrl = `data:image/png;base64,${normalizedB64}`;
    const looksPng = bytesMatchPngSig(bytes);
    return {
      renderKind: 'image',
      text: null,
      dataUrl,
      bytesLength,
      declared,
      effectiveKind: 'image/png',
      pngWarning: looksPng ? null : 'Payload does not start with a PNG signature.',
    };
  }

  let utf8Text = null;
  try {
    utf8Text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    utf8Text = null;
  }

  if (!utf8Text) {
    return {
      renderKind: 'binary',
      text: null,
      dataUrl: null,
      bytesLength,
      declared,
      effectiveKind: 'binary',
      jsonError: null,
    };
  }

  if (declared === 'application/json') {
    try {
      const parsed = JSON.parse(utf8Text);
      return {
        renderKind: 'json',
        text: JSON.stringify(parsed, null, 2),
        dataUrl: null,
        bytesLength,
        declared,
        effectiveKind: 'application/json',
        jsonError: null,
      };
    } catch (e) {
      return {
        renderKind: 'json-error',
        text: utf8Text,
        dataUrl: null,
        bytesLength,
        declared,
        effectiveKind: 'application/json',
        jsonError: e?.message || 'Invalid JSON',
      };
    }
  }

  if (declared === 'application/text' || declared === 'text/plain') {
    return {
      renderKind: 'text',
      text: utf8Text,
      dataUrl: null,
      bytesLength,
      declared,
      effectiveKind: declared,
      jsonError: null,
    };
  }

  try {
    const parsed = JSON.parse(utf8Text);
    return {
      renderKind: 'json',
      text: JSON.stringify(parsed, null, 2),
      dataUrl: null,
      bytesLength,
      declared,
      effectiveKind: 'json',
      jsonError: null,
    };
  } catch {
    return {
      renderKind: 'text',
      text: utf8Text,
      dataUrl: null,
      bytesLength,
      declared,
      effectiveKind: 'text',
      jsonError: null,
    };
  }
}

function PinboardPostPage() {
  const navigate = useNavigate();
  const { wallet, messageId } = useParams();
  const [searchParams] = useSearchParams();
  const pathFromQuery = searchParams.get('path');

  const cadoPath = useMemo(() => {
    if (pathFromQuery) return pathFromQuery;
    if (!wallet || !messageId) return null;
    return `/@eld/pinboard/post/${wallet}/${messageId}`;
  }, [wallet, messageId, pathFromQuery]);

  const { post, loading, error } = usePinboardPostByPath(cadoPath);
  const namespaceSlug = useMemo(
    () => parseCustomNamespaceSlugFromCadoPath(post?.cado_path || cadoPath),
    [post?.cado_path, cadoPath],
  );
  const { namespace: customNamespace } = useNamespace(namespaceSlug || undefined);
  const contentType = post?.meta?.content_type;
  const decoded = useMemo(
    () => decodePinboardContent(post?.message_b64, contentType),
    [post?.message_b64, contentType],
  );
  const blobStatus = String(post?.blob_status || 'unknown').toLowerCase();

  if (loading) return <Box className="explorer-record__state">Loading post...</Box>;
  if (error) return <Box className="explorer-record__state explorer-record__state--error">Error: {error}</Box>;
  if (!post) return <Box className="explorer-record__state">No post found</Box>;

  return (
    <Box className="explorer-record">
      <HStack className="explorer-record__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">← Explorer</Link>
        <Text className="explorer-record__crumb-sep">Post</Text>
        <Text className="explorer-record__crumb-current">{messageId}</Text>
      </HStack>

      <Heading className="explorer-record__title" as="h1">PINBOARD POST</Heading>

      <Box mb={6}>
        <Link as={RouterLink} to="/" className="explorer-record__crumb-link">
          ← Back
        </Link>
      </Box>

      <section className="explorer-record__section">
        <h2><span /> GENERAL INFORMATION</h2>
        <div className="explorer-record__kv-grid">
          <div><span>MESSAGE ID</span><strong className="explorer-record__mono">{post?.meta?.message_id || messageId || 'N/A'}</strong></div>
          <div>
            <span>SIGNER</span>
            <strong className="explorer-record__mono">
              <Link
                onClick={() => navigate(`/account/${normalizeAccountAddress(post?.meta?.original_signer || wallet) || (post?.meta?.original_signer || wallet)}`)}
                className="explorer-record__tx-hash"
              >
                {post?.meta?.original_signer || wallet || 'N/A'}
              </Link>
            </strong>
          </div>
          <div><span>BLOB STATUS</span><strong>{blobStatus}</strong></div>
          <div><span>CONTENT TYPE</span><strong>{contentType || 'N/A'}</strong></div>
          <div><span>TOPIC</span><strong>{post?.meta?.topic || 'N/A'}</strong></div>
          <div><span>VISIBILITY</span><strong>{post?.meta?.visibility || 'N/A'}</strong></div>
          <div><span>RECEIVED</span><strong>{post?.meta?.received_timestamp ? new Date(post.meta.received_timestamp * 1000).toLocaleString() : 'N/A'}</strong></div>
          <div><span>COMMITTED HEIGHT</span><strong>{post?.meta?.committed_height ?? 'N/A'}</strong></div>
          <div><span>EXPIRES HEIGHT</span><strong>{post?.meta?.expires_height ?? 'N/A'}</strong></div>
          <div><span>CONTENT KEY</span><strong className="explorer-record__mono">{post?.meta?.content_key || 'N/A'}</strong></div>
          <div><span>CADO PATH</span><strong className="explorer-record__mono">{post?.cado_path || cadoPath || 'N/A'}</strong></div>
          <div><span>TAGS</span><strong>{Array.isArray(post?.meta?.tags) && post.meta.tags.length > 0 ? post.meta.tags.join(', ') : 'N/A'}</strong></div>
        </div>
      </section>

      {customNamespace?.registered === true && (
        <section className="explorer-record__section">
          <h2><span /> CUSTOM NAMESPACE</h2>
          <div className="explorer-record__kv-grid">
            <div>
              <span>SCOPE</span>
              <strong>
                <Link
                  as={RouterLink}
                  to={`/namespaces/${encodeURIComponent(customNamespace.namespace_slug)}`}
                  className="explorer-record__tx-hash"
                >
                  {customNamespace.scope || `@${customNamespace.namespace_slug}`}
                </Link>
              </strong>
            </div>
            <div>
              <span>OWNER</span>
              <strong className="explorer-record__mono">
                <Link
                  onClick={() =>
                    navigate(
                      `/account/${normalizeAccountAddress(customNamespace.owner) || customNamespace.owner}`,
                    )
                  }
                  className="explorer-record__tx-hash"
                >
                  {customNamespace.owner}
                </Link>
              </strong>
            </div>
            <div>
              <span>REGISTERED AT BLOCK</span>
              <strong>
                <Link
                  onClick={() => navigate(`/block/${customNamespace.registered_height}`)}
                  className="explorer-record__tx-hash"
                >
                  #{customNamespace.registered_height}
                </Link>
              </strong>
            </div>
            {customNamespace.registry_path && (
              <div>
                <span>REGISTRY PATH</span>
                <strong className="explorer-record__mono">{customNamespace.registry_path}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="explorer-record__section">
        <h2><span /> CONTENT</h2>
        {blobStatus === 'expired' || blobStatus === 'missing' ? (
          <Text className="explorer-tx__muted">
            This post is {blobStatus}. Metadata is available, but blob content is not.
          </Text>
        ) : decoded.renderKind === 'image' && decoded.dataUrl ? (
          <Box p={4}>
            <Text className="explorer-pinboard-post__content-note">
              {decoded.declared ? `${decoded.declared} · ` : ''}
              {decoded.effectiveKind} ({decoded.bytesLength} bytes)
            </Text>
            {decoded.pngWarning && (
              <Text className="explorer-tx__muted" fontSize="sm" mb={2}>
                {decoded.pngWarning}
              </Text>
            )}
            <Box className="explorer-pinboard-post__image-wrap">
              <img src={decoded.dataUrl} alt="Pinboard attachment" className="explorer-pinboard-post__image" />
            </Box>
          </Box>
        ) : decoded.renderKind === 'json-error' && decoded.text != null ? (
          <Box p={4}>
            <Text className="explorer-pinboard-post__content-note">
              {decoded.declared ? `${decoded.declared} · ` : ''}
              JSON parse failed ({decoded.bytesLength} bytes)
            </Text>
            <Text className="explorer-tx__muted" fontSize="sm" mb={2}>
              {decoded.jsonError}
            </Text>
            <Box as="pre" className="explorer-tx__pre explorer-record__mono explorer-pinboard-post__pre">
              {decoded.text}
            </Box>
          </Box>
        ) : decoded.text ? (
          <Box p={4}>
            <Text className="explorer-pinboard-post__content-note">
              {decoded.declared ? `${decoded.declared} · ` : ''}
              rendered as {decoded.effectiveKind} ({decoded.bytesLength} bytes)
            </Text>
            <Box as="pre" className="explorer-tx__pre explorer-record__mono explorer-pinboard-post__pre">
              {decoded.text}
            </Box>
          </Box>
        ) : decoded.renderKind === 'invalid' ? (
          <Text className="explorer-tx__muted">Unable to decode message payload (invalid base64).</Text>
        ) : decoded.renderKind === 'binary' ? (
          <Text className="explorer-tx__muted">
            Payload is not valid UTF-8 text for this content type
            {decoded.bytesLength != null ? ` (${decoded.bytesLength} bytes).` : '.'}
          </Text>
        ) : (
          <Text className="explorer-tx__muted">
            No message body to display
            {decoded.bytesLength != null ? ` (${decoded.bytesLength} bytes).` : '.'}
          </Text>
        )}
      </section>

      {post?.message_b64 && (
        <section className="explorer-record__section">
          <h2><span /> RAW BASE64</h2>
          <Box as="pre" className="explorer-tx__pre explorer-record__mono explorer-pinboard-post__pre">
            {post.message_b64}
          </Box>
        </section>
      )}

    </Box>
  );
}

export default PinboardPostPage;

