// Gap Analyzer - Identifies strategic gaps and prioritizes fixes

import type {
  StrategyGap,
  CheckpointResult,
  ValidationContext,
  CheckpointSeverity
} from '../types/validation-types.js';
import type { BrandStrategy } from '../types/index.js';
import { getAllCheckpoints } from './checkpoints.js';

export class GapAnalyzer {
  /**
   * Analyze gaps from checkpoint results
   */
  analyzeGaps(
    results: CheckpointResult[],
    strategy: BrandStrategy,
    context?: ValidationContext
  ): StrategyGap[] {
    const gaps: StrategyGap[] = [];

    // Analyze failed and warning checkpoints
    const issues = results.filter(r => r.status === 'fail' || r.status === 'warning');

    for (const issue of issues) {
      const checkpoint = getAllCheckpoints().find(cp => cp.id === issue.checkpointId);
      if (!checkpoint) continue;

      const gap = this.createGapFromCheckpoint(issue, checkpoint.category, checkpoint.severity, checkpoint.name);
      if (gap) {
        gaps.push(gap);
      }
    }

    // Add strategic gaps based on patterns
    gaps.push(...this.identifyStrategicGaps(strategy, results, context));

    // Sort by priority
    return gaps.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create gap from checkpoint failure
   */
  private createGapFromCheckpoint(
    result: CheckpointResult,
    category: string,
    severity: CheckpointSeverity,
    checkpointName: string
  ): StrategyGap | null {
    if (result.status === 'pass' || result.status === 'skipped') return null;

    const priority = this.calculatePriority(severity, result.score);
    const effort = this.estimateEffort(result);

    return {
      id: `GAP-${result.checkpointId}`,
      category,
      title: `${checkpointName} - ${result.message}`,
      description: result.details || result.message,
      severity,
      impact: this.describeImpact(severity, checkpointName),
      effort,
      priority,
      relatedCheckpoints: [result.checkpointId],
      recommendations: result.suggestions || []
    };
  }

  /**
   * Calculate priority (1-10, higher = more urgent)
   */
  private calculatePriority(severity: CheckpointSeverity, score: number): number {
    const severityWeight = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 2
    };

    const base = severityWeight[severity];
    const adjustment = Math.round((100 - score) / 20); // 0-5 based on how far from perfect

    return Math.min(10, base + adjustment);
  }

  /**
   * Estimate effort to fix
   */
  private estimateEffort(result: CheckpointResult): 'low' | 'medium' | 'high' {
    // Simple heuristic based on score
    if (result.score === 0) return 'high';
    if (result.score < 50) return 'medium';
    return 'low';
  }

  /**
   * Describe impact of gap
   */
  private describeImpact(severity: CheckpointSeverity, checkpointName: string): string {
    const impacts = {
      critical: `Critical impact on brand strategy execution. ${checkpointName} is fundamental to strategic success.`,
      high: `High impact on brand effectiveness. ${checkpointName} significantly affects brand performance.`,
      medium: `Medium impact on brand perception. ${checkpointName} influences brand consistency.`,
      low: `Low impact on immediate execution. ${checkpointName} is a nice-to-have improvement.`
    };

    return impacts[severity];
  }

  /**
   * Identify strategic gaps beyond individual checkpoints
   */
  private identifyStrategicGaps(
    strategy: BrandStrategy,
    results: CheckpointResult[],
    context?: ValidationContext
  ): StrategyGap[] {
    const strategicGaps: StrategyGap[] = [];

    // Gap 1: Incomplete Foundation
    const foundationResults = results.filter(r => r.checkpointId.startsWith('F'));
    const foundationScore = foundationResults.reduce((sum, r) => sum + r.score, 0) / foundationResults.length;

    if (foundationScore < 70) {
      strategicGaps.push({
        id: 'GAP-FOUNDATION',
        category: 'foundation',
        title: 'Incomplete Brand Foundation',
        description: 'Core brand foundation elements (purpose, mission, vision, values) are incomplete or weak, affecting all downstream strategy elements.',
        severity: 'critical',
        impact: 'Without a strong foundation, all other strategy elements lack grounding and coherence.',
        effort: 'high',
        priority: 10,
        relatedCheckpoints: foundationResults.map(r => r.checkpointId),
        recommendations: [
          'Conduct brand foundation workshop',
          'Define or refine purpose, mission, vision, and values',
          'Ensure alignment across all foundation elements',
          'Get stakeholder buy-in on core foundation'
        ]
      });
    }

    // Gap 2: Weak Differentiation
    const hasPositioning = !!strategy.positioning;
    const hasDifferentiators = strategy.differentiators && strategy.differentiators.length >= 3;

    if (!hasPositioning || !hasDifferentiators) {
      strategicGaps.push({
        id: 'GAP-DIFFERENTIATION',
        category: 'strategic',
        title: 'Unclear Competitive Differentiation',
        description: 'Brand lacks clear differentiation from competitors, risking commoditization and price competition.',
        severity: 'critical',
        impact: 'Without clear differentiation, brand cannot command premium pricing or build loyal customer base.',
        effort: 'high',
        priority: 9,
        relatedCheckpoints: ['S01', 'S03'],
        recommendations: [
          'Conduct competitive analysis',
          'Identify unique value propositions',
          'Define 3-5 clear differentiators',
          'Validate differentiation with target customers'
        ]
      });
    }

    // Gap 3: Missing Voice & Messaging
    const hasVoice = !!strategy.voiceAndTone?.voice;
    const hasMessages = strategy.keyMessages && strategy.keyMessages.length >= 3;

    if (!hasVoice || !hasMessages) {
      strategicGaps.push({
        id: 'GAP-MESSAGING',
        category: 'messaging',
        title: 'Incomplete Messaging Framework',
        description: 'Brand voice and key messages are not fully defined, leading to inconsistent communication.',
        severity: 'high',
        impact: 'Inconsistent messaging confuses customers and dilutes brand identity.',
        effort: 'medium',
        priority: 7,
        relatedCheckpoints: ['V01', 'V03'],
        recommendations: [
          'Define brand voice and tone guidelines',
          'Develop 3-5 core brand messages',
          'Create messaging hierarchy',
          'Train team on voice and messaging standards'
        ]
      });
    }

    // Gap 4: No Market Intelligence
    const hasMarketData = context?.evolutionOutputs;
    if (!hasMarketData) {
      strategicGaps.push({
        id: 'GAP-MARKET-INTELLIGENCE',
        category: 'market',
        title: 'Limited Market Intelligence',
        description: 'Strategy lacks market research, customer insights, and competitive intelligence.',
        severity: 'high',
        impact: 'Strategy based on assumptions rather than market reality, risking misalignment with customer needs.',
        effort: 'high',
        priority: 8,
        relatedCheckpoints: ['M01', 'M02', 'M03', 'M04'],
        recommendations: [
          'Run Brand Evolution Workshop',
          'Conduct customer research and interviews',
          'Perform competitive analysis',
          'Identify market trends and inflection points'
        ]
      });
    }

    // Gap 5: Low Implementation Readiness
    const implementationResults = results.filter(r => r.checkpointId.startsWith('I'));
    const implementationScore = implementationResults.reduce((sum, r) => sum + r.score, 0) / implementationResults.length;

    if (implementationScore < 70) {
      strategicGaps.push({
        id: 'GAP-IMPLEMENTATION',
        category: 'implementation',
        title: 'Low Implementation Readiness',
        description: 'Strategy is not ready for execution - missing critical components or actionable guidance.',
        severity: 'high',
        impact: 'Teams cannot execute effectively without clear, complete, and actionable strategy.',
        effort: 'medium',
        priority: 8,
        relatedCheckpoints: implementationResults.map(r => r.checkpointId),
        recommendations: [
          'Complete all missing strategy components',
          'Add specific implementation guidance',
          'Define success metrics',
          'Create execution roadmap'
        ]
      });
    }

    return strategicGaps;
  }

  /**
   * Get gap summary statistics
   */
  getGapSummary(gaps: StrategyGap[]) {
    return {
      total: gaps.length,
      critical: gaps.filter(g => g.severity === 'critical').length,
      high: gaps.filter(g => g.severity === 'high').length,
      medium: gaps.filter(g => g.severity === 'medium').length,
      low: gaps.filter(g => g.severity === 'low').length,
      highEffort: gaps.filter(g => g.effort === 'high').length,
      mediumEffort: gaps.filter(g => g.effort === 'medium').length,
      lowEffort: gaps.filter(g => g.effort === 'low').length,
      highPriority: gaps.filter(g => g.priority >= 8).length
    };
  }
}
