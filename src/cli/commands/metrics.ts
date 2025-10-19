/**
 * Quality Metrics CLI Command
 *
 * Display quality metrics dashboard for brand research and generation
 */

import type { BrandConfiguration } from '../../types/brand-types.js';
import { createQualityDashboard } from '../../genesis/quality-metrics-dashboard.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

export interface MetricsCommandOptions {
  brand: string;
  format?: 'text' | 'json' | 'markdown';
  export?: string; // Export path
  verbose?: boolean;
}

/**
 * Display quality metrics dashboard
 */
export async function metricsCommand(options: MetricsCommandOptions): Promise<void> {
  const { brand, format = 'text', export: exportPath, verbose } = options;

  try {
    logger.info('Generating quality metrics dashboard', { brand });

    // Load brand config
    const brandConfig = await loadBrandConfig(brand);

    // Create dashboard
    const dashboard = createQualityDashboard(brandConfig);
    const report = await dashboard.generateDashboard();

    // Display based on format
    if (format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else if (format === 'markdown') {
      const markdown = await dashboard.exportToMarkdown();
      console.log(markdown);

      if (exportPath) {
        await FileSystemUtils.writeFile(exportPath, markdown);
        console.log(chalk.green(`✅ Exported to: ${exportPath}`));
      }
    } else {
      // Text format (default)
      displayTextReport(report, verbose);

      if (exportPath) {
        const markdown = await dashboard.exportToMarkdown();
        await FileSystemUtils.writeFile(exportPath, markdown);
        console.log(chalk.green(`\n✅ Exported to: ${exportPath}`));
      }
    }

    logger.info('Quality metrics displayed', { brand, format });
  } catch (error) {
    logger.error('Failed to generate quality metrics', {
      brand,
      error: (error as Error).message,
    });

    console.error(chalk.red(`\n❌ Failed to generate quality metrics`));
    console.error(chalk.red(`Reason: ${(error as Error).message}`));
    console.error(chalk.yellow(`\nRun with --verbose for more details`));

    process.exit(1);
  }
}

/**
 * Display text-formatted report
 */
function displayTextReport(report: any, verbose?: boolean): void {
  const { metrics, recommendations, charts } = report;

  console.log(chalk.bold.blue('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.blue('           QUALITY METRICS DASHBOARD'));
  console.log(chalk.bold.blue('═══════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('Brand:'), metrics.metadata.brandName);
  console.log(chalk.bold('Generated:'), new Date(metrics.metadata.generatedAt).toLocaleString());
  console.log(
    chalk.bold('Data Range:'),
    `${new Date(metrics.metadata.dataRange.from).toLocaleDateString()} - ${new Date(metrics.metadata.dataRange.to).toLocaleDateString()}`
  );

  console.log(chalk.bold.cyan('\n───────────────────────────────────────────────────────'));
  console.log(chalk.bold.cyan('  RESEARCH COVERAGE'));
  console.log(chalk.bold.cyan('───────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('Total Findings:'), chalk.green(metrics.research.totalFindings));
  console.log(chalk.bold('Total Sources:'), chalk.green(metrics.research.totalSources));
  console.log(
    chalk.bold('Average Confidence:'),
    getConfidenceColor(metrics.research.averageConfidence)
  );
  console.log(chalk.bold('Topic Coverage:'), chalk.green(metrics.research.topicCoverage));

  console.log(chalk.bold('\nSource Quality Distribution:'));
  console.log(
    `  ${chalk.green('●')} Tier 1 (Official):   ${chalk.bold(metrics.research.tier1Sources)}`
  );
  console.log(
    `  ${chalk.blue('●')} Tier 2 (Trusted):   ${chalk.bold(metrics.research.tier2Sources)}`
  );
  console.log(
    `  ${chalk.yellow('●')} Tier 3 (General):   ${chalk.bold(metrics.research.tier3Sources)}`
  );
  console.log(
    `  ${chalk.gray('●')} Tier 4 (Unverified): ${chalk.bold(metrics.research.tier4Sources)}`
  );

  console.log(chalk.bold.cyan('\n───────────────────────────────────────────────────────'));
  console.log(chalk.bold.cyan('  TRENDS'));
  console.log(chalk.bold.cyan('───────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('Quality Trend:'), getTrendIcon(metrics.trends.qualityTrend));
  console.log(chalk.bold('Coverage Trend:'), getTrendIcon(metrics.trends.coverageTrend));
  console.log(chalk.bold('Performance Trend:'), getTrendIcon(metrics.trends.performanceTrend));

  console.log(chalk.bold.cyan('\n───────────────────────────────────────────────────────'));
  console.log(chalk.bold.cyan('  RECOMMENDATIONS'));
  console.log(chalk.bold.cyan('───────────────────────────────────────────────────────\n'));

  recommendations.forEach((rec: string) => {
    console.log(rec);
  });

  if (verbose) {
    console.log(chalk.bold.cyan('\n───────────────────────────────────────────────────────'));
    console.log(chalk.bold.cyan('  CHARTS'));
    console.log(chalk.bold.cyan('───────────────────────────────────────────────────────\n'));

    console.log(chalk.bold('Source Tier Distribution:'));
    Object.entries(charts.sourceTierDistribution).forEach(([tier, count]) => {
      const bar = '█'.repeat(Math.floor((count as number) / 2));
      console.log(`  ${tier}: ${chalk.cyan(bar)} (${count})`);
    });

    console.log(chalk.bold('\nConfidence Distribution:'));
    Object.entries(charts.confidenceDistribution).forEach(([range, count]) => {
      const bar = '█'.repeat(Math.floor((count as number) / 2));
      console.log(`  ${range}: ${chalk.green(bar)} (${count})`);
    });
  }

  console.log(chalk.bold.blue('\n═══════════════════════════════════════════════════════\n'));
}

/**
 * Get color for confidence score
 */
function getConfidenceColor(confidence: number): string {
  const score = `${confidence}/10`;
  if (confidence >= 8) {
    return chalk.green(score);
  } else if (confidence >= 6) {
    return chalk.yellow(score);
  } else {
    return chalk.red(score);
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: string): string {
  if (trend === 'improving' || trend === 'expanding' || trend === 'faster') {
    return chalk.green(`↗ ${trend}`);
  } else if (trend === 'declining' || trend === 'contracting' || trend === 'slower') {
    return chalk.red(`↘ ${trend}`);
  } else {
    return chalk.blue(`→ ${trend}`);
  }
}

/**
 * Load brand configuration
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
