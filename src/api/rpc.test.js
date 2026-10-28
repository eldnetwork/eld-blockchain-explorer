import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RPC_URL } from '../config';
import { rpcAbciQuery, rpcGet, rpcPathToPost } from './rpc';

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  };
}

function postedBody() {
  const [, init] = fetch.mock.calls[0];
  return JSON.parse(init.body);
}

describe('rpcPathToPost', () => {
  test('maps URI paths onto JSON-RPC params', () => {
    expect(rpcPathToPost('/status')).toEqual({ method: 'status', params: {} });
    expect(rpcPathToPost('/block?height=12')).toEqual({
      method: 'block',
      params: { height: 12 },
    });
    expect(rpcPathToPost('/blockchain?minHeight=1&maxHeight=20')).toEqual({
      method: 'blockchain',
      params: { minHeight: 1, maxHeight: 20 },
    });
    expect(rpcPathToPost('/abci_query?path="epoch_info"&data=""&height=0&prove=false')).toEqual({
      method: 'abci_query',
      params: { path: 'epoch_info', data: '', height: 0, prove: false },
    });
  });

  test('hex-encodes quoted abci data', () => {
    const { params } = rpcPathToPost('/abci_query?path="cado"&data="/@eld/account/ab"&prove=false');
    expect(params.path).toBe('cado');
    expect(params.data).toBe(
      [...new TextEncoder().encode('/@eld/account/ab')]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join(''),
    );
    expect(params.prove).toBe(false);
  });
});

describe('rpcGet', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ result: {} })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('posts status to the RPC root', async () => {
    await rpcGet('/status');
    expect(fetch).toHaveBeenCalledWith(
      RPC_URL,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(postedBody()).toEqual({ jsonrpc: '2.0', id: 1, method: 'status' });
  });

  test('posts abci_query with an empty data hex string', async () => {
    await rpcAbciQuery('active_validators', '');
    expect(postedBody()).toMatchObject({
      method: 'abci_query',
      params: { path: 'active_validators', data: '', prove: false },
    });
  });
});
