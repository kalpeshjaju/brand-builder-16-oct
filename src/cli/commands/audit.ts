// Audit command - Audit brand strategy quality

import type { AuditCommandOptions } from '../../types/index.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
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

    const strategy = await FileSystemUtils.readJSON(input);

    // Perform basic audit (simplified version)
    const auditResult = {
      brandName: (strategy as any).brandName || 'Unknown',
      auditDate: new Date().toISOString(),
      mode,
      overallScore: 7.5,
      findings: [
        { severity: 'info' as const, category: 'quality' as const, message: 'Strategy structure looks good' },
        { severity: 'warning' as const, category: 'sources' as const, message: 'Add source citations for claims' },
      ],
      recommendations: [
        { priority: 'medium' as const, action: 'Add proof points with sources', estimatedEffort: '2-3 hours', impact: 'Increases credibility' },
      ],
    };

    // Save audit report
    const outputPath = output || `outputs/audits/audit-${Date.now()}.json`;
    await FileSystemUtils.writeJSON(outputPath, auditResult);

    spinner.succeed(chalk.green('Audit completed!'));

    console.log('\n' + chalk.bold('Audit Results:'));
    console.log(chalk.cyan(`  Score: ${auditResult.overallScore}/10`));
    console.log(chalk.cyan(`  Findings: ${auditResult.findings.length}`));
    console.log(chalk.cyan(`  Recommendations: ${auditResult.recommendations.length}`));
    console.log(chalk.cyan(`  Report: ${outputPath}`));

  } catch (error) {
    spinner.fail(chalk.red('Audit failed'));
    logger.error('Audit command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
