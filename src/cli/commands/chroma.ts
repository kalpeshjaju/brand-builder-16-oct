/**
 * FILE PURPOSE: ChromaDB management commands for direct vector store operations
 *
 * CONTEXT: Provides CLI commands to update, delete, and list documents in ChromaDB
 * via the oracle_bridge.py Python bridge. This enables correction of incorrect data
 * and management of the vector knowledge base.
 *
 * DEPENDENCIES: OracleClient (oracle/oracle-client.ts), oracle_bridge.py
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-10-22
 */

import { OracleClient } from '../../oracle/oracle-client.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Update an existing document in ChromaDB
 *
 * WHY: Allows correction of indexed data that contains errors
 * HOW: Sends update command to ChromaDB via Python bridge
 *
 * @param {string} id - Document ID to update
 * @param {string} document - New document text content
 * @param {Record<string, unknown>} metadata - Updated metadata
 *
 * EXAMPLE:
 * ```bash
 * npm run dev chroma update -- --id "competitor-x-2025-10-15" --document "Corrected text" --metadata '{"source":"manual"}'
 * ```
 */
export async function updateDocumentCommand(options: {
  id: string;
  document: string;
  metadata?: string;
}): Promise<void> {
  const spinner = ora('Updating document in ChromaDB...').start();
  const client = new OracleClient();

  try {
    // Parse metadata if provided
    const metadata = options.metadata
      ? JSON.parse(options.metadata)
      : {};

    const result = await client.updateDocument({
      id: options.id,
      document: options.document,
      metadata,
    });

    if (result.status === 'success') {
      spinner.succeed(chalk.green(`Document updated: ${result.id}`));
      logger.info('Document updated', { id: result.id });
    } else {
      throw new Error('Update failed');
    }

  } catch (error) {
    spinner.fail(chalk.red('Update failed'));
    logger.error('Update document failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  } finally {
    client.close();
  }
}

/**
 * Delete a document from ChromaDB
 *
 * WHY: Remove incorrect or outdated data from the knowledge base
 * HOW: Sends delete command to ChromaDB via Python bridge
 *
 * @param {string} id - Document ID to delete
 *
 * EXAMPLE:
 * ```bash
 * npm run dev chroma delete -- --id "competitor-x-2025-10-15"
 * ```
 */
export async function deleteDocumentCommand(options: {
  id: string;
}): Promise<void> {
  const spinner = ora('Deleting document from ChromaDB...').start();
  const client = new OracleClient();

  try {
    const result = await client.deleteDocument({
      id: options.id,
    });

    if (result.status === 'success') {
      spinner.succeed(chalk.green(`Document deleted: ${result.id}`));
      logger.info('Document deleted', { id: result.id });
    } else {
      throw new Error('Delete failed');
    }

  } catch (error) {
    spinner.fail(chalk.red('Delete failed'));
    logger.error('Delete document failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  } finally {
    client.close();
  }
}

/**
 * List all documents in ChromaDB
 *
 * WHY: View what's currently indexed in the knowledge base
 * HOW: Retrieves documents from ChromaDB via Python bridge
 *
 * @param {number} limit - Maximum number of documents to list (default: 10)
 *
 * EXAMPLE:
 * ```bash
 * npm run dev chroma list -- --limit 20
 * ```
 */
export async function listDocumentsCommand(options: {
  limit?: string;
}): Promise<void> {
  const spinner = ora('Listing documents from ChromaDB...').start();
  const client = new OracleClient();

  try {
    const limit = options.limit ? parseInt(options.limit, 10) : 10;

    if (isNaN(limit) || limit < 1) {
      throw new Error('Limit must be a positive number');
    }

    const result = await client.listDocuments({ limit });

    if (result.status === 'success' && result.results) {
      spinner.succeed(chalk.green(`Found ${result.results.ids.length} documents`));

      console.log(chalk.bold('\n📚 Documents in ChromaDB:\n'));

      for (let i = 0; i < result.results.ids.length; i++) {
        const id = result.results.ids[i];
        const doc = result.results.documents[i];
        const metadata = result.results.metadatas[i];

        console.log(chalk.cyan(`${i + 1}. ID: ${id}`));

        // Show first 100 chars of document
        if (doc) {
          const preview = doc.length > 100
            ? doc.substring(0, 100) + '...'
            : doc;
          console.log(chalk.white(`   Text: ${preview.replace(/\n/g, ' ')}`));
        }

        // Show metadata
        if (metadata && Object.keys(metadata).length > 0) {
          console.log(chalk.dim(`   Metadata: ${JSON.stringify(metadata)}`));
        }
        console.log();
      }

      console.log(chalk.dim(`Showing ${result.results.ids.length} of total documents\n`));

    } else {
      spinner.info(chalk.yellow('No documents found'));
    }

  } catch (error) {
    spinner.fail(chalk.red('List failed'));
    logger.error('List documents failed', error);
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  } finally {
    client.close();
  }
}
