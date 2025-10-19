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
} as const;

export const CONTENT_REQUIREMENTS = {
  MIN_LENGTH: 1,
  MAX_BRAND_NAME_LENGTH: 100,
  MAX_QUERY_LENGTH: 4000,
  MAX_FILE_PATH_LENGTH: 1000,
} as const;

