import { formatJsonForDisplay } from '../utils/formatJsonForDisplay';

describe('formatJsonForDisplay', () => {
  test('keeps small primitive arrays on one line', () => {
    expect(formatJsonForDisplay({ values: [1, 2, 3] })).toBe('{\n  "values": [1, 2, 3]\n}');
  });

  test('groups long primitive arrays across multiple lines', () => {
    const chunkData = Array.from({ length: 10 }, (_, index) => index);
    const formatted = formatJsonForDisplay(
      {
        chunk_index: 44408,
        chunk_data: chunkData,
      },
      { itemsPerLine: 4 },
    );

    expect(formatted).toContain('"chunk_index": 44408');
    expect(formatted).toContain('"chunk_data": [');
    expect(formatted).toContain('0, 1, 2, 3,');
    expect(formatted).toContain('4, 5, 6, 7,');
    expect(formatted).toContain('8, 9');
    expect(formatted.split('\n').length).toBeLessThan(10);
  });

  test('formats proof payloads compactly while preserving object structure', () => {
    const proofs = [
      {
        chunk_index: 44408,
        chunk_data: Array.from({ length: 12 }, () => 0),
      },
    ];
    const formatted = formatJsonForDisplay({ proofs }, { itemsPerLine: 6 });

    expect(formatted).toContain('"proofs": [');
    expect(formatted).toContain('"chunk_index": 44408');
    expect(formatted).toContain('0, 0, 0, 0, 0, 0,');
    expect(formatted).not.toMatch(/^\s+0,$/m);
  });
});
