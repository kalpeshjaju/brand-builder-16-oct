import type { EnvironmentConfig } from './env-validator.js';
import { validateEnvironment } from './env-validator.js';

let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}
