// Guardian command - Fact-checking and cross-source verification

import type { BrandConfiguration } from '../../types/brand-types.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { ResearchDatabase } from '../../genesis/research-database/index.js';
import { FactCheckerEnhanced } from '../../genesis/guardian/fact-checker-enhanced.js';
import { CrossSourceVerifier } from '../../genesis/guardian/cross-source-verifier.js';
import chalk from 'chalk';
import ora from 'ora';
import { handleCommandError } from '../utils/error-handler.js';

export interface GuardianCommandOptions {
  brand: string;
}

/**
 * Check a claim against research database
 */
export async function checkClaimCommand(
  claim: string,
  options: GuardianCommandOptions
): Promise<void> {
  const spinner = ora('Checking claim...').start();

  try {
    const { brand } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    if (!claim || claim.trim().length === 0) {
      throw new Error('Claim is required.');
    }

    logger.info('Check claim command', { brand, claim: claim.slice(0, 50) });

    // Load brand config and research database
    const brandConfig = await loadBrandConfig(brand);
    const db = new ResearchDatabase(brandConfig);
    await db.initialize();

    spinner.text = 'Fetching research findings...';
    const findings = await db.getAllFindings();

    if (findings.length === 0) {
      spinner.warn(chalk.yellow('No research findings in database.'));
      console.log(chalk.gray('\nIngest documents first: brandos ingest <file> --brand ' + brand));
      return;
    }

    spinner.text = 'Verifying claim...';
    const checker = new FactCheckerEnhanced();
    const report = await checker.checkClaim(claim, findings);

    spinner.succeed(chalk.green('Claim verification complete'));

    // Display report
    console.log('\n' + chalk.bold('Fact Check Report:\n'));
    console.log(chalk.cyan('Claim:'));
    console.log(chalk.gray(`  "${claim}"\n`));

    console.log(chalk.cyan('Verification:'));
    console.log(chalk.gray(`  Status: ${report.isVerified ? chalk.green('✓ Verified') : chalk.red('✗ Not Verified')}`));
    console.log(chalk.gray(`  Confidence: ${report.confidence} (${report.confidenceScore}/10)`));
    console.log(chalk.gray(`  Recommendation: ${formatRecommendation(report.recommendedAction)}\n`));

    console.log(chalk.cyan('Sources:'));
    console.log(chalk.gray(`  Supporting: ${report.supportingSources.length}`));
    report.supportingSources.slice(0, 3).forEach((source, i) => {
      console.log(chalk.gray(`    ${i + 1}. ${source.title} (tier: ${source.tier || 'unknown'})`));
    });
    if (report.supportingSources.length > 3) {
      console.log(chalk.gray(`    ... and ${report.supportingSources.length - 3} more`));
    }

    if (report.contradictingSources.length > 0) {
      console.log(chalk.gray(`  Contradicting: ${report.contradictingSources.length}`));
      report.contradictingSources.forEach((source, i) => {
        console.log(chalk.red(`    ${i + 1}. ${source.title}`));
      });
    }

    if (report.notes.length > 0) {
      console.log(chalk.cyan('\nNotes:'));
      report.notes.forEach((note) => {
        console.log(chalk.gray(`  • ${note}`));
      });
    }

    console.log();
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Check claim command failed', normalizedError);
    handleCommandError('guardian:check-claim', normalizedError, spinner);
  }
}

/**
 * Verify statement across sources
 */
export async function verifyStatementCommand(
  statement: string,
  options: GuardianCommandOptions
): Promise<void> {
  const spinner = ora('Verifying statement...').start();

  try {
    const { brand } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    if (!statement || statement.trim().length === 0) {
      throw new Error('Statement is required.');
    }

    logger.info('Verify statement command', { brand, statement: statement.slice(0, 50) });

    // Load brand config and research database
    const brandConfig = await loadBrandConfig(brand);
    const db = new ResearchDatabase(brandConfig);
    await db.initialize();

    spinner.text = 'Fetching research findings...';
    const findings = await db.getAllFindings();

    if (findings.length === 0) {
      spinner.warn(chalk.yellow('No research findings in database.'));
      console.log(chalk.gray('\nIngest documents first: brandos ingest <file> --brand ' + brand));
      return;
    }

    spinner.text = 'Checking source consensus...';
    const verifier = new CrossSourceVerifier();
    const result = await verifier.verify(statement, findings);

    spinner.succeed(chalk.green('Cross-source verification complete'));

    // Display result
    console.log('\n' + chalk.bold('Cross-Source Verification Report:\n'));
    console.log(chalk.cyan('Statement:'));
    console.log(chalk.gray(`  "${statement}"\n`));

    console.log(chalk.cyan('Consensus:'));
    console.log(chalk.gray(`  Status: ${result.isConsistent ? chalk.green('✓ Consistent') : chalk.red('✗ Inconsistent')}`));
    console.log(chalk.gray(`  Level: ${formatConsensus(result.consensusLevel)}`));
    console.log(chalk.gray(`  Score: ${result.consensusScore}/10`));
    console.log(chalk.gray(`  Recommendation: ${formatRecommendation(result.recommendation)}\n`));

    console.log(chalk.cyan('Sources Analyzed:'));
    console.log(chalk.gray(`  Total: ${result.totalSourcesChecked}`));
    console.log(chalk.green(`  Agree: ${result.agreeSources.length}`));
    console.log(chalk.red(`  Disagree: ${result.disagreeSources.length}`));
    console.log(chalk.gray(`  Neutral: ${result.neutralSources.length}\n`));

    console.log(chalk.cyan('Source Quality:'));
    console.log(chalk.gray(`  Tier 1 (highest): ${result.reliability.tier1Count}`));
    console.log(chalk.gray(`  Tier 2: ${result.reliability.tier2Count}`));
    console.log(chalk.gray(`  Tier 3: ${result.reliability.tier3Count}`));
    console.log(chalk.gray(`  Tier 4: ${result.reliability.tier4Count}`));
    console.log(chalk.gray(`  Average Quality: ${result.reliability.averageTierQuality.toFixed(2)}/4\n`));

    if (result.conflicts.length > 0) {
      console.log(chalk.red('⚠️  Conflicts Detected:\n'));
      result.conflicts.forEach((conflict, i) => {
        console.log(chalk.red(`  ${i + 1}. ${conflict.severity.toUpperCase()}: ${conflict.description}`));
        console.log(chalk.gray(`     ${conflict.source1.title} vs ${conflict.source2.title}`));
        console.log(chalk.gray(`     Suggestion: ${conflict.resolutionSuggestion}\n`));
      });
    }

    console.log();
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Verify statement command failed', normalizedError);
    handleCommandError('guardian:verify-statement', normalizedError, spinner);
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

/**
 * Helper: Format recommendation
 */
function formatRecommendation(action: string): string {
  switch (action) {
    case 'accept':
      return chalk.green('✓ ACCEPT');
    case 'verify':
      return chalk.yellow('⚠ VERIFY (needs more evidence)');
    case 'reject':
      return chalk.red('✗ REJECT');
    case 'needs_review':
      return chalk.yellow('⚠ NEEDS REVIEW (conflicting evidence)');
    case 'investigate':
      return chalk.yellow('⚠ INVESTIGATE (inconsistent sources)');
    case 'needs_more_sources':
      return chalk.yellow('⚠ NEEDS MORE SOURCES');
    default:
      return action;
  }
}

/**
 * Helper: Format consensus level
 */
function formatConsensus(level: string): string {
  switch (level) {
    case 'strong':
      return chalk.green('Strong');
    case 'moderate':
      return chalk.yellow('Moderate');
    case 'weak':
      return chalk.red('Weak');
    case 'conflicting':
      return chalk.red('Conflicting');
    default:
      return level;
  }
}
