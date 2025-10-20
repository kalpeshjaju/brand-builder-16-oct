import { logger } from '../../utils/logger.js';

type CleanupCallback = () => Promise<void> | void;

const cleanupCallbacks: CleanupCallback[] = [];
let shuttingDown = false;

export function registerCleanupCallback(callback: CleanupCallback): void {
  cleanupCallbacks.push(callback);
}

async function executeCleanup(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.warn(`Received ${signal}. Starting graceful shutdown.`);

  for (const callback of cleanupCallbacks) {
    try {
      await callback();
    } catch (error) {
      logger.error('Cleanup callback failed', error);
    }
  }

  logger.info('Graceful shutdown complete');
}

export function registerGracefulShutdownHandlers(): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.once(signal, async () => {
      await executeCleanup(signal);
      if (process.exitCode === undefined) {
        process.exitCode = 0;
      }
    });
  }

  process.once('uncaughtException', async (error: Error) => {
    logger.error('Uncaught exception', error);
    await executeCleanup('SIGTERM');
    process.exitCode = 1;
    throw error;
  });

  process.once('unhandledRejection', async (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled rejection', error);
    await executeCleanup('SIGTERM');
    process.exitCode = 1;
    throw error;
  });
}
