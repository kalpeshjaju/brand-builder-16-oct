// Ask command - Query brand intelligence

import type { AskCommandOptions } from '../../types/index.js';
import { LLMService } from '../../genesis/llm-service.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { OracleClient } from '../../library/oracle-client.js';
import chalk from 'chalk';
import ora from 'ora';

export async function askCommand(query: string, options: AskCommandOptions): Promise<void> {
  const spinner = ora('Processing your question...').start();

  try {
    const { brand, format } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    // Early API key validation (fail fast)
    if (!process.env['ANTHROPIC_API_KEY']) {
      spinner.fail(chalk.red('API key not found'));
      throw new Error(
        'ANTHROPIC_API_KEY is not set in environment variables.\n' +
        'Fix: Set ANTHROPIC_API_KEY in your .env file or environment.'
      );
    }

    logger.info('Ask command', { brand, query });

    // Try to retrieve relevant context from ORACLE
    let context = '';
    const oracle = new OracleClient();

    spinner.text = 'Retrieving relevant context from ORACLE...';

    try {
      const isHealthy = await oracle.isHealthy();

      if (isHealthy) {
        // Query ORACLE for relevant context
        const oracleContext = await oracle.getContext(brand, query, 4000);

        if (oracleContext && oracleContext.context) {
          context = `Brand: ${brand}\n\nRelevant information from knowledge base:\n${oracleContext.context}`;
          logger.info('ORACLE context retrieved', {
            sources: oracleContext.num_sources,
            chars: oracleContext.total_chars
          });
        } else {
          logger.warn('No context found in ORACLE', { brand });
          context = `Brand: ${brand}\nNote: No relevant information found in knowledge base.`;
        }
      } else {
        logger.warn('ORACLE service not running');
        context = `Brand: ${brand}\nNote: ORACLE service not available. Start it with: brandos oracle start`;
      }
    } catch (oracleError) {
      logger.warn('ORACLE query failed', { error: (oracleError as Error).message });
      // Fallback to basic context
      const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
      const contextPath = `${workspacePath}/data/context-state.json`;

      if (await FileSystemUtils.fileExists(contextPath)) {
        const contextState = await FileSystemUtils.readJSON(contextPath);
        context = `Brand: ${brand}\nFiles indexed: ${(contextState as any).stats.totalFiles}\nNote: Could not retrieve specific content.`;
      } else {
        context = `Brand: ${brand}\nNote: No workspace found. Initialize with 'brandos init --brand "${brand}"'`;
      }
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
