import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OracleClient } from '../../../src/oracle/oracle-client.js';
import { logger } from '../../../src/utils/logger.js';

const mockFetch = vi.fn();

describe('OracleClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = mockFetch;
  });

  it('posts index requests with expected payload', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const payload = {
      success: true,
      indexed: 3,
      failed: 0,
      docId: 'doc-123',
      chunkStats: {
        totalChunks: 3,
        avgChunkSize: 500,
        maxChunkSize: 600,
        minChunkSize: 400,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const client = new OracleClient({ baseUrl: 'http://oracle.test', timeout: 10 });

    const result = await client.index({
      brand: 'Brand',
      docId: 'doc-123',
      text: 'Content body',
      metadata: { locale: 'en-IN' },
    });

    expect(mockFetch).toHaveBeenCalledWith('http://oracle.test/api/v1/index', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: 'Brand',
        doc_id: 'doc-123',
        text: 'Content body',
        metadata: { locale: 'en-IN' },
      }),
      signal: expect.any(AbortSignal),
    }));
    expect(result).toEqual(payload);
    expect(infoSpy).toHaveBeenCalledWith('ORACLE indexed document', expect.objectContaining({
      docId: 'doc-123',
      indexed: 3,
    }));
  });

  it('includes error detail when response is not ok', async () => {
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: () => Promise.resolve({ detail: 'Indexing failed' }),
    });

    const client = new OracleClient({ baseUrl: 'http://oracle.test' });

    await expect(client.search({
      brand: 'Brand',
      query: 'What is our USP?',
    })).rejects.toThrow(/ORACLE request failed \(500\): Indexing failed/);
  });

  it('translates abort errors into timeout guidance', async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

    const client = new OracleClient({ baseUrl: 'http://oracle.test', timeout: 5 });

    await expect(client.info()).rejects.toThrow(/ORACLE request timed out after 5ms/);
  });
});
