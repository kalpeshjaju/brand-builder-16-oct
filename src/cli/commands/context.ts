// Context command - Manage knowledge context

import type { ContextCommandOptions } from '../../types/index.js';
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
import { z } from 'zod';

const contextStatsSchema = z.object({
  totalFiles: z.number().int().nonnegative(),
  processedFiles: z.number().int().nonnegative(),
  pendingFiles: z.number().int().nonnegative(),
  totalKnowledge: z.number().int().nonnegative(),
}).partial().transform((stats) => ({
  totalFiles: stats.totalFiles ?? 0,
  processedFiles: stats.processedFiles ?? 0,
  pendingFiles: stats.pendingFiles ?? 0,
  totalKnowledge: stats.totalKnowledge ?? 0,
}));

const trackedFileSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
}).passthrough();

const contextStateSchema = z.object({
  brandName: z.string().min(1),
  workspace: z.string().min(1).optional(),
  files: z.array(trackedFileSchema).default([]),
  knowledge: z.array(z.any()).optional().default([]),
  version: z.number().int().nonnegative().optional().default(1),
  lastSync: z.string().min(1).optional().default('Unknown'),
  stats: contextStatsSchema.optional().default({
    totalFiles: 0,
    processedFiles: 0,
    pendingFiles: 0,
    totalKnowledge: 0,
  }),
}).passthrough();

type ParsedContextState = z.infer<typeof contextStateSchema>;

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
        const rawState = await FileSystemUtils.readJSON<Record<string, unknown>>(contextPath);
        const parsedState = contextStateSchema.safeParse(rawState);

        if (!parsedState.success) {
          throw new Error(
            `Context state file is invalid:\n${parsedState.error.issues.map(issue => ` - ${issue.path.join('.') || 'root'}: ${issue.message}`).join('\n')}`
          );
        }

        const baseState = parsedState.data;
        const files = baseState.files;
        const filteredFiles = category
          ? files.filter((file) => file.category === category)
          : files;

        const stats = baseState.stats;
        const stateForOutput: ParsedContextState = {
          ...baseState,
          files: filteredFiles,
        };

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
