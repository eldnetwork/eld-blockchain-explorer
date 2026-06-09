import { tryDecodeBase64Utf8, formatEventForDisplay } from '../utils/eventDisplay';

describe('eventDisplay', () => {
  test('decodes indexer event attribute tuples', () => {
    const event = {
      tx_id: '0xc44a',
      event_index: 0,
      event_type: 'VerifiedProof',
      attributes: [
        ['c2VuZGVy', 'MHg3NWY5YmRhNWRjYTQxNjYxMGFhMTYzYzdlMDRiZGIzNWMxOTE2MzA4'],
        ['YmxvY2tfaGVpZ2h0', 'NDA='],
        ['cmV3YXJk', 'MTAwMA=='],
      ],
    };

    expect(formatEventForDisplay(event)).toEqual({
      tx_id: '0xc44a',
      event_index: 0,
      event_type: 'VerifiedProof',
      attributes: [
        ['sender', '0x75f9bda5dca416610aa163c7e04bdb35c1916308'],
        ['block_height', '40'],
        ['reward', '1000'],
      ],
    });
  });

  test('decodes Tendermint-style attribute objects', () => {
    const event = {
      type: 'transfer',
      attributes: [{ key: 'dG8=', value: 'MHhhMTBmZjNk' }],
    };

    expect(formatEventForDisplay(event)).toEqual({
      type: 'transfer',
      attributes: [{ key: 'to', value: '0xa10ff3d' }],
    });
  });

  test('leaves non-base64 strings unchanged', () => {
    expect(tryDecodeBase64Utf8('VerifiedProof')).toBe('VerifiedProof');
    expect(tryDecodeBase64Utf8('0xabc')).toBe('0xabc');
  });
});
