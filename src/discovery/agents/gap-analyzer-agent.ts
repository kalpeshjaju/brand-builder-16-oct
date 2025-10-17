/**
 * Gap Analyzer Agent
 * Identifies gaps between brand aspirations and current reality
 * Part of the Discovery Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig } from '../../core/base-agent.js';

/**
 * Gap finding structure
 */
interface GapFinding {
  type: 'strategy' | 'capability' | 'market' | 'perception' | 'experience' | 'content';
  severity: 'critical' | 'high' | 'medium' | 'low';
  current: string;
  desired: string;
  gap: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  recommendation: string;
}

/**
 * Gap analysis result
 */
interface GapAnalysis {
  totalGaps: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  findings: GapFinding[];
  overallGapScore: number; // 0-10
  readinessScore: number; // 0-10
}

/**
 * Gap Analyzer Agent
 * Finds gaps between where brands are and where they want to be
 */
export class GapAnalyzerAgent extends BaseAgent {
  constructor(llmService?: any) {
    const config: AgentConfig = {
      name: 'Gap Analyzer',
      version: '1.0.0',
      description: 'Identifies gaps between brand aspirations and reality',
      timeout: 30000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze brand for gaps
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting gap analysis');

    try {
      // Extract brand information
      const brandData = await this.extractBrandData(input);

      // Identify gaps
      const gaps = await this.identifyGaps(brandData);

      // Analyze gaps
      const analysis = this.analyzeGaps(gaps);

      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);

      // Calculate confidence
      const confidence = this.calculateConfidence(analysis);

      this.log(`Analysis complete: Found ${analysis.totalGaps} gaps`);

      return this.createOutput(
        analysis,
        recommendations,
        confidence,
        'success'
      );

    } catch (error) {
      this.log(`Analysis failed: ${error}`, 'error');
      return this.createErrorOutput(error instanceof Error ? error.message : 'Analysis failed');
    }
  }

  /**
   * Extract brand data for analysis
   */
  private async extractBrandData(input: AgentInput): Promise<any> {
    return {
      brandName: input.brandName,
      currentState: {
        positioning: input.data?.currentPositioning || 'Unknown',
        capabilities: input.data?.currentCapabilities || [],
        resources: input.data?.currentResources || [],
        performance: input.data?.currentPerformance || {},
      },
      desiredState: {
        vision: input.data?.vision || 'Not defined',
        goals: input.data?.goals || [],
        targetPosition: input.data?.targetPosition || 'Not defined',
        requiredCapabilities: input.data?.requiredCapabilities || [],
      },
      market: {
        competitors: input.data?.competitors || [],
        customerExpectations: input.data?.customerExpectations || [],
        industryBenchmarks: input.data?.industryBenchmarks || {},
      },
    };
  }

  /**
   * Identify gaps in brand
   */
  private async identifyGaps(brandData: any): Promise<GapFinding[]> {
    const gaps: GapFinding[] = [];

    // Strategy gaps
    gaps.push(...this.identifyStrategyGaps(brandData));

    // Capability gaps
    gaps.push(...this.identifyCapabilityGaps(brandData));

    // Market gaps
    gaps.push(...this.identifyMarketGaps(brandData));

    // Perception gaps
    gaps.push(...this.identifyPerceptionGaps(brandData));

    // Experience gaps
    gaps.push(...this.identifyExperienceGaps(brandData));

    // Content gaps
    gaps.push(...this.identifyContentGaps(brandData));

    return gaps;
  }

  /**
   * Identify strategy gaps
   */
  private identifyStrategyGaps(brandData: any): GapFinding[] {
    const gaps: GapFinding[] = [];

    // Example strategy gaps
    if (!brandData.currentState.positioning || brandData.currentState.positioning === 'Unknown') {
      gaps.push({
        type: 'strategy',
        severity: 'critical',
        current: 'No clear positioning defined',
        desired: 'Distinct market positioning',
        gap: 'Brand lacks clear positioning strategy',
        impact: 'Unable to differentiate from competitors',
        effort: 'medium',
        priority: 10,
        recommendation: 'Develop clear positioning statement based on unique value proposition',
      });
    }

    if (!brandData.desiredState.vision || brandData.desiredState.vision === 'Not defined') {
      gaps.push({
        type: 'strategy',
        severity: 'high',
        current: 'No articulated vision',
        desired: 'Clear long-term vision',
        gap: 'Missing strategic vision for future',
        impact: 'Lack of direction for growth and decision-making',
        effort: 'low',
        priority: 9,
        recommendation: 'Define 3-5 year vision aligned with market opportunities',
      });
    }

    return gaps;
  }

  /**
   * Identify capability gaps
   */
  private identifyCapabilityGaps(brandData: any): GapFinding[] {
    const gaps: GapFinding[] = [];

    const currentCaps = new Set(brandData.currentState.capabilities);
    const requiredCaps = brandData.desiredState.requiredCapabilities;

    for (const required of requiredCaps) {
      if (!currentCaps.has(required)) {
        gaps.push({
          type: 'capability',
          severity: 'high',
          current: 'Capability not present',
          desired: required,
          gap: `Missing capability: ${required}`,
          impact: 'Cannot execute on strategic objectives',
          effort: 'high',
          priority: 8,
          recommendation: `Build or acquire ${required} capability through hiring or partnerships`,
        });
      }
    }

    return gaps;
  }

  /**
   * Identify market gaps
   */
  private identifyMarketGaps(brandData: any): GapFinding[] {
    const gaps: GapFinding[] = [];

    // Example market gaps based on competitor analysis
    if (brandData.market.competitors.length > 0) {
      gaps.push({
        type: 'market',
        severity: 'medium',
        current: 'Limited market share',
        desired: 'Leadership position',
        gap: 'Behind key competitors in market presence',
        impact: 'Reduced brand awareness and customer acquisition',
        effort: 'high',
        priority: 7,
        recommendation: 'Increase market visibility through targeted campaigns',
      });
    }

    return gaps;
  }

  /**
   * Identify perception gaps
   */
  private identifyPerceptionGaps(brandData: any): GapFinding[] {
    void brandData; // Used in full implementation
    return [{
      type: 'perception',
      severity: 'medium',
      current: 'Unknown brand perception',
      desired: 'Premium quality perception',
      gap: 'Gap between intended and actual brand perception',
      impact: 'Customers may not value brand appropriately',
      effort: 'medium',
      priority: 6,
      recommendation: 'Conduct perception study and adjust messaging',
    }];
  }

  /**
   * Identify experience gaps
   */
  private identifyExperienceGaps(brandData: any): GapFinding[] {
    void brandData; // Used in full implementation
    return [{
      type: 'experience',
      severity: 'medium',
      current: 'Inconsistent customer experience',
      desired: 'Seamless omnichannel experience',
      gap: 'Fragmented experience across touchpoints',
      impact: 'Customer frustration and churn',
      effort: 'high',
      priority: 7,
      recommendation: 'Map and standardize customer journey across all channels',
    }];
  }

  /**
   * Identify content gaps
   */
  private identifyContentGaps(_brandData: any): GapFinding[] {
    return [{
      type: 'content',
      severity: 'low',
      current: 'Basic content presence',
      desired: 'Rich content ecosystem',
      gap: 'Limited educational and engagement content',
      impact: 'Lower customer engagement and SEO performance',
      effort: 'medium',
      priority: 5,
      recommendation: 'Develop content strategy with regular publishing calendar',
    }];
  }

  /**
   * Analyze gaps and create summary
   */
  private analyzeGaps(gaps: GapFinding[]): GapAnalysis {
    const analysis: GapAnalysis = {
      totalGaps: gaps.length,
      bySeverity: {},
      byType: {},
      findings: gaps.sort((a, b) => b.priority - a.priority),
      overallGapScore: 0,
      readinessScore: 0,
    };

    // Count by severity and type
    for (const gap of gaps) {
      analysis.bySeverity[gap.severity] = (analysis.bySeverity[gap.severity] || 0) + 1;
      analysis.byType[gap.type] = (analysis.byType[gap.type] || 0) + 1;
    }

    // Calculate scores
    analysis.overallGapScore = this.calculateGapScore(analysis);
    analysis.readinessScore = 10 - analysis.overallGapScore; // Inverse of gap score

    return analysis;
  }

  /**
   * Calculate overall gap score
   */
  private calculateGapScore(analysis: GapAnalysis): number {
    const severityWeights = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 1,
    };

    let totalWeight = 0;
    for (const [severity, count] of Object.entries(analysis.bySeverity)) {
      totalWeight += (severityWeights[severity as keyof typeof severityWeights] || 0) * count;
    }

    // Normalize to 0-10 scale
    return Math.min(10, totalWeight / 10);
  }

  /**
   * Generate recommendations based on findings
   */
  protected override generateRecommendations(analysis: GapAnalysis): string[] {
    const recommendations: string[] = [];

    // Priority recommendations based on severity
    if (analysis.bySeverity['critical'] && analysis.bySeverity['critical'] > 0) {
      recommendations.push(
        'URGENT: Address critical gaps immediately to prevent competitive disadvantage'
      );
    }

    if (analysis.bySeverity['high'] && analysis.bySeverity['high'] > 0) {
      recommendations.push(
        'Prioritize high-severity gaps in next quarter planning'
      );
    }

    // Type-specific recommendations
    if (analysis.byType['strategy'] && analysis.byType['strategy'] > 0) {
      recommendations.push(
        'Conduct strategic planning session to define positioning and vision'
      );
    }

    if (analysis.byType['capability'] && analysis.byType['capability'] > 0) {
      recommendations.push(
        'Assess build vs. buy vs. partner options for capability gaps'
      );
    }

    // General recommendations
    recommendations.push(
      'Create gap closure roadmap with timeline and resources',
      'Establish KPIs to track gap closure progress',
      'Review and update gap analysis quarterly'
    );

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  protected override calculateConfidence(analysis: GapAnalysis): number {
    const factors = {
      hasFindings: analysis.totalGaps > 0 ? 3 : 1,
      findingDiversity: Math.min(3, Object.keys(analysis.byType).length),
      severityRange: Math.min(2, Object.keys(analysis.bySeverity).length),
      dataCompleteness: 2,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}