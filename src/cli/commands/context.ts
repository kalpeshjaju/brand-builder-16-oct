// Context command - Manage knowledge context

import type { ContextCommandOptions } from '../../types/index.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';

export async function contextCommand(action: string, options: ContextCommandOptions): Promise<void> {
  const spinner = ora(`Executing context ${action}...`).start();

  try {
    const { brand, format } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Context command', { action, brand });

    const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
    const contextPath = `${workspacePath}/data/context-state.json`;

    if (action === 'status') {
      if (await FileSystemUtils.fileExists(contextPath)) {
        const contextState = await FileSystemUtils.readJSON(contextPath);
        const stats = (contextState as any).stats;

        spinner.succeed(chalk.green('Context status retrieved'));

        if (format === 'json') {
          console.log(JSON.stringify(contextState, null, 2));
        } else {
          console.log('\n' + chalk.bold('Knowledge Context Status:'));
          console.log(chalk.cyan(`  Brand: ${brand}`));
          console.log(chalk.cyan(`  Total Files: ${stats.totalFiles}`));
          console.log(chalk.cyan(`  Processed: ${stats.processedFiles}`));
          console.log(chalk.cyan(`  Pending: ${stats.pendingFiles}`));
          console.log(chalk.cyan(`  Knowledge Entries: ${stats.totalKnowledge}`));
          console.log(chalk.cyan(`  Last Sync: ${(contextState as any).lastSync}`));
        }
      } else {
        spinner.warn(chalk.yellow('No context found'));
        console.log(`Run: brandos init --brand "${brand}"`);
      }
    } else {
      spinner.info(chalk.blue(`Action '${action}' not fully implemented yet`));
      console.log('Available actions: status, list, clear, sync');
    }

  } catch (error) {
    spinner.fail(chalk.red('Context command failed'));
    logger.error('Context command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
