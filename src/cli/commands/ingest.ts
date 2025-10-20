// Ingest command - Ingest and process documents

import type { IngestCommandOptions } from '../../types/index.js';
import type { BrandConfiguration } from '../../types/brand-types.js';
import type { ContextState } from '../../types/context-types.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { IngestionService } from '../../ingestion/ingestion-service.js';
import { handleCommandError } from '../utils/error-handler.js';
import chalk from 'chalk';
import ora from 'ora';

export async function ingestCommand(file: string, options: IngestCommandOptions): Promise<void> {
  const spinner = ora('Ingesting document...').start();

  try {
    const { brand, index } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Ingest command', { file, brand });

    // Check file exists
    if (!(await FileSystemUtils.fileExists(file))) {
      throw new Error(`File not found: ${file}`);
    }

    // Load brand config
    const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
    const configPath = `${workspacePath}/brand-config.json`;
    let brandConfig: BrandConfiguration | undefined;

    try {
      brandConfig = await FileSystemUtils.readJSON<BrandConfiguration>(configPath);
    } catch {
      logger.warn('Brand config not found, research findings will not be stored');
    }

    // Use IngestionService for proper PDF/DOCX parsing
    const ingestionService = new IngestionService({ brandConfig });

    spinner.text = 'Parsing document...';

    const result = await ingestionService.ingestFile(file, {
      brand,
      indexInOracle: index,
      extractTables: true,
      preserveFormatting: false,
      storeFindings: true, // Always store findings if brand config available
    });

    if (!result.success) {
      throw new Error(`Ingestion failed: ${result.errors?.join(', ')}`);
    }

    spinner.text = 'Updating context state...';

    // Get indexing stats from result
    let indexResult = null;
    if (index && result.success) {
      // The IngestionService already indexed, extract stats from result
      indexResult = {
        chunk_stats: {
          count: Math.ceil(result.content.cleaned.length / 2000), // Approximate chunks
          avg_length: Math.min(2000, result.content.cleaned.length),
          total_chars: result.content.cleaned.length
        }
      };
    }

    // Update context state
    const contextPath = `${workspacePath}/data/context-state.json`;

    if (await FileSystemUtils.fileExists(contextPath)) {
      const contextState = await FileSystemUtils.readJSON<ContextState>(contextPath);
      contextState.stats.totalFiles += 1;
      contextState.stats.processedFiles += 1;
      await FileSystemUtils.writeJSON(contextPath, contextState);
    }

    spinner.succeed(chalk.green('Document ingested successfully!'));

    console.log('\n' + chalk.bold('Ingestion Complete:'));
    console.log(chalk.cyan(`  File: ${file}`));
    console.log(chalk.cyan(`  Brand: ${brand}`));
    console.log(chalk.cyan(`  Format: ${result.format}`));
    console.log(chalk.cyan(`  Category: ${result.category}`));
    console.log(chalk.cyan(`  Hash: ${result.fingerprint.sha256.substring(0, 16)}...`));
    console.log(chalk.cyan(`  Word Count: ${result.metadata.wordCount?.toLocaleString() || 'N/A'}`));
    console.log(chalk.cyan(`  Processing Time: ${result.processingTime}ms`));

    if (indexResult) {
      console.log(chalk.cyan(`  ORACLE Indexed: ${chalk.green('Yes')}`));
      console.log(chalk.cyan(`    Text Length: ${indexResult.chunk_stats.total_chars.toLocaleString()} chars`));
      console.log(chalk.cyan(`    Approx Chunks: ~${indexResult.chunk_stats.count}`));
    } else if (index) {
      console.log(chalk.cyan(`  ORACLE Indexed: ${chalk.yellow('No (service not running)')}`));
    } else {
      console.log(chalk.cyan(`  ORACLE Indexed: No`));
    }

  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Ingest command failed', normalizedError);
    handleCommandError('ingest', normalizedError, spinner);
  }
}
