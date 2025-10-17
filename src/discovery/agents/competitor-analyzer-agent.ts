/**
 * Competitor Analyzer Agent
 * Analyzes competitive landscape and positioning
 * Part of the Discovery Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig } from '../../core/base-agent.js';

/**
 * Competitor profile structure
 */
interface CompetitorProfile {
  name: string;
  type: 'direct' | 'indirect' | 'aspirational' | 'substitute';
  marketShare: number;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  uniqueValue: string;
  targetSegments: string[];
  pricingStrategy: 'premium' | 'competitive' | 'budget' | 'freemium';
  competitiveMoat: string[];
  vulnerabilities: string[];
}

/**
 * Competitive analysis result
 */
interface CompetitiveAnalysis {
  totalCompetitors: number;
  directCompetitors: CompetitorProfile[];
  indirectCompetitors: CompetitorProfile[];
  marketLeader: string;
  competitiveIntensity: 'low' | 'medium' | 'high' | 'extreme';
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
  whitespaceOpportunities: string[];
  differentiationOpportunities: string[];
  threatLevel: number; // 1-10
  opportunityScore: number; // 1-10
}

/**
 * Competitor Analyzer Agent
 * Provides deep competitive intelligence and positioning insights
 */
export class CompetitorAnalyzerAgent extends BaseAgent {
  constructor(llmService?: any) {
    const config: AgentConfig = {
      name: 'Competitor Analyzer',
      version: '1.0.0',
      description: 'Analyzes competitive landscape and opportunities',
      timeout: 45000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze competitors
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting competitive analysis');

    try {
      // Extract competitor data
      const competitorData = await this.extractCompetitorData(input);

      // Analyze each competitor
      const competitors = await this.analyzeCompetitors(competitorData);

      // Identify competitive dynamics
      const dynamics = await this.analyzeCompetitiveDynamics(competitors);

      // Find opportunities
      const opportunities = await this.identifyOpportunities(competitors, dynamics);

      // Create comprehensive analysis
      const analysis = this.createCompetitiveAnalysis(
        competitors,
        dynamics,
        opportunities
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);

      // Calculate confidence
      const confidence = this.calculateConfidence(analysis);

      this.log(`Analysis complete: ${analysis.totalCompetitors} competitors analyzed`);

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
   * Extract competitor data
   */
  private async extractCompetitorData(input: AgentInput): Promise<any> {
    return {
      brandName: input.brandName,
      competitors: input.data?.competitors || [],
      industry: input.data?.industry || 'Unknown',
      marketData: input.data?.marketData || {},
      customerFeedback: input.data?.customerFeedback || {},
      pricingData: input.data?.pricingData || {},
    };
  }

  /**
   * Analyze competitors
   */
  private async analyzeCompetitors(competitorData: any): Promise<CompetitorProfile[]> {
    void competitorData; // Used in full implementation with LLM
    // Example competitors - would use LLM and data in production
    const competitors: CompetitorProfile[] = [
      {
        name: 'Market Leader Inc',
        type: 'direct',
        marketShare: 35,
        positioning: 'Enterprise-grade solution with premium features',
        strengths: [
          'Strong brand recognition',
          'Large customer base',
          'Extensive feature set',
          'Global presence',
        ],
        weaknesses: [
          'High pricing',
          'Complex implementation',
          'Slow innovation',
          'Poor customer support',
        ],
        opportunities: [
          'Vulnerable to disruption',
          'Customer dissatisfaction areas',
          'Underserved segments',
        ],
        threats: [
          'Resource advantage',
          'Market dominance',
          'Partnership network',
        ],
        uniqueValue: 'Industry standard with ecosystem',
        targetSegments: ['Enterprise', 'Government'],
        pricingStrategy: 'premium',
        competitiveMoat: ['Brand', 'Switching costs', 'Network effects'],
        vulnerabilities: ['Price sensitivity', 'User experience', 'Mobile capabilities'],
      },
      {
        name: 'Disruptor Co',
        type: 'direct',
        marketShare: 15,
        positioning: 'Modern, affordable alternative',
        strengths: [
          'Innovative features',
          'Competitive pricing',
          'Great UX',
          'Fast growth',
        ],
        weaknesses: [
          'Limited scale',
          'Brand awareness',
          'Feature gaps',
          'Support coverage',
        ],
        opportunities: [
          'Partnership potential',
          'Acquisition target',
          'Market education',
        ],
        threats: [
          'Aggressive growth',
          'VC funding',
          'Talent acquisition',
        ],
        uniqueValue: 'Best user experience',
        targetSegments: ['SMB', 'Mid-Market'],
        pricingStrategy: 'competitive',
        competitiveMoat: ['Product innovation', 'Customer love'],
        vulnerabilities: ['Enterprise features', 'Global coverage', 'Compliance'],
      },
      {
        name: 'Legacy Systems Corp',
        type: 'indirect',
        marketShare: 20,
        positioning: 'Traditional on-premise solution',
        strengths: [
          'Installed base',
          'Industry expertise',
          'Customization',
          'Security',
        ],
        weaknesses: [
          'Outdated technology',
          'High maintenance',
          'Poor mobile',
          'Slow updates',
        ],
        opportunities: [
          'Migration targets',
          'Dissatisfied customers',
          'Cloud transition',
        ],
        threats: [
          'Sticky customers',
          'Industry relationships',
          'Regulatory compliance',
        ],
        uniqueValue: 'Industry-specific features',
        targetSegments: ['Traditional enterprises', 'Regulated industries'],
        pricingStrategy: 'premium',
        competitiveMoat: ['Switching costs', 'Compliance', 'Customization'],
        vulnerabilities: ['Cloud migration', 'Modern features', 'User expectations'],
      },
    ];

    return competitors;
  }

  /**
   * Analyze competitive dynamics
   */
  private async analyzeCompetitiveDynamics(competitors: CompetitorProfile[]): Promise<any> {
    const totalShare = competitors.reduce((sum, c) => sum + c.marketShare, 0);
    const avgShare = totalShare / competitors.length;

    return {
      marketConcentration: totalShare > 70 ? 'high' : totalShare > 50 ? 'medium' : 'low',
      competitionType: avgShare > 20 ? 'oligopoly' : avgShare > 10 ? 'competitive' : 'fragmented',
      innovationRate: 'high', // Would analyze based on feature releases
      customerChurn: 'medium', // Would analyze based on switching data
      priceCompetition: 'intense', // Would analyze based on pricing trends
      differentiationLevel: 'moderate', // Would analyze based on positioning
    };
  }

  /**
   * Identify opportunities
   */
  private async identifyOpportunities(
    competitors: CompetitorProfile[],
    _dynamics: any
  ): Promise<any> {
    void _dynamics; // Used in full implementation
    const opportunities = {
      whitespace: [] as string[],
      differentiation: [] as string[],
      positioning: [] as string[],
      strategic: [] as string[],
    };

    // Find whitespace opportunities
    const servedSegments = new Set(competitors.flatMap(c => c.targetSegments));
    const allSegments = ['Enterprise', 'Mid-Market', 'SMB', 'Startups', 'Government', 'Education'];
    opportunities.whitespace = allSegments.filter(s => !servedSegments.has(s));

    // Find differentiation opportunities
    const commonWeaknesses = this.findCommonWeaknesses(competitors);
    opportunities.differentiation = commonWeaknesses.map(w => `Address: ${w}`);

    // Find positioning opportunities
    opportunities.positioning = [
      'Position as modern alternative to legacy solutions',
      'Focus on underserved mid-market segment',
      'Emphasize ease of use vs complexity',
    ];

    // Find strategic opportunities
    opportunities.strategic = [
      'Partner with complementary solutions',
      'Acquire innovative startups',
      'Expand into adjacent markets',
    ];

    return opportunities;
  }

  /**
   * Find common weaknesses across competitors
   */
  private findCommonWeaknesses(competitors: CompetitorProfile[]): string[] {
    const weaknessCount: Record<string, number> = {};

    competitors.forEach(c => {
      c.weaknesses.forEach(w => {
        const key = w.toLowerCase();
        weaknessCount[key] = (weaknessCount[key] || 0) + 1;
      });
    });

    // Return weaknesses that appear in multiple competitors
    return Object.entries(weaknessCount)
      .filter(([_, count]) => count > 1)
      .map(([weakness, _]) => weakness);
  }

  /**
   * Create comprehensive competitive analysis
   */
  private createCompetitiveAnalysis(
    competitors: CompetitorProfile[],
    dynamics: any,
    opportunities: any
  ): CompetitiveAnalysis {
    const directCompetitors = competitors.filter(c => c.type === 'direct');
    const indirectCompetitors = competitors.filter(c => c.type === 'indirect');

    const analysis: CompetitiveAnalysis = {
      totalCompetitors: competitors.length,
      directCompetitors,
      indirectCompetitors,
      marketLeader: competitors.reduce((leader, c) =>
        c.marketShare > leader.marketShare ? c : leader
      ).name,
      competitiveIntensity: this.calculateIntensity(competitors, dynamics),
      competitiveAdvantages: [
        'Agility and speed to market',
        'Modern technology stack',
        'Customer-centric approach',
        'Competitive pricing',
      ],
      competitiveDisadvantages: [
        'Limited brand recognition',
        'Smaller resource base',
        'Less mature product',
        'Limited geographic presence',
      ],
      whitespaceOpportunities: opportunities.whitespace,
      differentiationOpportunities: opportunities.differentiation,
      threatLevel: this.calculateThreatLevel(competitors),
      opportunityScore: this.calculateOpportunityScore(opportunities),
    };

    return analysis;
  }

  /**
   * Calculate competitive intensity
   */
  private calculateIntensity(
    competitors: CompetitorProfile[],
    dynamics: any
  ): 'low' | 'medium' | 'high' | 'extreme' {
    const factors = {
      competitorCount: competitors.length > 10 ? 3 : competitors.length > 5 ? 2 : 1,
      marketConcentration: dynamics.marketConcentration === 'high' ? 3 : 2,
      priceCompetition: dynamics.priceCompetition === 'intense' ? 3 : 2,
    };

    const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);

    if (totalScore >= 8) return 'extreme';
    if (totalScore >= 6) return 'high';
    if (totalScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Calculate threat level
   */
  private calculateThreatLevel(competitors: CompetitorProfile[]): number {
    let threatScore = 0;

    competitors.forEach(c => {
      if (c.type === 'direct') threatScore += 3;
      if (c.marketShare > 20) threatScore += 2;
      if (c.strengths.length > 5) threatScore += 1;
    });

    return Math.min(10, threatScore);
  }

  /**
   * Calculate opportunity score
   */
  private calculateOpportunityScore(opportunities: any): number {
    let score = 0;

    score += Math.min(3, opportunities.whitespace.length);
    score += Math.min(3, opportunities.differentiation.length);
    score += Math.min(2, opportunities.positioning.length);
    score += Math.min(2, opportunities.strategic.length);

    return Math.min(10, score);
  }

  /**
   * Generate recommendations based on findings
   */
  protected override generateRecommendations(analysis: CompetitiveAnalysis): string[] {
    const recommendations: string[] = [];

    // Intensity-based recommendations
    if (analysis.competitiveIntensity === 'extreme' || analysis.competitiveIntensity === 'high') {
      recommendations.push(
        'Focus on clear differentiation to stand out',
        'Consider niche positioning to avoid direct competition'
      );
    }

    // Opportunity-based recommendations
    if (analysis.opportunityScore > 7) {
      recommendations.push(
        'Aggressively pursue whitespace opportunities',
        'Fast-track differentiation initiatives'
      );
    }

    // Threat-based recommendations
    if (analysis.threatLevel > 7) {
      recommendations.push(
        'Build defensive moats around core strengths',
        'Consider strategic partnerships for scale'
      );
    }

    // General strategic recommendations
    recommendations.push(
      'Monitor competitor moves weekly',
      'Conduct win/loss analysis against each competitor',
      'Build competitive intelligence system',
      'Create battle cards for sales team'
    );

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  protected override calculateConfidence(analysis: CompetitiveAnalysis): number {
    const factors = {
      competitorData: analysis.totalCompetitors > 0 ? 3 : 0,
      marketCoverage: analysis.directCompetitors.length > 0 ? 2 : 1,
      analysisDepth: 3, // Based on SWOT and positioning
      dataCompleteness: 2,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}