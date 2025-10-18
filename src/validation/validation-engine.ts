// Enhanced Validation Engine - Runs all 26 checkpoints and generates reports

import type {
  ValidationReport,
  ValidationContext,
  CheckpointResult,
  StrategyGap
} from '../types/validation-types.js';
import type { BrandStrategy } from '../types/index.js';
import { CHECKPOINT_CATEGORIES, getAllCheckpoints } from './checkpoints.js';
import { GapAnalyzer } from './gap-analyzer.js';
import { FixTracker } from './fix-tracker.js';

export class ValidationEngine {
  private gapAnalyzer: GapAnalyzer;
  private fixTracker: FixTracker;

  constructor(brandName: string) {
    this.gapAnalyzer = new GapAnalyzer();
    this.fixTracker = new FixTracker(brandName);
  }

  /**
   * Run complete validation on a brand strategy
   */
  async validate(
    strategy: BrandStrategy,
    brandName: string,
    context?: ValidationContext
  ): Promise<ValidationReport> {
    // 1. Run all checkpoints
    const checkpointResults = await this.runAllCheckpoints(strategy, context);

    // 2. Analyze gaps
    const gaps = this.gapAnalyzer.analyzeGaps(checkpointResults, strategy, context);

    // 3. Load existing fixes
    const fixes = await this.fixTracker.loadFixes();

    // 4. Calculate summary
    const summary = this.calculateSummary(checkpointResults);

    // 5. Calculate overall score (weighted by category)
    const overallScore = this.calculateWeightedScore(checkpointResults);

    // 6. Generate recommendations
    const recommendations = this.generateRecommendations(checkpointResults, gaps);

    return {
      brandName,
      validatedAt: new Date().toISOString(),
      overallScore,
      checkpointResults,
      gaps,
      fixes,
      summary,
      recommendations
    };
  }

  /**
   * Run all 26 checkpoints
   */
  private async runAllCheckpoints(
    strategy: BrandStrategy,
    context?: ValidationContext
  ): Promise<CheckpointResult[]> {
    const allCheckpoints = getAllCheckpoints();
    const results: CheckpointResult[] = [];

    for (const checkpoint of allCheckpoints) {
      try {
        const result = checkpoint.validator(strategy, context);
        results.push(result);
      } catch (error) {
        // If checkpoint fails, mark as error
        results.push({
          checkpointId: checkpoint.id,
          status: 'fail',
          score: 0,
          message: `Checkpoint error: ${(error as Error).message}`
        });
      }
    }

    return results;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(results: CheckpointResult[]): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const category of CHECKPOINT_CATEGORIES) {
      const categoryResults = results.filter(r =>
        category.checkpoints.some(cp => cp.id === r.checkpointId)
      );

      const categoryScore =
        categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;

      totalWeightedScore += categoryScore * category.weight;
      totalWeight += category.weight;
    }

    return Math.round(totalWeightedScore / totalWeight);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: CheckpointResult[]) {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const allCheckpoints = getAllCheckpoints();
    const criticalIssues = results.filter(r =>
      r.status === 'fail' &&
      allCheckpoints.find(cp => cp.id === r.checkpointId)?.severity === 'critical'
    ).length;

    const highPriorityIssues = results.filter(r =>
      (r.status === 'fail' || r.status === 'warning') &&
      allCheckpoints.find(cp => cp.id === r.checkpointId)?.severity === 'high'
    ).length;

    return {
      totalCheckpoints: results.length,
      passed,
      failed,
      warnings,
      skipped,
      criticalIssues,
      highPriorityIssues
    };
  }

  /**
   * Generate prioritized recommendations
   */
  private generateRecommendations(
    results: CheckpointResult[],
    gaps: StrategyGap[]
  ) {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate: Critical failures
    const criticalFailures = results.filter(r =>
      r.status === 'fail' &&
      getAllCheckpoints().find(cp => cp.id === r.checkpointId)?.severity === 'critical'
    );

    criticalFailures.forEach(r => {
      if (r.suggestions && r.suggestions.length > 0) {
        immediate.push(...r.suggestions);
      } else {
        immediate.push(r.message);
      }
    });

    // Short-term: High priority failures and critical gaps
    const highPriorityIssues = results.filter(r =>
      (r.status === 'fail' || r.status === 'warning') &&
      getAllCheckpoints().find(cp => cp.id === r.checkpointId)?.severity === 'high'
    );

    highPriorityIssues.forEach(r => {
      if (r.suggestions && r.suggestions.length > 0) {
        shortTerm.push(...r.suggestions);
      }
    });

    const criticalGaps = gaps.filter(g => g.priority >= 8);
    criticalGaps.forEach(g => {
      shortTerm.push(...g.recommendations);
    });

    // Long-term: Medium/low priority improvements
    const mediumPriorityGaps = gaps.filter(g => g.priority >= 5 && g.priority < 8);
    mediumPriorityGaps.forEach(g => {
      longTerm.push(...g.recommendations);
    });

    return {
      immediate: [...new Set(immediate)].slice(0, 5), // Top 5 unique
      shortTerm: [...new Set(shortTerm)].slice(0, 10), // Top 10 unique
      longTerm: [...new Set(longTerm)].slice(0, 10) // Top 10 unique
    };
  }

  /**
   * Get checkpoint results by category
   */
  getCategoryResults(results: CheckpointResult[], categoryId: string): CheckpointResult[] {
    const category = CHECKPOINT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return [];

    return results.filter(r =>
      category.checkpoints.some(cp => cp.id === r.checkpointId)
    );
  }

  /**
   * Get category score
   */
  getCategoryScore(results: CheckpointResult[], categoryId: string): number {
    const categoryResults = this.getCategoryResults(results, categoryId);
    if (categoryResults.length === 0) return 0;

    return Math.round(
      categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length
    );
  }
}
