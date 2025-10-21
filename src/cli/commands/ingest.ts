// src/cli/commands/ingest.ts

import { Command } from 'commander';
import { handleCommandError } from '../utils/error-handler.js';
import { OracleClient } from '../../oracle/oracle-client.js';
import { MarkdownParser } from '../../ingestion/parsers/markdown-parser.js';
import ora from 'ora';
import { randomUUID } from 'crypto';

export const ingestCommand = new Command('ingest')
  .description('Ingest a document into the brand knowledge base')
  .requiredOption('--file <path>', 'Path to the document to ingest')
  .action(async (options) => {
    const spinner = ora('Ingesting document...').start();
    try {
      const oracle = new OracleClient();
      const parser = new MarkdownParser();

      const content = await parser.parse(options.file);
      const id = randomUUID();

      await oracle.addDocument({
        id,
        document: content,
        metadata: {
          source: options.file,
        },
      });

      oracle.close();
      spinner.succeed(`Document ingested successfully with ID: ${id}`);
    } catch (error) {
      handleCommandError('ingest', error, spinner);
    }
  });