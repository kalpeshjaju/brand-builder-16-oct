// Oracle command - Manage ORACLE semantic search service

import { OracleClient } from '../../library/oracle-client.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { platform } from 'os';

const client = new OracleClient();

/**
 * Start ORACLE service
 */
export async function startOracleCommand(): Promise<void> {
  console.log(chalk.bold('\n🚀 Starting ORACLE service...\n'));

  const spinner = ora('Checking if service is already running...').start();

  // Check if already running
  const isRunning = await client.isHealthy();
  if (isRunning) {
    spinner.succeed(chalk.green('Service is already running!'));
    console.log(chalk.cyan(`\n📍 Service URL: ${client.getBaseUrl()}`));
    console.log(chalk.cyan(`📚 API Docs: ${client.getBaseUrl()}/docs\n`));
    return;
  }

  spinner.text = 'Starting Python service...';

  try {
    const oracleDir = FileSystemUtils.resolvePath('oracle-service');

    // Check if oracle-service directory exists
    if (!await FileSystemUtils.fileExists(`${oracleDir}/main.py`)) {
      spinner.fail(chalk.red('oracle-service directory not found'));
      console.error(chalk.red('\nError: oracle-service/main.py not found'));
      console.log(chalk.yellow('Fix: Ensure oracle-service directory is present in project root'));
      process.exit(1);
    }

    // Determine Python command
    const pythonCmd = platform() === 'win32' ? 'python' : 'python3';

    // Start service in background
    const childProcess = spawn(pythonCmd, ['main.py'], {
      cwd: oracleDir,
      detached: true,
      stdio: 'ignore'
    });

    childProcess.unref();

    // Wait for service to be ready (max 30 seconds)
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      spinner.text = `Waiting for service to start (${attempts}/${maxAttempts})...`;

      if (await client.isHealthy()) {
        spinner.succeed(chalk.green('ORACLE service started successfully!'));

        const info = await client.getServiceInfo();
        console.log(chalk.bold('\n📦 Service Information:'));
        console.log(chalk.cyan(`  Version: ${info.version}`));
        console.log(chalk.cyan(`  Embedding Model: ${info.embedding_model.name}`));
        console.log(chalk.cyan(`  Embedding Dimension: ${info.embedding_model.dimension}`));
        if (info.reranker_model) {
          console.log(chalk.cyan(`  Reranker: ${info.reranker_model.name}`));
        }

        console.log(chalk.bold('\n📍 Endpoints:'));
        console.log(chalk.cyan(`  Service: ${client.getBaseUrl()}`));
        console.log(chalk.cyan(`  API Docs: ${client.getBaseUrl()}/docs`));
        console.log(chalk.cyan(`  Health: ${client.getBaseUrl()}/api/v1/health`));

        console.log(chalk.bold('\n✅ Ready for semantic search!\n'));
        return;
      }
    }

    spinner.fail(chalk.red('Service failed to start within timeout'));
    console.error(chalk.red('\nService did not respond after 30 seconds'));
    console.log(chalk.yellow('Fix: Check oracle-service logs for errors'));
    console.log(chalk.yellow('Try: cd oracle-service && python3 main.py (to see logs)'));
    process.exit(1);

  } catch (error) {
    spinner.fail(chalk.red('Failed to start service'));
    logger.error('Start ORACLE failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    console.log(chalk.yellow('\nTroubleshooting:'));
    console.log('  1. Ensure Python 3.10+ is installed');
    console.log('  2. Install dependencies: cd oracle-service && pip install -r requirements.txt');
    console.log('  3. Check port 8765 is not in use');
    process.exit(1);
  }
}

/**
 * Stop ORACLE service
 */
export async function stopOracleCommand(): Promise<void> {
  console.log(chalk.bold('\n🔒 Stopping ORACLE service...\n'));

  const spinner = ora('Checking service status...').start();

  const isRunning = await client.isHealthy();

  if (!isRunning) {
    spinner.info(chalk.yellow('Service is not running'));
    return;
  }

  spinner.text = 'Stopping service...';

  // TODO: Implement graceful shutdown endpoint
  // For now, user needs to manually stop (Ctrl+C in service terminal)

  spinner.warn(chalk.yellow('Manual stop required'));
  console.log(chalk.yellow('\nTo stop the service:'));
  console.log('  1. Find the Python process running main.py');
  console.log('  2. Press Ctrl+C in the terminal running the service');
  console.log('  3. Or use: pkill -f "python.*main.py"');
  console.log();
}

/**
 * Check ORACLE service status
 */
export async function statusOracleCommand(): Promise<void> {
  const spinner = ora('Checking ORACLE service status...').start();

  try {
    const isHealthy = await client.isHealthy();

    if (!isHealthy) {
      spinner.fail(chalk.red('Service is NOT running'));
      console.log(chalk.yellow(`\nStart with: ${chalk.green('brandos oracle start')}\n`));
      return;
    }

    spinner.succeed(chalk.green('Service is running'));

    const info = await client.getServiceInfo();

    console.log(chalk.bold('\n📊 Service Status:\n'));
    console.log(chalk.cyan(`  Status: ${chalk.green('● Running')}`));
    console.log(chalk.cyan(`  Version: ${info.version}`));
    console.log(chalk.cyan(`  URL: ${client.getBaseUrl()}`));

    console.log(chalk.bold('\n🤖 Models:\n'));
    console.log(chalk.cyan(`  Embedding: ${info.embedding_model.name}`));
    console.log(chalk.cyan(`  Dimension: ${info.embedding_model.dimension}`));
    console.log(chalk.cyan(`  Max Sequence: ${info.embedding_model.max_seq_length}`));

    if (info.reranker_model) {
      console.log(chalk.cyan(`  Reranker: ${info.reranker_model.name}`));
    }

    console.log(chalk.bold('\n⚙️  Configuration:\n'));
    console.log(chalk.cyan(`  Chunk Size: ${info.config.chunk_size}`));
    console.log(chalk.cyan(`  Chunk Overlap: ${info.config.chunk_overlap}`));
    console.log(chalk.cyan(`  Default Top-K: ${info.config.default_top_k}`));
    console.log(chalk.cyan(`  Use Reranker: ${info.config.use_reranker ? 'Yes' : 'No'}`));

    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to get service status'));
    logger.error('Status check failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

/**
 * Reindex all documents for a brand
 */
export async function reindexOracleCommand(options: { brand: string }): Promise<void> {
  const { brand } = options;
  const spinner = ora('Reindexing documents...').start();

  try {
    // Check if service is running
    if (!await client.isHealthy()) {
      throw new Error('ORACLE service is not running. Start it with: brandos oracle start');
    }

    // Get current stats
    const statsBefore = await client.getStats(brand);

    spinner.text = `Clearing ${statsBefore.total_chunks} existing chunks...`;

    // Clear existing data
    const clearResult = await client.clearAll(brand);

    spinner.succeed(chalk.green(`Cleared ${clearResult.deleted} chunks`));

    console.log(chalk.bold('\n📝 To reindex documents:\n'));
    console.log(`  1. Use: ${chalk.green(`brandos ingest <file> --brand ${brand}`)}`);
    console.log(`  2. Or process all files in workspace`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Reindex failed'));
    logger.error('Reindex failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

/**
 * Search documents using ORACLE
 */
export async function searchOracleCommand(
  query: string,
  options: { brand?: string; topK?: string; noRerank?: boolean }
): Promise<void> {
  const spinner = ora('Searching...').start();

  try {
    // Check if service is running
    if (!await client.isHealthy()) {
      throw new Error('ORACLE service is not running. Start it with: brandos oracle start');
    }

    // Get brand from options or config
    const brand = options.brand || 'default';
    const topK = options.topK ? parseInt(options.topK) : 5;

    const results = await client.search(brand, query, {
      topK,
      useReranking: !options.noRerank
    });

    spinner.stop();

    if (results.length === 0) {
      console.log(chalk.yellow('\n⚠️  No results found'));
      console.log(chalk.dim('  Try indexing documents first with: brandos ingest <file>\n'));
      return;
    }

    console.log(chalk.bold(`\n🔍 Search Results (${results.length}):\n`));

    for (const result of results) {
      console.log(chalk.cyan(`${result.rank}. Score: ${(result.score * 100).toFixed(1)}%`) +
        (result.rerank_score ? chalk.dim(` (rerank: ${result.rerank_score.toFixed(3)})`) : ''));

      // Show first 200 chars of text
      const preview = result.text.length > 200
        ? result.text.substring(0, 200) + '...'
        : result.text;

      console.log(chalk.white(`   ${preview.replace(/\n/g, ' ')}`));

      // Show metadata if available
      if (result.metadata['doc_id']) {
        console.log(chalk.dim(`   Source: ${result.metadata['doc_id']}`));
      }

      console.log();
    }

  } catch (error) {
    spinner.fail(chalk.red('Search failed'));
    logger.error('Search failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

/**
 * Get statistics for a brand
 */
export async function statsOracleCommand(options: { brand: string }): Promise<void> {
  const spinner = ora('Loading statistics...').start();

  try {
    // Check if service is running
    if (!await client.isHealthy()) {
      throw new Error('ORACLE service is not running. Start it with: brandos oracle start');
    }

    const stats = await client.getStats(options.brand);

    spinner.succeed(chalk.green('Statistics loaded'));

    console.log(chalk.bold(`\n📊 ORACLE Statistics: ${stats.brand}\n`));
    console.log(chalk.cyan(`  Collection: ${stats.collection_name}`));
    console.log(chalk.cyan(`  Total Chunks: ${stats.total_chunks.toLocaleString()}`));
    console.log(chalk.cyan(`  Documents (sample): ${stats.sample_doc_count}`));
    console.log(chalk.cyan(`  Embedding Dimension: ${stats.embedding_dimension}`));
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to get statistics'));
    logger.error('Stats failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}
