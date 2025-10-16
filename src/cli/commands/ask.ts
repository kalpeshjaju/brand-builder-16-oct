// Ask command - Query brand intelligence

import type { AskCommandOptions } from '../../types/index.js';
import { LLMService } from '../../genesis/llm-service.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';

export async function askCommand(query: string, options: AskCommandOptions): Promise<void> {
  const spinner = ora('Processing your question...').start();

  try {
    const { brand, format } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Ask command', { brand, query });

    // Load context if available
    const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
    const contextPath = `${workspacePath}/data/context-state.json`;

    let context = '';
    if (await FileSystemUtils.fileExists(contextPath)) {
      const contextState = await FileSystemUtils.readJSON(contextPath);
      context = `Brand: ${brand}\nFiles indexed: ${(contextState as any).stats.totalFiles}`;
    } else {
      context = `Brand: ${brand}\nNote: No workspace found. Initialize with 'brandos init --brand "${brand}"'`;
    }

    // Use LLM to answer
    const llm = new LLMService();

    const systemPrompt = `You are a brand intelligence assistant for ${brand}.
Answer questions concisely and accurately based on available context.
If you don't have specific information, say so and provide general guidance.`;

    const fullQuery = `${context}\n\nQuestion: ${query}`;

    spinner.text = 'Generating answer...';
    const answer = await llm.prompt(fullQuery, systemPrompt);

    spinner.succeed(chalk.green('Answer generated'));

    if (format === 'json') {
      console.log(JSON.stringify({
        query,
        answer,
        brand,
        timestamp: new Date().toISOString(),
      }, null, 2));
    } else {
      console.log('\n' + chalk.bold('Question:'));
      console.log(chalk.cyan(query));
      console.log('\n' + chalk.bold('Answer:'));
      console.log(answer);
      console.log('');
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to process question'));
    logger.error('Ask command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
