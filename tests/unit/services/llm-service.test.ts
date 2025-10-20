import { beforeEach, describe, expect, it, vi } from 'vitest';

const loggerSpies = vi.hoisted(() => ({
  warn: vi.fn(),
  metric: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: loggerSpies,
}));

vi.mock('../../../src/config/constants.js', () => ({
  LLM_DEFAULTS: {
    TEMPERATURE: 0.2,
    MAX_TOKENS: 4000,
    TIMEOUT_MS: 50,
    MAX_RETRIES: 2,
    CACHE_TTL_MS: 1000,
  },
  RATE_LIMITING: {
    MAX_CONCURRENCY: 2,
    INTERVAL_MS: 0,
    QUEUE_TIMEOUT_MS: 25,
  },
  RETRY_POLICY: {
    FACTOR: 1,
    INITIAL_DELAY_MS: 0,
    MAX_DELAY_MS: 1,
    MAX_ATTEMPTS: 2,
  },
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 2,
    SUCCESS_THRESHOLD: 1,
    COOLDOWN_MS: 1000,
  },
  METRICS_KEYS: {
    LLM_LATENCY: 'metrics.llm.latency',
    LLM_TOKENS: 'metrics.llm.tokens',
    LLM_ERRORS: 'metrics.llm.errors',
  },
}));

const createCallSpy = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: createCallSpy,
    },
  })),
}));

vi.mock('p-retry', () => {
  class MockAbortError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'AbortError';
    }
  }

  async function mockPRetry<T>(
    fn: () => Promise<T>,
    options: {
      retries?: number;
      onFailedAttempt?: (error: Error & { attemptNumber: number; retriesLeft: number }) => void;
    } = {}
  ): Promise<T> {
    const retries = options.retries ?? 0;
    let attemptNumber = 1;
    let retriesLeft = retries;

    while (attemptNumber <= retries + 1) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof MockAbortError) {
          throw error;
        }

        const normalized = error instanceof Error ? error : new Error(String(error));
        (normalized as Error & { attemptNumber: number; retriesLeft: number }).attemptNumber = attemptNumber;
        (normalized as Error & { attemptNumber: number; retriesLeft: number }).retriesLeft = retriesLeft;
        options.onFailedAttempt?.(
          normalized as Error & { attemptNumber: number; retriesLeft: number }
        );

        if (retriesLeft === 0) {
          throw normalized;
        }

        attemptNumber++;
        retriesLeft--;
      }
    }

    throw new Error('pRetry mock exhausted');
  }

  return {
    default: mockPRetry,
    AbortError: MockAbortError,
  };
});

import { ClaudeLLMService, MockLLMService } from '../../../src/services/llm-service.js';

const buildResponse = (text: string) => ({
  content: [{ type: 'text', text }],
  usage: {
    input_tokens: 10,
    output_tokens: 20,
  },
  model: 'claude-3-opus',
});

describe('ClaudeLLMService', () => {
  beforeEach(() => {
    createCallSpy.mockReset();
    loggerSpies.warn.mockReset();
    loggerSpies.metric.mockReset();
    loggerSpies.debug.mockReset();
    loggerSpies.info.mockReset();
    loggerSpies.error.mockReset();
  });

  it('returns prompt responses and records metrics', async () => {
    createCallSpy.mockResolvedValue(buildResponse('Hello world'));

    const service = new ClaudeLLMService({
      apiKey: 'test-key',
      cacheTtlMs: 500,
      rateLimit: { maxConcurrency: 1, intervalMs: 0, queueTimeoutMs: 10 },
      circuitBreaker: { failureThreshold: 3, successThreshold: 1, cooldownMs: 50 },
      maxRetries: 1,
    });

    const result = await service.prompt('What is our mission?');

    expect(result.content).toBe('Hello world');
    expect(createCallSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpies.metric).toHaveBeenCalledWith('metrics.llm.latency', expect.any(Number), { operation: 'prompt' });
    expect(loggerSpies.metric).toHaveBeenCalledWith('metrics.llm.tokens', 30, { operation: 'prompt' });
  });

  it('uses cached responses for identical prompts', async () => {
    createCallSpy.mockResolvedValue(buildResponse('Cached result'));

    const service = new ClaudeLLMService({
      apiKey: 'test-key',
      cacheTtlMs: 1000,
      rateLimit: { maxConcurrency: 1, intervalMs: 0, queueTimeoutMs: 10 },
      circuitBreaker: { failureThreshold: 3, successThreshold: 1, cooldownMs: 50 },
      maxRetries: 1,
    });

    const first = await service.prompt('Generate summary');
    const second = await service.prompt('Generate summary');

    expect(first.content).toBe('Cached result');
    expect(second.content).toBe('Cached result');
    expect(createCallSpy).toHaveBeenCalledTimes(1);
  });

  it('opens the circuit breaker after repeated failures', async () => {
    createCallSpy.mockRejectedValue(new Error('anthropic failure'));

    const service = new ClaudeLLMService({
      apiKey: 'test-key',
      cacheTtlMs: 0,
      circuitBreaker: { failureThreshold: 1, successThreshold: 1, cooldownMs: 10_000 },
      rateLimit: { maxConcurrency: 1, intervalMs: 0, queueTimeoutMs: 10 },
      maxRetries: 1,
    });

    await expect(service.prompt('Break it')).rejects.toThrow('anthropic failure');
    await expect(service.prompt('Break it again')).rejects.toThrow(/circuit breaker is open/);
    expect(loggerSpies.warn).toHaveBeenCalledWith(
      expect.stringContaining('LLM prompt attempt'),
      expect.objectContaining({ message: 'anthropic failure', retriesLeft: 0 })
    );
    expect(loggerSpies.metric).toHaveBeenCalledWith('metrics.llm.errors', 1, { operation: 'prompt' });
  });

  it('falls back to safe analysis when JSON parsing fails', async () => {
    createCallSpy.mockResolvedValue(buildResponse('Not JSON at all'));

    const service = new ClaudeLLMService({
      apiKey: 'test-key',
      cacheTtlMs: 0,
      rateLimit: { maxConcurrency: 1, intervalMs: 0, queueTimeoutMs: 10 },
      circuitBreaker: { failureThreshold: 3, successThreshold: 1, cooldownMs: 50 },
      maxRetries: 1,
    });

    const result = await service.analyze('content', 'brand-audit');

    expect(result.type).toBe('brand-audit');
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.score).toBe(7);
  });

  it('validates content based on LLM response prefix', async () => {
    createCallSpy.mockResolvedValue(buildResponse('VALID: looks good'));

    const service = new ClaudeLLMService({
      apiKey: 'test-key',
      cacheTtlMs: 0,
      rateLimit: { maxConcurrency: 1, intervalMs: 0, queueTimeoutMs: 10 },
      circuitBreaker: { failureThreshold: 3, successThreshold: 1, cooldownMs: 50 },
      maxRetries: 1,
    });

    const result = await service.validate('content', []);

    expect(result).toBe(true);
  });
});

describe('MockLLMService', () => {
  it('provides deterministic mock responses', async () => {
    const service = new MockLLMService();
    const promptResult = await service.prompt('Hello');
    expect(promptResult.content).toContain('Mock response for: Hello');
    const generated = await service.generate('Write tagline', 'tagline');
    expect(generated).toContain('Generated tagline content');
    const validated = await service.validate('anything', []);
    expect(validated).toBe(true);
  });
});
