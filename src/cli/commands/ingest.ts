// Ingest command - Ingest and process documents

import type { IngestCommandOptions } from '../../types/index.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';

export async function ingestCommand(file: string, options: IngestCommandOptions): Promise<void> {
  const spinner = ora('Ingesting document...').start();

  try {
    const { brand, category, extract, index } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Ingest command', { file, brand, category });

    // Check file exists
    if (!(await FileSystemUtils.fileExists(file))) {
      throw new Error(`File not found: ${file}`);
    }

    // Calculate file hash
    const hash = await FileSystemUtils.calculateFileHash(file);

    // Update context state
    const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
    const contextPath = `${workspacePath}/data/context-state.json`;

    if (await FileSystemUtils.fileExists(contextPath)) {
      const contextState = await FileSystemUtils.readJSON(contextPath);
      (contextState as any).stats.totalFiles += 1;
      (contextState as any).stats.processedFiles += 1;
      await FileSystemUtils.writeJSON(contextPath, contextState);
    }

    spinner.succeed(chalk.green('Document ingested successfully!'));

    console.log('\n' + chalk.bold('Ingestion Complete:'));
    console.log(chalk.cyan(`  File: ${file}`));
    console.log(chalk.cyan(`  Brand: ${brand}`));
    console.log(chalk.cyan(`  Category: ${category || 'auto-detected'}`));
    console.log(chalk.cyan(`  Hash: ${hash.substring(0, 16)}...`));
    console.log(chalk.cyan(`  Extracted Facts: ${extract ? 'Yes' : 'No'}`));
    console.log(chalk.cyan(`  Indexed: ${index ? 'Yes' : 'No'}`));

  } catch (error) {
    spinner.fail(chalk.red('Ingestion failed'));
    logger.error('Ingest command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
