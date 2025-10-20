// Runtime defaults and thresholds used across the app
export const QUALITY_THRESHOLDS = {
  MIN_CONFIDENCE: 0.7,
  MAX_VARIANCE: 0.15,
} as const;

export const LLM_DEFAULTS = {
  TEMPERATURE: 0.2,
  MAX_TOKENS: 8000,
  TIMEOUT_MS: 60000,
  MAX_RETRIES: 3,
  CACHE_TTL_MS: 5 * 60 * 1000,
} as const;

export const RETRY_POLICY = {
  MAX_ATTEMPTS: 4,
  FACTOR: 2,
  INITIAL_DELAY_MS: 500,
  MAX_DELAY_MS: 5_000,
} as const;

export const RATE_LIMITING = {
  MAX_CONCURRENCY: 2,
  INTERVAL_MS: 1_000,
  QUEUE_TIMEOUT_MS: 10_000,
} as const;

export const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 5,
  SUCCESS_THRESHOLD: 2,
  COOLDOWN_MS: 30_000,
} as const;

export const METRICS_KEYS = {
  LLM_LATENCY: 'llm.prompt.latency',
  LLM_TOKENS: 'llm.prompt.tokens',
  LLM_ERRORS: 'llm.prompt.errors',
} as const;

export const CONTENT_REQUIREMENTS = {
  MIN_LENGTH: 1,
  MAX_BRAND_NAME_LENGTH: 100,
  MAX_QUERY_LENGTH: 4000,
  MAX_FILE_PATH_LENGTH: 1000,
} as const;
