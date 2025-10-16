#!/usr/bin/env node

// Brand Builder Pro CLI - Main entry point

import { Command } from 'commander';
import { config } from 'dotenv';
import { initCommand } from './commands/init.js';
import { askCommand } from './commands/ask.js';
import { generateCommand } from './commands/generate.js';
import { auditCommand } from './commands/audit.js';
import { contextCommand } from './commands/context.js';
import { ingestCommand } from './commands/ingest.js';
import { evolveCommand } from './commands/evolve.js';
import {
  listPromptsCommand,
  showPromptCommand,
  createPromptCommand,
  updatePromptCommand,
  activatePromptCommand,
  rollbackPromptCommand,
  historyPromptCommand,
  statsPromptCommand,
  deletePromptCommand,
} from './commands/prompts.js';
import {
  startOracleCommand,
  stopOracleCommand,
  statusOracleCommand,
  reindexOracleCommand,
  searchOracleCommand,
  statsOracleCommand,
} from './commands/oracle.js';

// Load environment variables
config();

const program = new Command();

program
  .name('brandos')
  .description('Brand Builder Pro - CLI-First Brand Intelligence Operating System')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize a brand workspace')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .option('-i, --industry <type>', 'Industry')
  .option('-c, --category <type>', 'Category')
  .option('--interactive', 'Interactive mode')
  .action(initCommand);

// Ask command
program
  .command('ask <query>')
  .description('Ask a question about your brand')
  .option('-b, --brand <name>', 'Brand name')
  .option('-s, --strategy <type>', 'Search strategy (fast|balanced|precision)', 'balanced')
  .option('-n, --sources <number>', 'Number of sources', '5')
  .option('-f, --format <type>', 'Output format (text|json)', 'text')
  .action(askCommand);

// Generate command
program
  .command('generate')
  .description('Generate brand strategy')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .option('-m, --mode <type>', 'Mode (fast|professional|research)', 'professional')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <type>', 'Output format (json|markdown|both)', 'markdown')
  .action(generateCommand);

// Audit command
program
  .command('audit')
  .description('Audit brand strategy quality')
  .requiredOption('-i, --input <path>', 'Input strategy file')
  .option('-o, --output <path>', 'Output audit report path')
  .option('-m, --mode <type>', 'Audit mode (quick|standard|comprehensive)', 'standard')
  .option('-f, --format <type>', 'Output format (json|markdown|both)', 'markdown')
  .action(auditCommand);

// Context command
program
  .command('context <action>')
  .description('Manage knowledge context (status|list|clear|sync)')
  .option('-b, --brand <name>', 'Brand name')
  .option('-c, --category <type>', 'File category filter')
  .option('-f, --format <type>', 'Output format (table|json)', 'table')
  .action(contextCommand);

// Ingest command
program
  .command('ingest <file>')
  .description('Ingest and process a document')
  .option('-b, --brand <name>', 'Brand name')
  .option('-c, --category <type>', 'File category (input|resource|document)')
  .option('--extract', 'Extract facts', true)
  .option('--index', 'Create index', true)
  .action(ingestCommand);

// Evolve command (Brand Evolution Workshop)
program.addCommand(evolveCommand);

// Prompts command group
const promptsCmd = program
  .command('prompts')
  .description('Manage prompt templates and versions');

// prompts list
promptsCmd
  .command('list')
  .description('List all prompts')
  .option('-c, --category <type>', 'Filter by category (generation|analysis|qa|audit|research|synthesis)')
  .action(listPromptsCommand);

// prompts show
promptsCmd
  .command('show <id>')
  .description('Show prompt details')
  .option('-v, --version <version>', 'Specific version')
  .action(showPromptCommand);

// prompts create
promptsCmd
  .command('create')
  .description('Create a new prompt from template file')
  .requiredOption('-t, --template <path>', 'Template JSON file path')
  .action(createPromptCommand);

// prompts update
promptsCmd
  .command('update <id>')
  .description('Update a prompt (creates new version)')
  .requiredOption('-c, --changes <description>', 'Description of changes')
  .option('-a, --author <name>', 'Author name')
  .option('-t, --template <path>', 'Template file with updates')
  .action(updatePromptCommand);

// prompts activate
promptsCmd
  .command('activate <id> <version>')
  .description('Set a version as active')
  .action(activatePromptCommand);

// prompts rollback
promptsCmd
  .command('rollback <id> <version>')
  .description('Rollback to a previous version')
  .action(rollbackPromptCommand);

// prompts history
promptsCmd
  .command('history <id>')
  .description('Show version history')
  .action(historyPromptCommand);

// prompts stats
promptsCmd
  .command('stats <id>')
  .description('Show usage statistics')
  .action(statsPromptCommand);

// prompts delete
promptsCmd
  .command('delete <id> <version>')
  .description('Delete a specific version')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(deletePromptCommand);

// Oracle command group
const oracleCmd = program
  .command('oracle')
  .description('Manage ORACLE semantic search service');

// oracle start
oracleCmd
  .command('start')
  .description('Start ORACLE service')
  .action(startOracleCommand);

// oracle stop
oracleCmd
  .command('stop')
  .description('Stop ORACLE service')
  .action(stopOracleCommand);

// oracle status
oracleCmd
  .command('status')
  .description('Check ORACLE service status')
  .action(statusOracleCommand);

// oracle reindex
oracleCmd
  .command('reindex')
  .description('Reindex all documents for a brand')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .action(reindexOracleCommand);

// oracle search
oracleCmd
  .command('search <query>')
  .description('Search indexed documents')
  .option('-b, --brand <name>', 'Brand name')
  .option('-k, --top-k <number>', 'Number of results', '5')
  .option('--no-rerank', 'Disable reranking')
  .action(searchOracleCommand);

// oracle stats
oracleCmd
  .command('stats')
  .description('Show collection statistics')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .action(statsOracleCommand);

// Parse and execute
program.parse();
