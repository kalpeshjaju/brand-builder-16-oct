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

// Parse and execute
program.parse();
