import { z } from 'zod';
import { QUALITY_THRESHOLDS, LLM_DEFAULTS } from './constants.js';

const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === '') {
      return defaultValue;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = String(value).toLowerCase().trim();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }, z.boolean());

const numberFromEnv = (defaultValue: number, min?: number, max?: number) => {
  let schema = z.preprocess((value) => {
    if (value === undefined || value === '') {
      return defaultValue;
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }, z.number());

  if (min !== undefined) {
    schema = schema.refine((value) => value >= min, { message: `Expected value >= ${min}` });
  }

  if (max !== undefined) {
    schema = schema.refine((value) => value <= max, { message: `Expected value <= ${max}` });
  }

  return schema;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ANTHROPIC_API_KEY: z.string().trim().min(1, 'ANTHROPIC_API_KEY is required').optional(),
  GOOGLE_API_KEY: z.string().trim().optional(),
  GOOGLE_SEARCH_ENGINE_ID: z.string().trim().optional(),
  OPENAI_API_KEY: z.string().trim().optional(),
  DB_PATH: z.string().trim().min(1, 'DB_PATH is required').default('.brandos/cache/brandos.db'),
  CHROMA_DB_PATH: z.string().trim().min(1, 'CHROMA_DB_PATH is required').default('.brandos/cache/chroma_db'),
  DEFAULT_LLM_PROVIDER: z.enum(['anthropic', 'openai', 'mock']).default('anthropic'),
  DEFAULT_MODEL: z.string().trim().min(1, 'DEFAULT_MODEL is required').default('claude-sonnet-4-5-20250929'),
  LLM_TEMPERATURE: numberFromEnv(LLM_DEFAULTS.TEMPERATURE, 0, 2),
  LLM_MAX_TOKENS: numberFromEnv(LLM_DEFAULTS.MAX_TOKENS, 1),
  LLM_TIMEOUT_MS: numberFromEnv(LLM_DEFAULTS.TIMEOUT_MS, 1),
  LLM_MAX_RETRIES: numberFromEnv(LLM_DEFAULTS.MAX_RETRIES, 1),
  DAEMON_WATCH_INTERVAL: numberFromEnv(1_000, 100),
  DAEMON_AUTO_PROCESS: booleanFromEnv(true),
  CONTEXT_MAX_HISTORY: numberFromEnv(100, 1),
  CONTEXT_EMBEDDING_MODEL: z.string().trim().min(1, 'CONTEXT_EMBEDDING_MODEL is required').default('text-embedding-3-small'),
  MIN_SOURCE_QUALITY_TIER: z.enum(['tier1', 'tier2', 'tier3']).default('tier2'),
  MIN_CONFIDENCE_SCORE: numberFromEnv(QUALITY_THRESHOLDS.MIN_CONFIDENCE, 0, 1),
  MAX_VARIANCE_THRESHOLD: numberFromEnv(QUALITY_THRESHOLDS.MAX_VARIANCE, 0),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FILE: z.string().trim().default('.brandos/logs/brandos.log'),
});

export type EnvironmentConfig = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(`Environment validation failed:\n${issues.map((issue) => ` - ${issue}`).join('\n')}`);
    this.issues = issues;
  }
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`);
    throw new EnvValidationError(messages);
  }

  const config = parsed.data;
  const issues: string[] = [];

  const needsAnthropicKey = config.DEFAULT_LLM_PROVIDER === 'anthropic' && config.NODE_ENV !== 'test';
  if (needsAnthropicKey && !config.ANTHROPIC_API_KEY) {
    issues.push(
      'ANTHROPIC_API_KEY must be set when DEFAULT_LLM_PROVIDER=anthropic. ' +
      'Set it in your environment or switch DEFAULT_LLM_PROVIDER to mock/openai.',
    );
  }

  if (config.DEFAULT_LLM_PROVIDER === 'openai' && !config.OPENAI_API_KEY) {
    issues.push('OPENAI_API_KEY must be set when DEFAULT_LLM_PROVIDER=openai.');
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return config;
}
