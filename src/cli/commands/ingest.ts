// Ingest command - Ingest and process documents

import type { IngestCommandOptions } from '../../types/index.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { OracleClient } from '../../library/oracle-client.js';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { basename } from 'path';

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

    // Read file content
    const content = readFileSync(file, 'utf-8');
    const fileName = basename(file);

    // Index in ORACLE if requested
    let indexResult = null;
    if (index) {
      spinner.text = 'Indexing in ORACLE...';

      const oracle = new OracleClient();

      // Check if ORACLE is running
      const isHealthy = await oracle.isHealthy();

      if (!isHealthy) {
        spinner.warn(chalk.yellow('ORACLE service not running - skipping indexing'));
        console.log(chalk.yellow(`  Start ORACLE with: ${chalk.green('brandos oracle start')}`));
      } else {
        try {
          indexResult = await oracle.indexDocument(
            brand,
            fileName,
            content,
            {
              source: file,
              category: category || 'document',
              hash: hash.substring(0, 16),
              indexed_at: new Date().toISOString()
            }
          );

          spinner.text = 'Updating context state...';
        } catch (error) {
          spinner.warn(chalk.yellow('ORACLE indexing failed'));
          logger.error('ORACLE indexing error', error);
          console.log(chalk.yellow(`  Error: ${(error as Error).message}`));
        }
      }
    }

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

    if (indexResult) {
      console.log(chalk.cyan(`  ORACLE Indexed: ${chalk.green('Yes')}`));
      console.log(chalk.cyan(`    Chunks: ${indexResult.chunk_stats.count}`));
      console.log(chalk.cyan(`    Avg Length: ${indexResult.chunk_stats.avg_length} chars`));
      console.log(chalk.cyan(`    Total: ${indexResult.chunk_stats.total_chars.toLocaleString()} chars`));
    } else {
      console.log(chalk.cyan(`  ORACLE Indexed: ${index ? chalk.yellow('No (service not running)') : 'No'}`));
    }

  } catch (error) {
    spinner.fail(chalk.red('Ingestion failed'));
    logger.error('Ingest command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
