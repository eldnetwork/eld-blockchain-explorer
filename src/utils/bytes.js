/**
 * Browser-native encodings that previously used the Node `buffer` polyfill.
 */

export function decodeBase64ToBytes(base64) {
  const binary = atob(String(base64));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

export function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function hexToBytes(hex) {
  const clean = String(hex).trim();
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const octet = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(octet)) {
      throw new Error('Invalid hex string');
    }
    bytes[i] = octet;
  }
  return bytes;
}

export function decodeBase64ToUtf8(base64) {
  return bytesToUtf8(decodeBase64ToBytes(base64));
}

export function decodeHexToUtf8(hex) {
  return bytesToUtf8(hexToBytes(hex));
}
