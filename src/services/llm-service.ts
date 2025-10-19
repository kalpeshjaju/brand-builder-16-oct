import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import pRetry, { AbortError } from 'p-retry';
import { CIRCUIT_BREAKER, LLM_DEFAULTS, METRICS_KEYS, RATE_LIMITING, RETRY_POLICY } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { metricsRegistry } from '../utils/metrics.js';

export interface LLMServiceConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
  cacheTtlMs?: number;
  rateLimit?: {
    maxConcurrency?: number;
    intervalMs?: number;
    queueTimeoutMs?: number;
  };
  circuitBreaker?: {
    failureThreshold?: number;
    successThreshold?: number;
    cooldownMs?: number;
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface LLMService {
  prompt(content: string, options?: Record<string, unknown>): Promise<LLMResponse>;
  analyze(content: string, analysisType: string): Promise<any>;
  generate(prompt: string, type: string): Promise<string>;
  validate(content: string, rules: any[]): Promise<boolean>;
}

type QueueEntry = {
  run: () => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
};

class RateLimiter {
  private active = 0;
  private readonly queue: QueueEntry[] = [];

  constructor(
    private readonly maxConcurrency: number,
    private readonly intervalMs: number,
    private readonly queueTimeoutMs: number,
  ) {}

  async schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = () => {
        this.active++;
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.active--;
            setTimeout(() => this.processQueue(), this.intervalMs);
          });
      };

      const entry: QueueEntry = {
        run: () => {
          clearTimeout(entry.timeoutId);
          execute();
        },
        reject,
        timeoutId: undefined as unknown as NodeJS.Timeout,
      };

      entry.timeoutId = setTimeout(() => {
        this.removeFromQueue(entry);
        reject(new Error('Rate limiter queue timeout exceeded'));
      }, this.queueTimeoutMs);

      this.queue.push(entry);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.active >= this.maxConcurrency) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    next.run();
  }

  private removeFromQueue(entry: QueueEntry): void {
    const index = this.queue.indexOf(entry);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
  }
}

class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private nextAttempt = 0;

  constructor(
    private readonly failureThreshold: number,
    private readonly successThreshold: number,
    private readonly cooldownMs: number,
  ) {}

  canExecute(): boolean {
    if (this.state === 'open') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = 'closed';
        this.successes = 0;
      }
    }
  }

  recordFailure(): void {
    this.failures++;
    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = 'open';
    this.nextAttempt = Date.now() + this.cooldownMs;
    this.failures = 0;
    this.successes = 0;
    logger.warn('LLM circuit breaker opened', {
      cooldownMs: this.cooldownMs,
    });
  }
}

class ResponseCache {
  private readonly store = new Map<string, { expiresAt: number; response: LLMResponse }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): LLMResponse | undefined {
    if (this.ttlMs <= 0) {
      return undefined;
    }

    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.response;
  }

  set(key: string, response: LLMResponse): void {
    if (this.ttlMs <= 0) {
      return;
    }
    this.store.set(key, {
      response,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}

function createCacheKey(prompt: string, options?: Record<string, unknown>): string {
  const hash = createHash('sha256');
  hash.update(prompt);
  if (options) {
    hash.update(JSON.stringify(options));
  }
  return hash.digest('hex');
}

export class MockLLMService implements LLMService {
  async prompt(content: string): Promise<LLMResponse> {
    return {
      content: `Mock response for: ${content}`,
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
      },
      model: 'mock-model',
    };
  }

  async analyze(_content: string, analysisType: string): Promise<any> {
    return {
      type: analysisType,
      findings: [],
      confidence: 0.75,
    };
  }

  async generate(prompt: string, type: string): Promise<string> {
    return `Generated ${type} content for: ${prompt}`;
  }

  async validate(_content: string, _rules: any[]): Promise<boolean> {
    return true;
  }
}

export class ClaudeLLMService implements LLMService {
  private readonly client: Anthropic;
  private readonly config: Required<LLMServiceConfig>;
  private readonly rateLimiter: RateLimiter;
  private readonly cache: ResponseCache;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(config: LLMServiceConfig = {}) {
    const apiKey = config.apiKey || process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for ClaudeLLMService');
    }

    this.config = {
      apiKey,
      model: config.model || process.env['DEFAULT_MODEL'] || 'claude-sonnet-4-5-20250929',
      temperature: config.temperature ?? Number(process.env['LLM_TEMPERATURE'] ?? LLM_DEFAULTS.TEMPERATURE),
      maxTokens: config.maxTokens ?? Number(process.env['LLM_MAX_TOKENS'] ?? LLM_DEFAULTS.MAX_TOKENS),
      timeout: config.timeout ?? Number(process.env['LLM_TIMEOUT_MS'] ?? LLM_DEFAULTS.TIMEOUT_MS),
      maxRetries: config.maxRetries ?? Number(process.env['LLM_MAX_RETRIES'] ?? LLM_DEFAULTS.MAX_RETRIES),
      cacheTtlMs: config.cacheTtlMs ?? LLM_DEFAULTS.CACHE_TTL_MS,
      rateLimit: {
        maxConcurrency: config.rateLimit?.maxConcurrency ?? RATE_LIMITING.MAX_CONCURRENCY,
        intervalMs: config.rateLimit?.intervalMs ?? RATE_LIMITING.INTERVAL_MS,
        queueTimeoutMs: config.rateLimit?.queueTimeoutMs ?? RATE_LIMITING.QUEUE_TIMEOUT_MS,
      },
      circuitBreaker: {
        failureThreshold: config.circuitBreaker?.failureThreshold ?? CIRCUIT_BREAKER.FAILURE_THRESHOLD,
        successThreshold: config.circuitBreaker?.successThreshold ?? CIRCUIT_BREAKER.SUCCESS_THRESHOLD,
        cooldownMs: config.circuitBreaker?.cooldownMs ?? CIRCUIT_BREAKER.COOLDOWN_MS,
      },
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      maxRetries: this.config.maxRetries,
    });

    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.maxConcurrency ?? RATE_LIMITING.MAX_CONCURRENCY,
      this.config.rateLimit.intervalMs ?? RATE_LIMITING.INTERVAL_MS,
      this.config.rateLimit.queueTimeoutMs ?? RATE_LIMITING.QUEUE_TIMEOUT_MS,
    );

    this.cache = new ResponseCache(this.config.cacheTtlMs ?? 0);
    this.circuitBreaker = new CircuitBreaker(
      this.config.circuitBreaker.failureThreshold ?? CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      this.config.circuitBreaker.successThreshold ?? CIRCUIT_BREAKER.SUCCESS_THRESHOLD,
      this.config.circuitBreaker.cooldownMs ?? CIRCUIT_BREAKER.COOLDOWN_MS,
    );
  }

  async prompt(content: string, options: Record<string, unknown> = {}): Promise<LLMResponse> {
    return this.executeRequest('prompt', content, options, async () => {
      const response = await this.client.messages.create({
        model: (options?.['model'] as string) || this.config.model || 'claude-opus-20240229',
        max_tokens: (options?.['maxTokens'] as number) || this.config.maxTokens,
        temperature: (options?.['temperature'] as number) ?? this.config.temperature,
        system: options?.['systemPrompt'] as string | undefined,
        messages: [{ role: 'user', content }],
      });

      const textContent = response.content.find(entry => entry.type === 'text');

      return {
        content: textContent?.type === 'text' ? textContent.text : '',
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
      } satisfies LLMResponse;
    });
  }

  async analyze(content: string, analysisType: string): Promise<any> {
    const prompt = `Analyze the following content as a ${analysisType}. Provide detailed findings and insights.

Content to analyze:
${content}

Return your analysis as a structured JSON object with:
- type: string (analysis type)
- findings: array of objects with description, impact, and confidence
- score: number 0-10
- recommendations: array of strings
- metadata: object with relevant context`;

    const response = await this.prompt(prompt);
    try {
      return JSON.parse(response.content);
    } catch {
      return {
        type: analysisType,
        findings: [{ description: response.content, impact: 'unknown', confidence: 0.7 }],
        score: 7,
        recommendations: [],
        metadata: {},
      };
    }
  }

  async generate(prompt: string, type: string): Promise<string> {
    const response = await this.prompt(
      `Generate ${type} content based on the following requirements:

${prompt}

Provide high-quality, professional output that addresses all requirements.`
    );
    return response.content;
  }

  async validate(content: string, rules: any[]): Promise<boolean> {
    const rulesText = rules.map(rule => `- ${JSON.stringify(rule)}`).join('\n');
    const response = await this.prompt(
      `Validate the following content against these rules:

Rules:
${rulesText}

Content to validate:
${content}

Respond with only "VALID" or "INVALID" followed by a brief explanation.`
    );
    return response.content.trim().toLowerCase().startsWith('valid');
  }

  private async executeRequest(
    operation: string,
    content: string,
    options: Record<string, unknown>,
    requestFn: () => Promise<LLMResponse>
  ): Promise<LLMResponse> {
    if (!this.circuitBreaker.canExecute()) {
      throw new Error('LLM circuit breaker is open. Please wait before retrying.');
    }

    const cacheKey = createCacheKey(`${operation}:${content}`, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const start = Date.now();

    try {
      const response = await this.rateLimiter.schedule(() =>
        pRetry(async () => {
          try {
            const result = await this.withTimeout(requestFn(), this.config.timeout ?? LLM_DEFAULTS.TIMEOUT_MS);
            return result;
          } catch (error) {
            if (error instanceof AbortError) {
              throw error;
            }
            throw error instanceof Error ? error : new Error(String(error));
          }
        }, {
          retries: (this.config.maxRetries ?? LLM_DEFAULTS.MAX_RETRIES) - 1,
          factor: RETRY_POLICY.FACTOR,
          minTimeout: RETRY_POLICY.INITIAL_DELAY_MS,
          maxTimeout: RETRY_POLICY.MAX_DELAY_MS,
          onFailedAttempt: (error) => {
            logger.warn(`LLM ${operation} attempt ${error.attemptNumber} failed`, {
              retriesLeft: error.retriesLeft,
              message: error.message,
            });
          },
        })
      );

      this.circuitBreaker.recordSuccess();
      const duration = Date.now() - start;
      logger.metric(METRICS_KEYS.LLM_LATENCY, duration, { operation });

      if (response.usage) {
        logger.metric(METRICS_KEYS.LLM_TOKENS, response.usage.totalTokens, { operation });
      }

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      logger.metric(METRICS_KEYS.LLM_ERRORS, 1, { operation });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new AbortError(`LLM request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}
