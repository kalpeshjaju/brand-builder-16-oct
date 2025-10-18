// Audit command - Audit brand strategy quality

import type { AuditCommandOptions } from '../../types/index.js';
import { BrandAuditor } from '../../guardian/brand-auditor.js';
import { ValidationEngine } from '../../validation/validation-engine.js';
import { FileSystemUtils, logger, loadStrategyFromFile } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

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

    // Run enhanced 26-checkpoint validation
    spinner.text = 'Running enhanced quality validation (26 checkpoints)...';
    const validationEngine = new ValidationEngine(loaded.brandName);

    // Load evolution outputs if available
    let evolutionOutputs: Record<string, unknown> | undefined;
    const evolutionDir = path.join('outputs', 'evolution', loaded.brandName);
    try {
      const evolutionFiles = await FileSystemUtils.listFiles(evolutionDir);
      evolutionOutputs = {};

      for (const file of evolutionFiles) {
        if (file.endsWith('.json')) {
          const data = await FileSystemUtils.readJSON(path.join(evolutionDir, file));
          evolutionOutputs[file] = data;
        }
      }
    } catch (error) {
      // No evolution outputs available
    }

    const validationReport = await validationEngine.validate(
      loaded.strategy,
      loaded.brandName,
      {
        evolutionOutputs,
        auditResults: auditResult,
        sources: [] // TODO: Extract from loaded data
      }
    );

    // Save both audit and validation reports
    const outputPath = output || `outputs/audits/${loaded.brandName}-audit.json`;
    const validationPath = output
      ? output.replace('.json', '-validation.json')
      : `outputs/audits/${loaded.brandName}-validation.json`;

    await FileSystemUtils.writeJSON(outputPath, auditResult);
    await FileSystemUtils.writeJSON(validationPath, validationReport);

    spinner.succeed(chalk.green('Audit completed with enhanced validation!'));

    console.log('\n' + chalk.bold('📊 Basic Audit Results:'));
    console.log(chalk.cyan(`  Overall Score: ${auditResult.overallScore}/10`));
    console.log(chalk.cyan(`  Source Quality: ${auditResult.scoreBreakdown.sourceQuality.score}/10 (${auditResult.scoreBreakdown.sourceQuality.status})`));
    console.log(chalk.cyan(`  Fact Verification: ${auditResult.scoreBreakdown.factVerification.score}/10 (${auditResult.scoreBreakdown.factVerification.status})`));
    console.log(chalk.cyan(`  Production Readiness: ${auditResult.scoreBreakdown.productionReadiness.score}/10 (${auditResult.scoreBreakdown.productionReadiness.status})`));

    console.log('\n' + chalk.bold('✅ Enhanced Quality Validation (26 Checkpoints):'));
    console.log(chalk.cyan(`  Overall Score: ${validationReport.overallScore}/100`));
    console.log(chalk.cyan(`  Checkpoints Passed: ${validationReport.summary.passed}/${validationReport.summary.totalCheckpoints}`));
    console.log(chalk.cyan(`  Checkpoints Failed: ${validationReport.summary.failed}`));
    console.log(chalk.cyan(`  Warnings: ${validationReport.summary.warnings}`));
    console.log(chalk.cyan(`  Critical Issues: ${validationReport.summary.criticalIssues}`));
    console.log(chalk.cyan(`  High Priority Issues: ${validationReport.summary.highPriorityIssues}`));
    console.log(chalk.cyan(`  Strategic Gaps Identified: ${validationReport.gaps.length}`));
    console.log(chalk.cyan(`  Quality Fixes Tracked: ${validationReport.fixes.length}`));

    console.log('\n' + chalk.bold('📁 Reports Generated:'));
    console.log(chalk.cyan(`  Basic Audit: ${outputPath}`));
    console.log(chalk.cyan(`  Enhanced Validation: ${validationPath}`));

    // Show immediate actions
    if (validationReport.recommendations.immediate.length > 0) {
      console.log('\n' + chalk.bold.red('🚨 Immediate Actions Required:'));
      validationReport.recommendations.immediate.forEach((rec, i) => {
        console.log(chalk.red(`  ${i + 1}. ${rec}`));
      });
    }

    // Show top gaps
    if (validationReport.gaps.length > 0) {
      console.log('\n' + chalk.bold('🎯 Top Strategic Gaps:'));
      validationReport.gaps.slice(0, 3).forEach((gap, i) => {
        const severityColor = gap.severity === 'critical' ? chalk.red : gap.severity === 'high' ? chalk.yellow : chalk.blue;
        console.log(severityColor(`  ${i + 1}. [${gap.severity.toUpperCase()}] ${gap.title}`));
        console.log(chalk.gray(`     Priority: ${gap.priority}/10 | Effort: ${gap.effort}`));
        console.log(chalk.gray(`     Impact: ${gap.impact}`));
      });
    }

  } catch (error) {
    spinner.fail(chalk.red('Audit failed'));
    logger.error('Audit command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
