import chalk from 'chalk';
import pRetry, { AbortError } from 'p-retry';
import type { Ora } from 'ora';
import { logger } from '../../utils/logger.js';
import { RETRY_POLICY } from '../../config/constants.js';

export interface CommandRetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
}

export class CommandExecutionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'CommandExecutionError';
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class NonRetryableError extends CommandExecutionError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NonRetryableError';
  }
}

export async function runWithRetry<T>(
  operationName: string,
  operation: () => Promise<T>,
  retryOptions: CommandRetryOptions = {}
): Promise<T> {
  const {
    retries = RETRY_POLICY.MAX_ATTEMPTS - 1,
    factor = RETRY_POLICY.FACTOR,
    minTimeout = RETRY_POLICY.INITIAL_DELAY_MS,
    maxTimeout = RETRY_POLICY.MAX_DELAY_MS,
  } = retryOptions;

  return pRetry(async () => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof NonRetryableError) {
        throw new AbortError(error.message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }, {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    onFailedAttempt: (error) => {
      const message = error.message ?? 'Unknown error';
      const attemptInfo = `${error.attemptNumber}/${error.retriesLeft + error.attemptNumber}`;
      logger.warn(`Operation '${operationName}' failed (attempt ${attemptInfo})`, {
        error: message,
      });
    },
  });
}

export function handleCommandError(commandName: string, error: unknown, spinner?: Ora): void {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  if (spinner) {
    spinner.fail(chalk.red(normalizedError.message));
  }

  logger.error(`${commandName} command failed`, normalizedError);

  console.error(chalk.red(`\n${commandName.toUpperCase()} COMMAND FAILED`));
  console.error(chalk.red(`Reason: ${normalizedError.message}`));

  if (normalizedError.cause instanceof Error && normalizedError.cause.message) {
    console.error(chalk.red(`Cause: ${normalizedError.cause.message}`));
  }

  process.exitCode = 1;
}
