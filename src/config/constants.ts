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
  CACHE_TTL_MS: 0,
} as const;

export const CONTENT_REQUIREMENTS = {
  MIN_LENGTH: 1,
  MAX_BRAND_NAME_LENGTH: 100,
  MAX_QUERY_LENGTH: 4000,
  MAX_FILE_PATH_LENGTH: 1000,
} as const;

export const RETRY_POLICY = {
  MAX_ATTEMPTS: 5,
  FACTOR: 2,
  INITIAL_DELAY_MS: 500,
  MAX_DELAY_MS: 5_000,
} as const;

export const RATE_LIMITING = {
  MAX_CONCURRENCY: 3,
  INTERVAL_MS: 100,
  QUEUE_TIMEOUT_MS: 15_000,
} as const;

export const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 5,
  SUCCESS_THRESHOLD: 2,
  COOLDOWN_MS: 30_000,
} as const;

export const METRICS_KEYS = {
  LLM_LATENCY: 'metrics.llm.latency_ms',
  LLM_TOKENS: 'metrics.llm.tokens_total',
  LLM_ERRORS: 'metrics.llm.errors_total',
} as const;
