/**
 * Quality Metrics Dashboard
 *
 * Tracks and displays quality metrics for brand strategy generation:
 * - Research coverage (sources, findings, confidence)
 * - Generation quality (fact-check pass rate, consistency)
 * - System performance (processing time, token usage)
 * - Trend analysis (quality over time)
 */

import type { BrandConfiguration } from '../types/brand-types.js';
import type { ResearchFinding } from '../types/research-types.js';
import { ResearchDatabase } from './research-database/index.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { logger } from '../utils/logger.js';

interface QualityMetricsHistoryFile {
  history?: QualityMetrics[];
}

export interface QualityMetrics {
  // Research Coverage
  research: {
    totalFindings: number;
    totalSources: number;
    averageConfidence: number;
    tier1Sources: number;
    tier2Sources: number;
    tier3Sources: number;
    tier4Sources: number;
    topicCoverage: number; // Unique topics covered
  };

  // Generation Quality
  generation: {
    totalGenerations: number;
    factCheckPassRate: number; // % of claims verified
    consistencyScore: number; // Cross-source consistency
    averageQualityScore: number; // Overall quality (0-10)
  };

  // System Performance
  performance: {
    averageProcessingTime: number; // ms
    averageTokenUsage: number;
    oracleIndexSize: number; // Number of chunks
    cacheHitRate: number; // % of cached responses
  };

  // Trends
  trends: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    coverageTrend: 'expanding' | 'stable' | 'contracting';
    performanceTrend: 'faster' | 'stable' | 'slower';
  };

  // Metadata
  metadata: {
    brandName: string;
    generatedAt: string;
    dataRange: {
      from: string;
      to: string;
    };
  };
}

export interface DashboardReport {
  metrics: QualityMetrics;
  summary: string;
  recommendations: string[];
  charts: {
    sourceTierDistribution: Record<string, number>;
    confidenceDistribution: Record<string, number>;
    qualityOverTime: Array<{ date: string; score: number }>;
  };
}

export class QualityMetricsDashboard {
  private brandConfig: BrandConfiguration;
  private researchDB: ResearchDatabase;
  private metricsFile: string;

  constructor(brandConfig: BrandConfiguration) {
    this.brandConfig = brandConfig;
    this.researchDB = new ResearchDatabase(brandConfig);
    this.metricsFile = FileSystemUtils.getBrandDataPath(
      brandConfig.brandName,
      'quality-metrics.json'
    );
  }

  /**
   * Generate quality metrics dashboard
   */
  async generateDashboard(): Promise<DashboardReport> {
    await this.researchDB.initialize();

    const findings = await this.researchDB.getAllFindings();
    const metrics = await this.calculateMetrics(findings);

    const report: DashboardReport = {
      metrics,
      summary: this.generateSummary(metrics),
      recommendations: this.generateRecommendations(metrics),
      charts: this.generateCharts(findings, metrics),
    };

    // Save metrics history
    await this.saveMetrics(metrics);

    return report;
  }

  /**
   * Calculate quality metrics from research findings
   */
  private async calculateMetrics(findings: ResearchFinding[]): Promise<QualityMetrics> {
    // Research Coverage
    const allSources = findings.flatMap((f) => f.sources);
    const uniqueSources = new Set(allSources.map((s) => s.url)).size;
    const uniqueTopics = new Set(findings.map((f) => f.topic)).size;

    const tier1 = allSources.filter((s) => s.tier === 'tier1').length;
    const tier2 = allSources.filter((s) => s.tier === 'tier2').length;
    const tier3 = allSources.filter((s) => s.tier === 'tier3').length;
    const tier4 = allSources.filter((s) => s.tier === 'tier4').length;

    const avgConfidence =
      findings.length > 0
        ? findings.reduce((sum, f) => sum + (f.confidence || 0), 0) / findings.length
        : 0;

    // Generation Quality (mock data - would be populated by actual generation runs)
    const generationQuality = {
      totalGenerations: 0,
      factCheckPassRate: 0,
      consistencyScore: 0,
      averageQualityScore: 0,
    };

    // System Performance (mock data - would be populated by actual metrics)
    const performance = {
      averageProcessingTime: 0,
      averageTokenUsage: 0,
      oracleIndexSize: 0,
      cacheHitRate: 0,
    };

    // Trends (calculated from historical data)
    const trends = await this.calculateTrends();

    return {
      research: {
        totalFindings: findings.length,
        totalSources: uniqueSources,
        averageConfidence: Math.round(avgConfidence * 10) / 10,
        tier1Sources: tier1,
        tier2Sources: tier2,
        tier3Sources: tier3,
        tier4Sources: tier4,
        topicCoverage: uniqueTopics,
      },
      generation: generationQuality,
      performance,
      trends,
      metadata: {
        brandName: this.brandConfig.brandName,
        generatedAt: new Date().toISOString(),
        dataRange: {
          from: this.getEarliestFindingDate(findings),
          to: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * Generate summary text
   */
  private generateSummary(metrics: QualityMetrics): string {
    const { research, trends } = metrics;

    return `
Quality Dashboard for ${metrics.metadata.brandName}

**Research Coverage**: ${research.totalFindings} findings from ${research.totalSources} sources
- Average Confidence: ${research.averageConfidence}/10
- Topic Coverage: ${research.topicCoverage} unique topics
- Source Quality: ${research.tier1Sources} tier1, ${research.tier2Sources} tier2

**Trends**:
- Quality: ${trends.qualityTrend}
- Coverage: ${trends.coverageTrend}
- Performance: ${trends.performanceTrend}
    `.trim();
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: QualityMetrics): string[] {
    const recommendations: string[] = [];
    const { research, trends } = metrics;

    // Coverage recommendations
    if (research.totalFindings < 10) {
      recommendations.push(
        `📚 **Low Research Coverage**: Only ${research.totalFindings} findings. Consider ingesting more source documents.`
      );
    }

    if (research.averageConfidence < 6) {
      recommendations.push(
        `⚠️ **Low Confidence**: Average confidence is ${research.averageConfidence}/10. Add more tier1 sources to improve reliability.`
      );
    }

    if (research.tier1Sources < 3) {
      recommendations.push(
        `🎯 **Improve Source Quality**: Only ${research.tier1Sources} tier1 sources. Add official brand documents or research reports.`
      );
    }

    if (research.topicCoverage < 5) {
      recommendations.push(
        `📊 **Limited Topic Coverage**: Only ${research.topicCoverage} topics. Expand research to cover more brand aspects.`
      );
    }

    // Trend recommendations
    if (trends.qualityTrend === 'declining') {
      recommendations.push(
        `📉 **Declining Quality**: Quality metrics trending down. Review recent generations and fact-check claims.`
      );
    }

    if (trends.coverageTrend === 'contracting') {
      recommendations.push(
        `🔍 **Shrinking Coverage**: Research coverage declining. Ingest new source materials.`
      );
    }

    // Default recommendation if all good
    if (recommendations.length === 0) {
      recommendations.push(
        `✅ **Good Status**: Quality metrics are healthy. Continue monitoring and maintaining source quality.`
      );
    }

    return recommendations;
  }

  /**
   * Generate chart data
   */
  private generateCharts(
    findings: ResearchFinding[],
    metrics: QualityMetrics
  ): DashboardReport['charts'] {
    const { research } = metrics;

    // Source tier distribution
    const sourceTierDistribution = {
      tier1: research.tier1Sources,
      tier2: research.tier2Sources,
      tier3: research.tier3Sources,
      tier4: research.tier4Sources,
    };

    // Confidence distribution
    const confidenceDistribution: Record<string, number> = {
      'High (8-10)': findings.filter((f) => (f.confidence || 0) >= 8).length,
      'Medium (5-7)': findings.filter((f) => (f.confidence || 0) >= 5 && (f.confidence || 0) < 8).length,
      'Low (0-4)': findings.filter((f) => (f.confidence || 0) < 5).length,
    };

    // Quality over time (mock data - would be populated from historical metrics)
    const qualityOverTime: Array<{ date: string; score: number }> = [];

    return {
      sourceTierDistribution,
      confidenceDistribution,
      qualityOverTime,
    };
  }

  /**
   * Calculate trends from historical data
   */
  private async calculateTrends(): Promise<QualityMetrics['trends']> {
    // Mock implementation - would compare current metrics to historical
    return {
      qualityTrend: 'stable',
      coverageTrend: 'stable',
      performanceTrend: 'stable',
    };
  }

  /**
   * Get earliest finding date
   */
  private getEarliestFindingDate(findings: ResearchFinding[]): string {
    if (findings.length === 0) {
      return new Date().toISOString();
    }

    const timestamps = findings
      .map((f) => f.timestamp ? new Date(f.timestamp).getTime() : Date.now())
      .filter((t) => !isNaN(t));

    if (timestamps.length === 0) {
      return new Date().toISOString();
    }

    const earliest = Math.min(...timestamps);
    return new Date(earliest).toISOString();
  }

  /**
   * Save metrics to history
   */
  private async saveMetrics(metrics: QualityMetrics): Promise<void> {
    try {
      // Load existing metrics
      let history: QualityMetrics[] = [];
      if (await FileSystemUtils.fileExists(this.metricsFile)) {
        const content = await FileSystemUtils.readJSON<QualityMetricsHistoryFile>(this.metricsFile);
        history = Array.isArray(content.history) ? content.history : [];
      }

      // Add current metrics
      history.push(metrics);

      // Keep last 30 days of metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      history = history.filter((m) => {
        const date = new Date(m.metadata.generatedAt);
        return date >= thirtyDaysAgo;
      });

      // Save updated history
      await FileSystemUtils.writeJSON(this.metricsFile, { history });

      logger.info('Quality metrics saved', {
        brand: this.brandConfig.brandName,
        historyLength: history.length,
      });
    } catch (error) {
      logger.error('Failed to save quality metrics', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Export dashboard to markdown
   */
  async exportToMarkdown(): Promise<string> {
    const report = await this.generateDashboard();
    const { metrics, summary, recommendations, charts } = report;

    let markdown = `# Quality Metrics Dashboard\n\n`;
    markdown += `**Brand**: ${metrics.metadata.brandName}\n`;
    markdown += `**Generated**: ${new Date(metrics.metadata.generatedAt).toLocaleString()}\n`;
    markdown += `**Data Range**: ${new Date(metrics.metadata.dataRange.from).toLocaleDateString()} - ${new Date(metrics.metadata.dataRange.to).toLocaleDateString()}\n\n`;

    markdown += `---\n\n## Summary\n\n${summary}\n\n`;

    markdown += `---\n\n## Research Coverage\n\n`;
    markdown += `- **Total Findings**: ${metrics.research.totalFindings}\n`;
    markdown += `- **Total Sources**: ${metrics.research.totalSources}\n`;
    markdown += `- **Average Confidence**: ${metrics.research.averageConfidence}/10\n`;
    markdown += `- **Topic Coverage**: ${metrics.research.topicCoverage} unique topics\n\n`;

    markdown += `**Source Quality Distribution**:\n`;
    markdown += `- Tier 1 (Official): ${metrics.research.tier1Sources}\n`;
    markdown += `- Tier 2 (Trusted): ${metrics.research.tier2Sources}\n`;
    markdown += `- Tier 3 (General): ${metrics.research.tier3Sources}\n`;
    markdown += `- Tier 4 (Unverified): ${metrics.research.tier4Sources}\n\n`;

    markdown += `---\n\n## Recommendations\n\n`;
    recommendations.forEach((rec) => {
      markdown += `${rec}\n\n`;
    });

    markdown += `---\n\n## Charts\n\n`;

    markdown += `### Source Tier Distribution\n\n`;
    Object.entries(charts.sourceTierDistribution).forEach(([tier, count]) => {
      const bar = '█'.repeat(Math.floor(count / 2));
      markdown += `${tier}: ${bar} (${count})\n`;
    });
    markdown += `\n`;

    markdown += `### Confidence Distribution\n\n`;
    Object.entries(charts.confidenceDistribution).forEach(([range, count]) => {
      const bar = '█'.repeat(Math.floor(count / 2));
      markdown += `${range}: ${bar} (${count})\n`;
    });
    markdown += `\n`;

    return markdown;
  }
}

/**
 * Create quality metrics dashboard
 */
export function createQualityDashboard(
  brandConfig: BrandConfiguration
): QualityMetricsDashboard {
  return new QualityMetricsDashboard(brandConfig);
}
