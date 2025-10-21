/**
 * Tests for OracleClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OracleClient } from '../../../src/oracle/oracle-client.js';
import { PythonBridge } from '../../../src/oracle/python-bridge.js';

// Mock the PythonBridge
vi.mock('../../../src/oracle/python-bridge.js');

describe('OracleClient', () => {
  let mockSendCommand: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendCommand = vi.fn();
    vi.mocked(PythonBridge).mockImplementation(() => ({
      sendCommand: mockSendCommand,
      kill: vi.fn(),
    } as any));
  });

  it('should call the "add" command with the correct payload', async () => {
    const client = new OracleClient();
    const doc = {
      id: 'doc-123',
      document: 'This is a test document.',
      metadata: { source: 'test.md' },
    };

    mockSendCommand.mockResolvedValue({ status: 'success', id: 'doc-123' });

    const result = await client.addDocument(doc);

    expect(mockSendCommand).toHaveBeenCalledWith('add', doc);
    expect(result).toEqual({ status: 'success', id: 'doc-123' });
  });

  it('should call the "search" command with the correct payload', async () => {
    const client = new OracleClient();
    const query = {
      query: 'test query',
      n_results: 5,
    };

    mockSendCommand.mockResolvedValue({ status: 'success', results: [] });

    await client.search(query);

    expect(mockSendCommand).toHaveBeenCalledWith('search', query);
  });

  it('should handle errors from the Python bridge', async () => {
    const client = new OracleClient();
    mockSendCommand.mockRejectedValue(new Error('Python script error'));

    await expect(client.addDocument({} as any)).rejects.toThrow('Python script error');
  });
});