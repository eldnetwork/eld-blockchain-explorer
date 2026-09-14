import { normalizeAccountAddress, isAccountHexAddress } from '../utils/accountAddress';

describe('normalizeAccountAddress', () => {
  test('lowercases a 0x-prefixed 20-byte address', () => {
    expect(normalizeAccountAddress('0x75F9BDA5DCA416610AA163C7E04BDB35C1916308')).toBe(
      '0x75f9bda5dca416610aa163c7e04bdb35c1916308',
    );
  });

  test('adds 0x to a bare 40-char hex string', () => {
    expect(normalizeAccountAddress('75F9BDA5DCA416610AA163C7E04BDB35C1916308')).toBe(
      '0x75f9bda5dca416610aa163c7e04bdb35c1916308',
    );
  });

  test('trims surrounding whitespace', () => {
    expect(normalizeAccountAddress('  0x75f9bda5dca416610aa163c7e04bdb35c1916308  ')).toBe(
      '0x75f9bda5dca416610aa163c7e04bdb35c1916308',
    );
  });

  test('returns null for invalid values', () => {
    expect(normalizeAccountAddress(null)).toBeNull();
    expect(normalizeAccountAddress(undefined)).toBeNull();
    expect(normalizeAccountAddress(12)).toBeNull();
    expect(normalizeAccountAddress('')).toBeNull();
    expect(normalizeAccountAddress('0xabc')).toBeNull();
    expect(normalizeAccountAddress('0x75f9bda5dca416610aa163c7e04bdb35c1916308ff')).toBeNull();
    expect(normalizeAccountAddress('zzf9bda5dca416610aa163c7e04bdb35c1916308')).toBeNull();
  });

  test('isAccountHexAddress matches normalizeAccountAddress', () => {
    expect(isAccountHexAddress('0x75f9bda5dca416610aa163c7e04bdb35c1916308')).toBe(true);
    expect(isAccountHexAddress('not-an-address')).toBe(false);
  });
});
