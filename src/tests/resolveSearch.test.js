import { beforeEach, describe, expect, test, vi } from 'vitest';
import { indexerGet, rpcAbciQuery, rpcGet } from '../api';
import { resolveSearchQuery } from '../utils/resolveSearch';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    indexerGet: vi.fn(),
    rpcGet: vi.fn(),
    rpcAbciQuery: vi.fn(),
  };
});

const ADDRESS = '0x75f9bda5dca416610aa163c7e04bdb35c1916308';
const TX_HASH = '0x' + 'ab'.repeat(32);

function abciInfo(payload) {
  return { result: { response: { info: JSON.stringify(payload) } } };
}

describe('resolveSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns null for an empty query', async () => {
    await expect(resolveSearchQuery('   ')).resolves.toBeNull();
    expect(rpcGet).not.toHaveBeenCalled();
  });

  test('resolves a decimal height to a block route even if RPC fails', async () => {
    rpcGet.mockRejectedValue(new Error('HTTP 404'));
    await expect(resolveSearchQuery('42')).resolves.toEqual({ kind: 'block', path: '/block/42' });
    expect(rpcGet).toHaveBeenCalledWith('/block?height=42', expect.any(Object));
  });

  test('resolves a 32-byte hex string to a tx route', async () => {
    indexerGet.mockResolvedValue({ transaction: { id: TX_HASH } });
    await expect(resolveSearchQuery(TX_HASH)).resolves.toEqual({
      kind: 'tx',
      path: `/tx/${TX_HASH}`,
    });
  });

  test('prefers a validator match for a 20-byte address', async () => {
    rpcAbciQuery.mockImplementation(async (path) => {
      if (path === 'active_validators') {
        return abciInfo({
          validators: [{ address: '0x75F9BDA5DCA416610AA163C7E04BDB35C1916308' }],
        });
      }
      throw new Error(`unexpected path ${path}`);
    });

    await expect(resolveSearchQuery(ADDRESS)).resolves.toEqual({
      kind: 'validator',
      path: `/validator/${ADDRESS}`,
    });
  });

  test('prefers a capacity provider when the address is not a validator', async () => {
    rpcAbciQuery.mockImplementation(async (path) => {
      if (path === 'active_validators') {
        return abciInfo({ validators: [] });
      }
      if (path === 'capacity_validators') {
        return abciInfo({ all_providers: [{ address: ADDRESS }] });
      }
      throw new Error(`unexpected path ${path}`);
    });

    await expect(resolveSearchQuery(ADDRESS)).resolves.toEqual({
      kind: 'capacity-provider',
      path: `/capacity-provider/${ADDRESS}`,
    });
  });

  test('falls back to an account route for an unmatched address', async () => {
    rpcAbciQuery.mockResolvedValue(abciInfo({}));
    await expect(resolveSearchQuery(ADDRESS.slice(2))).resolves.toEqual({
      kind: 'account',
      path: `/account/${ADDRESS}`,
    });
  });

  test('resolves indexer content then namespace then epoch prefix', async () => {
    indexerGet.mockRejectedValueOnce(new Error('HTTP 404'));
    indexerGet.mockResolvedValueOnce({ registered: true, namespace_slug: 'pin' });

    await expect(resolveSearchQuery('pin')).resolves.toEqual({
      kind: 'namespace',
      path: '/namespaces/pin',
    });

    indexerGet.mockRejectedValue(new Error('HTTP 404'));
    await expect(resolveSearchQuery('epoch-12')).resolves.toEqual({
      kind: 'epoch',
      path: '/epoch/epoch-12',
    });
  });

  test('rethrows abort errors', async () => {
    const abortErr = new DOMException('The operation was aborted.', 'AbortError');
    rpcGet.mockRejectedValue(abortErr);
    await expect(resolveSearchQuery('7')).rejects.toBe(abortErr);
  });
});
