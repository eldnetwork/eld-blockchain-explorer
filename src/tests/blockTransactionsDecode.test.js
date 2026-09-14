import { decodeEldTxFromBlockBase64 } from '../utils/blockTransactions';

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

describe('decodeEldTxFromBlockBase64', () => {
  test('decodes hex-wrapped JSON from Tendermint tx bytes', () => {
    const json = '{"payload":{"type":"Transfer"}}';
    const hex = [...new TextEncoder().encode(json)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    expect(decodeEldTxFromBlockBase64(utf8ToBase64(hex))).toEqual({
      payload: { type: 'Transfer' },
    });
  });

  test('falls back to raw JSON in the base64 payload', () => {
    expect(decodeEldTxFromBlockBase64(utf8ToBase64('{"ok":true}'))).toEqual({ ok: true });
  });

  test('returns null for garbage input', () => {
    expect(decodeEldTxFromBlockBase64('%%%not-base64%%%')).toBeNull();
  });
});
