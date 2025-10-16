// Prompts command - Manage prompt templates and versions

import type { PromptTemplate, PromptCategory } from '../../types/prompt-types.js';
import { PromptRegistry } from '../../genesis/prompt-registry.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';

const registry = new PromptRegistry();

/**
 * List all prompts (optionally filter by category)
 */
export async function listPromptsCommand(options: { category?: string }): Promise<void> {
  const spinner = ora('Loading prompts...').start();

  try {
    await registry.initialize();

    const category = options.category as PromptCategory | undefined;
    const prompts = await registry.listPrompts(category);

    spinner.stop();

    if (prompts.length === 0) {
      console.log(chalk.yellow('No prompts found.'));
      console.log(`\nCreate a new prompt with: ${chalk.green('brandos prompts create --template <file>')}`);
      return;
    }

    console.log(chalk.bold(`\n📋 Prompts${category ? ` (${category})` : ''}: ${prompts.length}\n`));

    // Group by category
    const byCategory = prompts.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category]!.push(p);
      return acc;
    }, {} as Record<string, PromptTemplate[]>);

    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(chalk.cyan.bold(`\n${cat.toUpperCase()}:`));
      for (const prompt of items) {
        const active = prompt.active ? chalk.green('●') : chalk.gray('○');
        const usage = prompt.usageCount > 0 ? chalk.dim(` (used ${prompt.usageCount}x)`) : '';
        console.log(`  ${active} ${chalk.white(prompt.name)} ${chalk.dim(`v${prompt.version}`)}${usage}`);
        console.log(`    ${chalk.dim(prompt.description)}`);
      }
    }

    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to list prompts'));
    logger.error('List prompts failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Show details of a specific prompt
 */
export async function showPromptCommand(id: string, options: { version?: string }): Promise<void> {
  const spinner = ora('Loading prompt...').start();

  try {
    await registry.initialize();

    const prompt = await registry.getPrompt(id, options.version);

    spinner.stop();

    console.log(chalk.bold(`\n📝 ${prompt.name}`));
    console.log(chalk.dim(`   ID: ${prompt.id} | Version: ${prompt.version} | Category: ${prompt.category}`));
    console.log(chalk.dim(`   Author: ${prompt.author} | Created: ${new Date(prompt.createdAt).toLocaleDateString()}`));
    console.log();

    console.log(chalk.cyan('Description:'));
    console.log(`  ${prompt.description}`);
    console.log();

    console.log(chalk.cyan('System Prompt:'));
    console.log(chalk.dim(`  ${prompt.systemPrompt.substring(0, 200)}${prompt.systemPrompt.length > 200 ? '...' : ''}`));
    console.log();

    console.log(chalk.cyan('User Prompt Template:'));
    console.log(chalk.dim(`  ${prompt.userPromptTemplate.substring(0, 200)}${prompt.userPromptTemplate.length > 200 ? '...' : ''}`));
    console.log();

    if (prompt.variables && prompt.variables.length > 0) {
      console.log(chalk.cyan('Variables:'));
      for (const v of prompt.variables) {
        const req = v.required ? chalk.red('*') : '';
        console.log(`  ${req}{{${v.name}}} ${chalk.dim(`(${v.type})`)} - ${v.description}`);
        if (v.example) console.log(chalk.dim(`    Example: ${v.example}`));
      }
      console.log();
    }

    console.log(chalk.cyan('Configuration:'));
    console.log(`  Temperature: ${prompt.temperature}`);
    console.log(`  Max Tokens: ${prompt.maxTokens}`);
    if (prompt.seed) console.log(`  Seed: ${prompt.seed}`);
    console.log();

    console.log(chalk.cyan('Usage:'));
    console.log(`  Used: ${prompt.usageCount} times`);
    if (prompt.lastUsed) console.log(`  Last Used: ${new Date(prompt.lastUsed).toLocaleString()}`);
    if (prompt.avgConfidence) console.log(`  Avg Confidence: ${(prompt.avgConfidence * 100).toFixed(1)}%`);
    console.log();

    if (prompt.changelog && prompt.changelog.length > 0) {
      console.log(chalk.cyan('Changelog:'));
      prompt.changelog.slice(-3).forEach(change => {
        console.log(`  • ${change}`);
      });
      console.log();
    }

    console.log(chalk.dim(`Status: ${prompt.active ? chalk.green('Active') : 'Inactive'}`));
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to load prompt'));
    logger.error('Show prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Create a new prompt from template file
 */
export async function createPromptCommand(options: { template: string }): Promise<void> {
  const spinner = ora('Creating prompt...').start();

  try {
    await registry.initialize();

    const templatePath = FileSystemUtils.resolvePath(options.template);

    if (!await FileSystemUtils.fileExists(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const template = await FileSystemUtils.readJSON<Omit<PromptTemplate, 'createdAt' | 'updatedAt' | 'usageCount'>>(templatePath);

    // Validate template
    const validation = registry.validatePrompt(template as PromptTemplate);
    if (!validation.valid) {
      spinner.fail(chalk.red('Invalid prompt template'));
      console.log(chalk.red('\nErrors:'));
      validation.errors.forEach(err => console.log(`  • ${err}`));
      if (validation.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        validation.warnings.forEach(warn => console.log(`  • ${warn}`));
      }
      process.exit(1);
    }

    await registry.registerPrompt(template);

    spinner.succeed(chalk.green('Prompt created successfully!'));

    console.log(chalk.bold(`\n✅ ${template.name}`));
    console.log(chalk.cyan(`   ID: ${template.id}`));
    console.log(chalk.cyan(`   Version: ${template.version}`));
    console.log(chalk.cyan(`   Category: ${template.category}`));
    console.log();

    console.log(`View details: ${chalk.green(`brandos prompts show ${template.id}`)}`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to create prompt'));
    logger.error('Create prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Update a prompt (creates new version)
 */
export async function updatePromptCommand(
  id: string,
  options: { changes: string; author?: string; template?: string }
): Promise<void> {
  const spinner = ora('Updating prompt...').start();

  try {
    await registry.initialize();

    let newVersion: string;

    if (options.template) {
      // Load updates from template file
      const templatePath = FileSystemUtils.resolvePath(options.template);

      if (!await FileSystemUtils.fileExists(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      const updates = await FileSystemUtils.readJSON<Partial<PromptTemplate>>(templatePath);
      newVersion = await registry.updatePrompt(id, updates);
    } else {
      // Create version with just changelog
      newVersion = await registry.createVersion(
        id,
        options.changes,
        options.author || 'Unknown'
      );
    }

    spinner.succeed(chalk.green('Prompt updated successfully!'));

    console.log(chalk.bold(`\n✅ Created version ${newVersion}`));
    console.log();
    console.log(`Activate this version: ${chalk.green(`brandos prompts activate ${id} ${newVersion}`)}`);
    console.log(`View details: ${chalk.green(`brandos prompts show ${id} --version ${newVersion}`)}`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to update prompt'));
    logger.error('Update prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Set a specific version as active
 */
export async function activatePromptCommand(id: string, version: string): Promise<void> {
  const spinner = ora('Activating version...').start();

  try {
    await registry.initialize();

    await registry.setActive(id, version);

    spinner.succeed(chalk.green(`Version ${version} is now active!`));

    console.log();
    console.log(`View prompt: ${chalk.green(`brandos prompts show ${id}`)}`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to activate version'));
    logger.error('Activate prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Rollback to a previous version
 */
export async function rollbackPromptCommand(id: string, version: string): Promise<void> {
  const spinner = ora('Rolling back...').start();

  try {
    await registry.initialize();

    await registry.rollback(id, version);

    spinner.succeed(chalk.green(`Rolled back to version ${version}!`));

    console.log();
    console.log(`View prompt: ${chalk.green(`brandos prompts show ${id}`)}`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to rollback'));
    logger.error('Rollback prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Show version history for a prompt
 */
export async function historyPromptCommand(id: string): Promise<void> {
  const spinner = ora('Loading history...').start();

  try {
    await registry.initialize();

    const history = await registry.getVersionHistory(id);

    spinner.stop();

    if (history.length === 0) {
      console.log(chalk.yellow(`No version history found for prompt: ${id}`));
      return;
    }

    console.log(chalk.bold(`\n📜 Version History: ${id}\n`));

    for (const version of history.reverse()) {
      const date = new Date(version.timestamp).toLocaleString();
      console.log(chalk.cyan(`v${version.version}`) + chalk.dim(` (${date})`));
      console.log(`  ${version.changes}`);
      console.log(chalk.dim(`  By: ${version.author}`));
      if (version.previousVersion) {
        console.log(chalk.dim(`  Previous: v${version.previousVersion}`));
      }
      console.log();
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to load history'));
    logger.error('History prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Show usage statistics for a prompt
 */
export async function statsPromptCommand(id: string): Promise<void> {
  const spinner = ora('Loading stats...').start();

  try {
    await registry.initialize();

    const stats = await registry.getUsageStats(id);
    const prompt = await registry.getPrompt(id);

    spinner.stop();

    console.log(chalk.bold(`\n📊 Usage Statistics: ${prompt.name}\n`));

    console.log(chalk.cyan('Overview:'));
    console.log(`  Total Uses: ${stats.totalUsages}`);
    console.log(`  Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`  Last Used: ${stats.lastUsed}`);
    console.log();

    console.log(chalk.cyan('Current Version:'));
    console.log(`  Version: ${prompt.version}`);
    console.log(`  Active: ${prompt.active ? chalk.green('Yes') : chalk.yellow('No')}`);
    console.log(`  Created: ${new Date(prompt.createdAt).toLocaleDateString()}`);
    console.log(`  Updated: ${new Date(prompt.updatedAt).toLocaleDateString()}`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to load stats'));
    logger.error('Stats prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Delete a specific prompt version
 */
export async function deletePromptCommand(id: string, version: string, options: { force?: boolean }): Promise<void> {
  const spinner = ora('Deleting version...').start();

  try {
    await registry.initialize();

    if (!options.force) {
      spinner.stop();
      console.log(chalk.yellow('\n⚠️  Warning: This will permanently delete this version.'));
      console.log(chalk.yellow(`   Use --force to confirm deletion.\n`));
      process.exit(1);
    }

    await registry.deleteVersion(id, version);

    spinner.succeed(chalk.green(`Version ${version} deleted!`));

    console.log();
    console.log(`View remaining versions: ${chalk.green(`brandos prompts history ${id}`)}`);
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to delete version'));
    logger.error('Delete prompt failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
