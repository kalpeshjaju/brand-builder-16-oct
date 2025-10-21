// Init command - Initialize a brand workspace

interface InitCommandOptions {
  brand: string;
  industry?: string;
  category?: string;
  output?: string;
}

import path from 'path';
import { WorkspaceManager } from '../../context/workspace-manager.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { sanitizeBrandName, sanitizeOptionalText } from '../../validation/input-schemas.js';
import { handleCommandError } from '../utils/error-handler.js';
import chalk from 'chalk';
import ora from 'ora';

export async function initCommand(options: InitCommandOptions): Promise<void> {
  const brand = sanitizeBrandName(options.brand);
  const industry = sanitizeOptionalText(options.industry);
  const category = sanitizeOptionalText(options.category);

  const spinner = ora('Initializing brand workspace...').start();

  try {
    logger.info('Initializing workspace', { brand, industry, category });

    // Create workspace directories using the manager
    const workspaceManager = new WorkspaceManager(brand);
    await workspaceManager.ensureBrandWorkspace();
    const workspacePath = workspaceManager.brandRoot;

    // Create brand configuration
    const config = {
      brandName: brand,
      industry: industry ?? 'Not specified',
      category: category ?? 'Not specified',
      projectObjectives: {
        primary: 'Transform brand through AI-powered intelligence',
        goals: [
          'Build comprehensive brand strategy',
          'Ensure quality through validation',
          'Leverage semantic intelligence',
        ],
      },
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    };

    await FileSystemUtils.writeJSON(path.join(workspacePath, 'brand-config.json'), config);

    // Create initial context state
    const contextState = {
      brandName: brand,
      workspace: workspacePath,
      files: [],
      knowledge: [],
      version: 1,
      lastSync: new Date().toISOString(),
      stats: {
        totalFiles: 0,
        processedFiles: 0,
        pendingFiles: 0,
        totalKnowledge: 0,
      },
    };

    await FileSystemUtils.writeJSON(path.join(workspaceManager.getPath('db'), 'context-state.json'), contextState);

    spinner.succeed(chalk.green('Workspace initialized successfully!'));

    console.log('\n' + chalk.bold('Brand Workspace Created:'));
    console.log(chalk.cyan(`  Location: ${workspacePath}`));
    console.log(chalk.cyan(`  Brand: ${brand}`));
    if (industry) console.log(chalk.cyan(`  Industry: ${industry}`));
    if (category) console.log(chalk.cyan(`  Category: ${category}`));

    console.log('\n' + chalk.bold('Next Steps:'));
    console.log('  1. Add documents to inputs/, resources/, or documents/ folders');
    console.log(`  2. Run: ${chalk.green(`brandos ask "your question" --brand "${brand}"`)}`);
    console.log(`  3. Run: ${chalk.green(`brandos generate --brand "${brand}"`)}`);
    console.log(`  4. Run: ${chalk.green(`brandos context status --brand "${brand}"`)}`);

  } catch (error) {
    handleCommandError('init', error, spinner);
  }
}
