// Context command - Manage knowledge context

import type { ContextCommandOptions } from '../../types/index.js';
import type { ContextState } from '../../types/context-types.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import {
  sanitizeBrandName,
  sanitizeContextAction,
  sanitizeContextFormat,
  sanitizeOptionalText,
} from '../../validation/input-schemas.js';
import { handleCommandError } from '../utils/error-handler.js';
import chalk from 'chalk';
import ora from 'ora';

export async function contextCommand(action: string, options: ContextCommandOptions): Promise<void> {
  const sanitizedAction = sanitizeContextAction(action);
  const brand = sanitizeBrandName(options.brand);
  const format = sanitizeContextFormat(options.format ?? 'table');
  const category = sanitizeOptionalText(options.category);

  const spinner = ora(`Executing context ${sanitizedAction}...`).start();

  try {
    logger.info('Context command', { action: sanitizedAction, brand, category, format });

    const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
    const contextPath = `${workspacePath}/data/context-state.json`;

    if (sanitizedAction === 'status') {
      if (await FileSystemUtils.fileExists(contextPath)) {
        const contextState = await FileSystemUtils.readJSON<ContextState>(contextPath);
        const filteredFiles = category
          ? contextState.files.filter((file) => file.category === category)
          : contextState.files;
        const stateForOutput: ContextState = category
          ? { ...contextState, files: filteredFiles }
          : contextState;
        const { stats } = stateForOutput;

        spinner.succeed(chalk.green('Context status retrieved'));

        if (format === 'json') {
          console.log(JSON.stringify(stateForOutput, null, 2));
        } else {
          console.log('\n' + chalk.bold('Knowledge Context Status:'));
          console.log(chalk.cyan(`  Brand: ${brand}`));
          console.log(chalk.cyan(`  Total Files: ${stats.totalFiles}`));
          console.log(chalk.cyan(`  Processed: ${stats.processedFiles}`));
          console.log(chalk.cyan(`  Pending: ${stats.pendingFiles}`));
          console.log(chalk.cyan(`  Knowledge Entries: ${stats.totalKnowledge}`));
          console.log(chalk.cyan(`  Last Sync: ${stateForOutput.lastSync}`));
        }
      } else {
        spinner.warn(chalk.yellow('No context found'));
        console.log(`Run: brandos init --brand "${brand}"`);
      }
    } else {
      spinner.info(chalk.blue(`Action '${sanitizedAction}' not fully implemented yet`));
      console.log('Available actions: status, list, clear, sync');
    }

  } catch (error) {
    handleCommandError('context', error, spinner);
  }
}
