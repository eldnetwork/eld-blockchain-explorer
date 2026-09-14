import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { isAbortError, requestJson } from '../api/http';

function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('requestJson', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns parsed JSON on success', async () => {
    fetch.mockResolvedValue(jsonResponse({ height: 12 }));
    await expect(requestJson('http://rpc.test/status')).resolves.toEqual({ height: 12 });
    expect(fetch).toHaveBeenCalledWith(
      'http://rpc.test/status',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('passes method, body, and headers', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }));
    await requestJson('http://rpc.test', {
      method: 'POST',
      body: '{"id":1}',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://rpc.test',
      expect.objectContaining({
        method: 'POST',
        body: '{"id":1}',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  test('throws an error with status when the response is not ok', async () => {
    fetch.mockResolvedValue(jsonResponse(null, { status: 404 }));
    await expect(requestJson('http://rpc.test/missing')).rejects.toMatchObject({
      message: 'HTTP 404',
      status: 404,
      url: 'http://rpc.test/missing',
    });
  });

  test('throws AbortError when the outer signal is already aborted', async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(requestJson('http://rpc.test', { signal: ac.signal })).rejects.toSatisfy(
      isAbortError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test('aborts the in-flight fetch when the outer signal aborts', async () => {
    const ac = new AbortController();
    fetch.mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const pending = requestJson('http://rpc.test', { signal: ac.signal });
    ac.abort();
    await expect(pending).rejects.toSatisfy(isAbortError);
  });
});
