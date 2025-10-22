/**
 * FILE PURPOSE: Ingest documents into ChromaDB knowledge base
 *
 * CONTEXT: Parses various file formats (PDF, DOCX, HTML, etc.) and indexes them
 * in ChromaDB for semantic search. Supports chunking for large files.
 *
 * DEPENDENCIES: OracleClient, file parsers, commander
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-10-22
 */

import { Command } from 'commander';
import { handleCommandError } from '../utils/error-handler.js';
import { OracleClient } from '../../oracle/oracle-client.js';
import { getParser } from '../../ingestion/parsers/index.js';
import { HTMLParser } from '../../ingestion/parsers/html-parser.js';
import ora from 'ora';
import { randomUUID } from 'crypto';
import path from 'path';
import chalk from 'chalk';

export const ingestCommand = new Command('ingest')
  .description('Ingest a document into the brand knowledge base')
  .requiredOption('--file <path>', 'Path to the document to ingest')
  .option('--brand <name>', 'Brand name (for metadata)')
  .option('--chunk-size <number>', 'Chunk size for large files (default: 2000)', '2000')
  .option('--chunk-overlap <number>', 'Overlap between chunks (default: 200)', '200')
  .action(async (options) => {
    const spinner = ora('Ingesting document...').start();
    try {
      const oracle = new OracleClient();
      const filePath = options.file;
      const brand = options.brand || 'default';
      const chunkSize = parseInt(options.chunkSize, 10);
      const chunkOverlap = parseInt(options.chunkOverlap, 10);

      // STEP 1: Determine file type from extension
      const ext = path.extname(filePath).toLowerCase().slice(1);
      const parser = getParser(ext as any);

      if (!parser) {
        throw new Error(`Unsupported file format: ${ext}\nSupported: pdf, docx, html, txt, md, json, csv`);
      }

      spinner.text = `Parsing ${ext.toUpperCase()} file...`;

      // STEP 2: Parse the file
      const content = await parser.parse(filePath);

      // STEP 3: Handle chunking for large files (especially HTML)
      let chunks: string[];
      if (parser instanceof HTMLParser && content.cleaned.length > chunkSize) {
        spinner.text = `File is large (${content.cleaned.length} chars), chunking...`;
        chunks = parser.chunkContent(content.cleaned, chunkSize, chunkOverlap);
        spinner.text = `Split into ${chunks.length} chunks, indexing...`;
      } else {
        chunks = [content.cleaned];
      }

      // STEP 4: Index each chunk in ChromaDB
      const docIds: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const id = chunks.length > 1
          ? `${path.basename(filePath)}-chunk-${i + 1}-${randomUUID().slice(0, 8)}`
          : `${path.basename(filePath)}-${randomUUID().slice(0, 8)}`;

        await oracle.addDocument({
          id,
          document: chunks[i] || '',
          metadata: {
            source: filePath,
            brand,
            chunk: i + 1,
            totalChunks: chunks.length,
            fileType: ext,
          },
        });

        docIds.push(id);
      }

      oracle.close();

      // STEP 5: Report success
      spinner.succeed(chalk.green('Document ingested successfully!'));

      console.log(chalk.bold('\n📄 Ingestion Summary:\n'));
      console.log(chalk.cyan(`  File: ${path.basename(filePath)}`));
      console.log(chalk.cyan(`  Type: ${ext.toUpperCase()}`));
      console.log(chalk.cyan(`  Brand: ${brand}`));
      console.log(chalk.cyan(`  Chunks: ${chunks.length}`));
      console.log(chalk.cyan(`  Total Characters: ${content.cleaned.length.toLocaleString()}`));

      if (docIds.length <= 5) {
        console.log(chalk.bold('\n📋 Document IDs:\n'));
        docIds.forEach(id => console.log(chalk.dim(`  - ${id}`)));
      } else {
        console.log(chalk.bold('\n📋 Document IDs (first 3):\n'));
        docIds.slice(0, 3).forEach(id => console.log(chalk.dim(`  - ${id}`)));
        console.log(chalk.dim(`  ... and ${docIds.length - 3} more`));
      }

      console.log(chalk.bold('\n✅ Ready for semantic search!\n'));
      console.log(chalk.yellow(`Try: npm run dev chroma list -- --limit 10\n`));

    } catch (error) {
      handleCommandError('ingest', error, spinner);
    }
  });