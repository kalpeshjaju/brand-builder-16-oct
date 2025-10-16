// Audit command - Audit brand strategy quality

import type { AuditCommandOptions } from '../../types/index.js';
import { BrandAuditor } from '../../guardian/brand-auditor.js';
import { FileSystemUtils, logger, loadStrategyFromFile } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';

export async function auditCommand(options: AuditCommandOptions): Promise<void> {
  const spinner = ora('Auditing brand strategy...').start();

  try {
    const { input, output, mode } = options;

    logger.info('Audit command', { input, mode });

    // Read strategy file
    if (!(await FileSystemUtils.fileExists(input))) {
      throw new Error(`Strategy file not found: ${input}`);
    }

    const loaded = await loadStrategyFromFile(input);

    logger.debug('Loaded strategy file', {
      brandName: loaded.brandName,
      parseMethod: loaded.metadata.parseMethod,
      generatedAt: loaded.metadata.generatedAt,
      detectedMode: loaded.metadata.mode,
    });

    // Perform comprehensive audit using BrandAuditor
    const auditor = new BrandAuditor();

    // Validate and normalize mode
    const detectedMode = loaded.metadata.mode;
    const validModes = ['quick', 'standard', 'comprehensive'] as const;
    const auditMode = mode ||
      (detectedMode && validModes.includes(detectedMode as typeof validModes[number])
        ? (detectedMode as typeof validModes[number])
        : 'standard');

    const auditResult = await auditor.audit(
      loaded.strategy,
      loaded.brandName,
      { mode: auditMode }
    );

    // Save audit report
    const outputPath = output || `outputs/audits/audit-${Date.now()}.json`;
    await FileSystemUtils.writeJSON(outputPath, auditResult);

    spinner.succeed(chalk.green('Audit completed!'));

    console.log('\n' + chalk.bold('Audit Results:'));
    console.log(chalk.cyan(`  Overall Score: ${auditResult.overallScore}/10`));
    console.log(chalk.cyan(`  Source Quality: ${auditResult.scoreBreakdown.sourceQuality.score}/10 (${auditResult.scoreBreakdown.sourceQuality.status})`));
    console.log(chalk.cyan(`  Fact Verification: ${auditResult.scoreBreakdown.factVerification.score}/10 (${auditResult.scoreBreakdown.factVerification.status})`));
    console.log(chalk.cyan(`  Production Readiness: ${auditResult.scoreBreakdown.productionReadiness.score}/10 (${auditResult.scoreBreakdown.productionReadiness.status})`));
    console.log(chalk.cyan(`  Findings: ${auditResult.findings.length}`));
    console.log(chalk.cyan(`  Recommendations: ${auditResult.recommendations.length}`));
    console.log(chalk.cyan(`  Report: ${outputPath}`));

    // Show top recommendations
    if (auditResult.recommendations.length > 0) {
      console.log('\n' + chalk.bold('Top Recommendations:'));
      auditResult.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(chalk.yellow(`  ${i + 1}. ${rec.action}`));
        console.log(chalk.gray(`     Impact: ${rec.impact}`));
        console.log(chalk.gray(`     Effort: ${rec.estimatedEffort}`));
      });
    }

  } catch (error) {
    spinner.fail(chalk.red('Audit failed'));
    logger.error('Audit command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
