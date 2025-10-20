import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/config/constants.js', () => ({
  RETRY_POLICY: {
    MAX_ATTEMPTS: 3,
    FACTOR: 1,
    INITIAL_DELAY_MS: 0,
    MAX_DELAY_MS: 0,
  },
}));

vi.mock('p-retry', () => {
  class MockAbortError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'AbortError';
    }
  }

  async function mockPRetry<T>(fn: () => Promise<T>, options: {
    retries?: number;
    onFailedAttempt?: (error: Error & { attemptNumber: number; retriesLeft: number }) => void;
  } = {}): Promise<T> {
    const retries = options.retries ?? 0;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof MockAbortError) {
          throw error;
        }

        const attemptNumber = attempt + 1;
        const retriesLeft = retries - attempt;
        const normalized = error instanceof Error ? error : new Error(String(error));
        (normalized as Error & { attemptNumber: number; retriesLeft: number }).attemptNumber = attemptNumber;
        (normalized as Error & { attemptNumber: number; retriesLeft: number }).retriesLeft = retriesLeft;

        options.onFailedAttempt?.(
          normalized as Error & { attemptNumber: number; retriesLeft: number }
        );

        if (attempt === retries) {
          throw normalized;
        }

        attempt++;
      }
    }

    throw new Error('pRetry mock exhausted without result');
  }

  return {
    default: mockPRetry,
    AbortError: MockAbortError,
  };
});

import { handleCommandError, NonRetryableError, runWithRetry } from '../../../src/cli/utils/error-handler.js';
import { logger } from '../../../src/utils/logger.js';
import { AbortError } from 'p-retry';

describe('CLI error handler utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retries transient failures and resolves successfully', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    let attempts = 0;

    const result = await runWithRetry('index', async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('temporary failure');
      }
      return 'success';
    });

    expect(result).toBe('success');
    expect(attempts).toBe(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Operation 'index' failed"),
      expect.objectContaining({ error: 'temporary failure' })
    );
  });

  it('halts retries when a NonRetryableError is thrown', async () => {
    await expect(runWithRetry('generate', async () => {
      throw new NonRetryableError('do not retry');
    })).rejects.toBeInstanceOf(AbortError);
  });

  it('reports command errors and surfaces causes', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const spinner = { fail: vi.fn() } as unknown as import('ora').Ora;
    process.exitCode = 0;

    const rootError = new NonRetryableError('top-level failure', { cause: new Error('io failure') });
    handleCommandError('generate', rootError, spinner);

    expect(spinner.fail).toHaveBeenCalledWith(expect.stringContaining('top-level failure'));
    expect(errorSpy).toHaveBeenCalledWith(
      'generate command failed',
      expect.objectContaining({ message: 'top-level failure' })
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GENERATE COMMAND FAILED'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reason: top-level failure'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cause: io failure'));
    expect(process.exitCode).toBe(1);
  });
});
