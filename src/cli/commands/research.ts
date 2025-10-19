// Research command - Manage research database

import type { BrandConfiguration } from '../../types/brand-types.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { ResearchDatabase } from '../../genesis/research-database/index.js';
import chalk from 'chalk';
import ora from 'ora';

export interface ResearchCommandOptions {
  brand: string;
}

/**
 * List all research findings
 */
export async function listResearchCommand(options: ResearchCommandOptions): Promise<void> {
  const spinner = ora('Loading research database...').start();

  try {
    const { brand } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('List research command', { brand });

    // Load brand config
    const brandConfig = await loadBrandConfig(brand);
    const db = new ResearchDatabase(brandConfig);
    await db.initialize();

    spinner.text = 'Fetching findings...';
    const findings = await db.getAllFindings();

    if (findings.length === 0) {
      spinner.info(chalk.yellow('No research findings found.'));
      console.log(chalk.gray('\nIngest documents with research findings to populate the database.'));
      console.log(chalk.gray(`Example: brandos ingest document.pdf --brand ${brand}`));
      return;
    }

    spinner.succeed(chalk.green(`Found ${findings.length} research findings`));

    console.log('\n' + chalk.bold('Research Findings:\n'));

    findings.forEach((finding, index) => {
      console.log(chalk.cyan(`${index + 1}. ${finding.topic}`));
      console.log(chalk.gray(`   Content: ${finding.content.slice(0, 100)}...`));
      console.log(chalk.gray(`   Sources: ${finding.sources.length} source(s)`));
      console.log(chalk.gray(`   Confidence: ${finding.confidence}/10`));
      if (finding.timestamp) {
        console.log(chalk.gray(`   Extracted: ${new Date(finding.timestamp).toLocaleString()}\n`));
      } else {
        console.log();
      }
    });
  } catch (error) {
    spinner.fail(chalk.red('Failed to list research findings'));
    logger.error('List research command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Search research findings
 */
export async function searchResearchCommand(
  query: string,
  options: ResearchCommandOptions
): Promise<void> {
  const spinner = ora('Searching research database...').start();

  try {
    const { brand } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    if (!query) {
      throw new Error('Search query is required.');
    }

    logger.info('Search research command', { brand, query });

    // Load brand config
    const brandConfig = await loadBrandConfig(brand);
    const db = new ResearchDatabase(brandConfig);
    await db.initialize();

    spinner.text = `Searching for "${query}"...`;
    const findings = await db.searchByKeyword(query);

    if (findings.length === 0) {
      spinner.info(chalk.yellow(`No findings match "${query}"`));
      return;
    }

    spinner.succeed(chalk.green(`Found ${findings.length} matching findings`));

    console.log('\n' + chalk.bold(`Search Results for "${query}":\n`));

    findings.forEach((finding, index) => {
      console.log(chalk.cyan(`${index + 1}. ${finding.topic}`));
      console.log(chalk.gray(`   Content: ${finding.content.slice(0, 150)}...`));
      console.log(chalk.gray(`   Confidence: ${finding.confidence}/10`));
      console.log(chalk.gray(`   Sources: ${finding.sources.map(s => s.title).join(', ')}\n`));
    });
  } catch (error) {
    spinner.fail(chalk.red('Search failed'));
    logger.error('Search research command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Show database statistics
 */
export async function statsResearchCommand(options: ResearchCommandOptions): Promise<void> {
  const spinner = ora('Loading database statistics...').start();

  try {
    const { brand } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Stats research command', { brand });

    // Load brand config
    const brandConfig = await loadBrandConfig(brand);
    const db = new ResearchDatabase(brandConfig);
    await db.initialize();

    spinner.text = 'Calculating statistics...';
    const summary = await db.getSummary();

    spinner.succeed(chalk.green('Database statistics ready'));

    console.log('\n' + chalk.bold('Research Database Statistics:\n'));
    console.log(chalk.cyan(`  Total Findings: ${summary.totalFindings}`));
    console.log(chalk.cyan(`  Topics: ${summary.topics}`));
    console.log(chalk.cyan(`  Sources: ${summary.sources}`));
    console.log(chalk.cyan(`\n  Confidence Distribution:`));
    console.log(chalk.green(`    High (≥8):   ${summary.confidence.high}`));
    console.log(chalk.yellow(`    Medium (5-7): ${summary.confidence.medium}`));
    console.log(chalk.red(`    Low (<5):    ${summary.confidence.low}`));

    if (summary.topKeywords.length > 0) {
      console.log(chalk.cyan(`\n  Top Keywords:`));
      summary.topKeywords.slice(0, 10).forEach((kw, i) => {
        console.log(chalk.gray(`    ${i + 1}. ${kw.keyword} (${kw.count})`));
      });
    }

    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to load statistics'));
    logger.error('Stats research command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Export research database
 */
export async function exportResearchCommand(options: ResearchCommandOptions): Promise<void> {
  const spinner = ora('Exporting research database...').start();

  try {
    const { brand } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Export research command', { brand });

    // Load brand config
    const brandConfig = await loadBrandConfig(brand);
    const db = new ResearchDatabase(brandConfig);
    await db.initialize();

    spinner.text = 'Creating export file...';
    const exportFile = await db.exportToFile();

    spinner.succeed(chalk.green('Database exported successfully!'));

    console.log('\n' + chalk.bold('Export Complete:'));
    console.log(chalk.cyan(`  File: ${exportFile}`));
    console.log(chalk.gray(`  Format: JSON`));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Export failed'));
    logger.error('Export research command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Helper: Load brand configuration
 */
async function loadBrandConfig(brand: string): Promise<BrandConfiguration> {
  const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
  const configPath = `${workspacePath}/brand-config.json`;

  if (!(await FileSystemUtils.fileExists(configPath))) {
    throw new Error(
      `Brand workspace not found for "${brand}".\n` +
      `Run: brandos init --brand "${brand}" --industry <industry> --category <category>`
    );
  }

  return await FileSystemUtils.readJSON<BrandConfiguration>(configPath);
}
