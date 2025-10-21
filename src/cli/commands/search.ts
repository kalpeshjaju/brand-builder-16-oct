// src/cli/commands/search.ts

import { Command } from 'commander';
import { handleCommandError } from '../utils/error-handler.js';
import { OracleClient } from '../../oracle/oracle-client.js';
import ora from 'ora';
import chalk from 'chalk';

export const searchCommand = new Command('search')
  .description('Search the brand knowledge base')
  .requiredOption('-q, --query <text>', 'Search query')
  .option('-n, --top-n <number>', 'Number of results to return', '5')
  .action(async (options) => {
    const spinner = ora('Searching knowledge base...').start();
    try {
      const oracle = new OracleClient();

      const results = await oracle.search({
        query: options.query,
        n_results: parseInt(options.topN, 10),
      });

      oracle.close();
      spinner.succeed('Search complete.');

      console.log(chalk.bold('\nSearch Results:'));
      console.log(results); // TODO: Format this output nicely

    } catch (error) {
      handleCommandError('search', error, spinner);
    }
  });
