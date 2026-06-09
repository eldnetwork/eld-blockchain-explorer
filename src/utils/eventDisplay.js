import { Buffer } from 'buffer';

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

function normalizeBase64String(value) {
  return String(value).replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
}

function padBase64String(value) {
  const mod = value.length % 4;
  if (mod === 0) return value;
  return value + '='.repeat(4 - mod);
}

function stripBase64Padding(value) {
  return value.replace(/=+$/, '');
}

/**
 * Decode a base64-encoded UTF-8 string when the input round-trips cleanly.
 * @param {unknown} input
 * @returns {unknown}
 */
export function tryDecodeBase64Utf8(input) {
  if (input == null || typeof input !== 'string') return input;

  const trimmed = input.trim();
  if (!trimmed) return input;

  const normalized = padBase64String(normalizeBase64String(trimmed));
  if (!BASE64_RE.test(normalized)) return input;

  try {
    const decoded = Buffer.from(normalized, 'base64').toString('utf-8');
    if (!decoded || decoded.includes('\uFFFD')) return input;

    const roundTrip = stripBase64Padding(Buffer.from(decoded, 'utf-8').toString('base64'));
    const original = stripBase64Padding(normalized);
    if (roundTrip === original) return decoded;

    if (/^[\x20-\x7E]*$/.test(decoded)) return decoded;
  } catch {
    // keep original
  }

  return input;
}

function decodeAttributeEntry(entry) {
  if (Array.isArray(entry) && entry.length >= 2) {
    return [tryDecodeBase64Utf8(entry[0]), tryDecodeBase64Utf8(entry[1])];
  }

  if (!entry || typeof entry !== 'object') return entry;

  const out = { ...entry };
  if ('key' in entry) out.key = tryDecodeBase64Utf8(String(entry.key));
  if ('Key' in entry) out.Key = tryDecodeBase64Utf8(String(entry.Key));
  if ('value' in entry) out.value = tryDecodeBase64Utf8(String(entry.value));
  if ('Value' in entry) out.Value = tryDecodeBase64Utf8(String(entry.Value));
  return out;
}

/**
 * Clone an event with human-readable attribute keys and values for JSON display.
 * @param {object} event
 * @returns {object}
 */
export function formatEventForDisplay(event) {
  if (!event || typeof event !== 'object') return event;

  const copy = { ...event };
  if (Array.isArray(event.attributes)) {
    copy.attributes = event.attributes.map(decodeAttributeEntry);
  }
  return copy;
}
