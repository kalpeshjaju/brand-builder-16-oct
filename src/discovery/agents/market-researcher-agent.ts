/**
 * Market Researcher Agent
 * Analyzes market dynamics, trends, and opportunities
 * Part of the Discovery Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig, type AgentLLMService } from '../../core/base-agent.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Market segment structure
 */
interface MarketSegment {
  name: string;
  size: string;
  growthRate: string;
  competitionLevel: 'low' | 'medium' | 'high';
  attractiveness: number; // 1-10
  barriers: string[];
  opportunities: string[];
}

/**
 * Market trend structure
 */
interface MarketTrend {
  name: string;
  type: 'technology' | 'consumer' | 'regulatory' | 'economic' | 'social';
  impact: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  relevance: number; // 1-10
  description: string;
  implications: string[];
}

/**
 * Market research result
 */
interface MarketResearchResult {
  marketSize: string;
  marketGrowth: string;
  segments: MarketSegment[];
  trends: MarketTrend[];
  keyDrivers: string[];
  challenges: string[];
  opportunities: string[];
  competitiveLandscape: {
    intensity: 'low' | 'medium' | 'high';
    keyPlayers: string[];
    marketShare: Record<string, number>;
  };
  marketMaturity: 'emerging' | 'growth' | 'mature' | 'declining';
  attractivenessScore: number; // 1-10
}

/**
 * Market Researcher Agent
 * Provides comprehensive market analysis and insights
 */
export class MarketResearcherAgent extends BaseAgent {
  constructor(llmService?: AgentLLMService) {
    const config: AgentConfig = {
      name: 'Market Researcher',
      version: '1.0.0',
      description: 'Analyzes market dynamics and opportunities',
      timeout: 45000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze market
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting market research analysis');

    try {
      // Extract market data
      const marketData = await this.extractMarketData(input);

      // Analyze market segments
      const segments = await this.analyzeSegments(marketData);

      // Identify trends
      const trends = await this.identifyTrends(marketData);

      // Analyze competitive landscape
      const competitiveLandscape = await this.analyzeCompetition(marketData);

      // Create comprehensive analysis
      const analysis = this.createMarketAnalysis(
        marketData,
        segments,
        trends,
        competitiveLandscape
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);

      // Calculate confidence
      const confidence = this.calculateConfidence(analysis);

      this.log(`Analysis complete: ${analysis.segments.length} segments, ${analysis.trends.length} trends identified`);

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
   * Extract market data
   */
  private async extractMarketData(input: AgentInput): Promise<any> {
    const rawData = isRecord(input.data) ? input.data : {};
    const industryValue = rawData['industry'];
    const categoryValue = rawData['category'];
    const geographyValue = rawData['geography'];
    const marketSizeValue = rawData['marketSize'];
    const competitorsValue = rawData['competitors'];
    const customerBaseValue = rawData['customerBase'];
    const regulationsValue = rawData['regulations'];
    const economicFactorsValue = rawData['economicFactors'];

    return {
      industry: typeof industryValue === 'string' ? industryValue : 'Unknown',
      category: typeof categoryValue === 'string' ? categoryValue : 'Unknown',
      geography: typeof geographyValue === 'string' ? geographyValue : 'Global',
      currentMarketSize: typeof marketSizeValue === 'string' ? marketSizeValue : 'Unknown',
      competitors: Array.isArray(competitorsValue) ? competitorsValue.map(String) : [],
      customerBase: isRecord(customerBaseValue) ? customerBaseValue : {},
      regulations: Array.isArray(regulationsValue) ? regulationsValue.map(String) : [],
      economicFactors: isRecord(economicFactorsValue) ? economicFactorsValue : {},
    };
  }

  /**
   * Analyze market segments
   */
  private async analyzeSegments(marketData: any): Promise<MarketSegment[]> {
    // Use LLM for intelligent segment analysis if available
    if (this.llmService) {
      try {
        const prompt = `Analyze market segments for the ${marketData.industry || 'target'} industry in ${marketData.geography || 'global'} markets.

Industry: ${marketData.industry || 'Unknown'}
Category: ${marketData.category || 'Unknown'}
Geography: ${marketData.geography || 'Global'}
Market Size: ${marketData.currentMarketSize || 'Unknown'}

Identify 3-5 key market segments with:
- Segment name
- Estimated market size
- Growth rate (% YoY)
- Competition level (low/medium/high)
- Attractiveness score (1-10)
- Entry barriers
- Key opportunities

Return as JSON array matching this structure:
{
  "segments": [
    {
      "name": "segment name",
      "size": "$XXB",
      "growthRate": "XX% YoY",
      "competitionLevel": "low|medium|high",
      "attractiveness": 1-10,
      "barriers": ["barrier1", "barrier2"],
      "opportunities": ["opportunity1", "opportunity2"]
    }
  ]
}`;

        const response = await this.llmService.analyze(prompt, 'market-segmentation');

        if (response.segments && Array.isArray(response.segments)) {
          return response.segments;
        }
      } catch (error) {
        this.log(`LLM analysis failed, using fallback: ${error}`, 'warn');
      }
    }

    // Fallback to example segments
    const segments: MarketSegment[] = [
      {
        name: 'Enterprise',
        size: '$50B',
        growthRate: '15% YoY',
        competitionLevel: 'high',
        attractiveness: 8,
        barriers: ['High acquisition cost', 'Long sales cycles', 'Complex requirements'],
        opportunities: ['Digital transformation', 'Cloud migration', 'AI adoption'],
      },
      {
        name: 'Mid-Market',
        size: '$30B',
        growthRate: '20% YoY',
        competitionLevel: 'medium',
        attractiveness: 9,
        barriers: ['Budget constraints', 'Resource limitations'],
        opportunities: ['Underserved segment', 'Growing fast', 'Open to innovation'],
      },
      {
        name: 'SMB',
        size: '$20B',
        growthRate: '25% YoY',
        competitionLevel: 'low',
        attractiveness: 7,
        barriers: ['Price sensitivity', 'High churn', 'Limited budgets'],
        opportunities: ['Large volume', 'Self-service potential', 'Viral growth'],
      },
    ];

    return segments;
  }

  /**
   * Identify market trends
   */
  private async identifyTrends(marketData: any): Promise<MarketTrend[]> {
    // Use LLM for intelligent trend analysis if available
    if (this.llmService) {
      try {
        const prompt = `Identify key market trends for the ${marketData.industry || 'target'} industry in ${marketData.geography || 'global'} markets.

Industry: ${marketData.industry || 'Unknown'}
Category: ${marketData.category || 'Unknown'}
Geography: ${marketData.geography || 'Global'}
Current Year: 2025

Identify 5-7 significant market trends across these types:
- Technology trends
- Consumer behavior trends
- Regulatory/compliance trends
- Economic trends
- Social/cultural trends

For each trend provide:
- Name
- Type (technology/consumer/regulatory/economic/social)
- Impact level (low/medium/high)
- Timeframe (short/medium/long term)
- Relevance score (1-10)
- Description
- Business implications

Return as JSON array matching this structure:
{
  "trends": [
    {
      "name": "trend name",
      "type": "technology|consumer|regulatory|economic|social",
      "impact": "low|medium|high",
      "timeframe": "short|medium|long",
      "relevance": 1-10,
      "description": "detailed description",
      "implications": ["implication1", "implication2"]
    }
  ]
}`;

        const response = await this.llmService.analyze(prompt, 'market-trends');

        if (response.trends && Array.isArray(response.trends)) {
          // Sort by relevance
          return response.trends.sort((a: MarketTrend, b: MarketTrend) => b.relevance - a.relevance);
        }
      } catch (error) {
        this.log(`LLM analysis failed, using fallback: ${error}`, 'warn');
      }
    }

    // Fallback to example trends
    const trends: MarketTrend[] = [
      {
        name: 'AI Integration',
        type: 'technology',
        impact: 'high',
        timeframe: 'short',
        relevance: 10,
        description: 'Rapid adoption of AI across all business functions',
        implications: [
          'Need for AI-powered features',
          'Competitive advantage through automation',
          'Changed customer expectations',
        ],
      },
      {
        name: 'Sustainability Focus',
        type: 'social',
        impact: 'high',
        timeframe: 'medium',
        relevance: 8,
        description: 'Growing demand for sustainable and ethical business practices',
        implications: [
          'Need for transparency',
          'ESG reporting requirements',
          'Consumer preference shift',
        ],
      },
      {
        name: 'Remote-First Economy',
        type: 'economic',
        impact: 'medium',
        timeframe: 'long',
        relevance: 7,
        description: 'Permanent shift to distributed work models',
        implications: [
          'Digital collaboration tools demand',
          'Changed buying patterns',
          'New decision-making processes',
        ],
      },
      {
        name: 'Data Privacy Regulations',
        type: 'regulatory',
        impact: 'high',
        timeframe: 'short',
        relevance: 9,
        description: 'Increasing data privacy laws and enforcement',
        implications: [
          'Compliance requirements',
          'Trust as differentiator',
          'Technical architecture changes',
        ],
      },
      {
        name: 'Subscription Economy',
        type: 'consumer',
        impact: 'medium',
        timeframe: 'medium',
        relevance: 8,
        description: 'Shift from ownership to subscription-based models',
        implications: [
          'Recurring revenue opportunities',
          'Customer lifetime value focus',
          'Retention over acquisition',
        ],
      },
    ];

    // Sort by relevance
    return trends.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Analyze competitive landscape
   */
  private async analyzeCompetition(marketData: any): Promise<any> {
    const competitors = marketData.competitors || [];

    return {
      intensity: competitors.length > 10 ? 'high' : competitors.length > 5 ? 'medium' : 'low',
      keyPlayers: competitors.slice(0, 5),
      marketShare: {
        'Market Leader': 35,
        'Challenger 1': 20,
        'Challenger 2': 15,
        'Others': 30,
      },
    };
  }

  /**
   * Create comprehensive market analysis
   */
  private createMarketAnalysis(
    marketData: any,
    segments: MarketSegment[],
    trends: MarketTrend[],
    competitiveLandscape: any
  ): MarketResearchResult {
    const analysis: MarketResearchResult = {
      marketSize: marketData.currentMarketSize || '$100B',
      marketGrowth: '18% CAGR',
      segments,
      trends,
      keyDrivers: [
        'Digital transformation acceleration',
        'Cloud adoption',
        'AI and automation demand',
        'Customer experience focus',
        'Regulatory compliance',
      ],
      challenges: [
        'Intense competition',
        'Rapid technology changes',
        'Customer acquisition costs',
        'Talent shortage',
        'Economic uncertainty',
      ],
      opportunities: [
        'Underserved segments',
        'Geographic expansion',
        'Product innovation',
        'Partnership ecosystems',
        'M&A consolidation',
      ],
      competitiveLandscape,
      marketMaturity: this.determineMaturity(marketData, segments, trends),
      attractivenessScore: this.calculateAttractiveness(segments, trends, competitiveLandscape),
    };

    return analysis;
  }

  /**
   * Determine market maturity
   */
  private determineMaturity(
    _marketData: any,
    segments: MarketSegment[],
    _trends: MarketTrend[]
  ): 'emerging' | 'growth' | 'mature' | 'declining' {
    // Simple logic based on average growth rate
    const avgGrowth = segments.reduce((sum, s) => {
      const rate = parseFloat(s.growthRate) || 0;
      return sum + rate;
    }, 0) / segments.length;

    if (avgGrowth > 25) return 'emerging';
    if (avgGrowth > 15) return 'growth';
    if (avgGrowth > 5) return 'mature';
    return 'declining';
  }

  /**
   * Calculate market attractiveness
   */
  private calculateAttractiveness(
    segments: MarketSegment[],
    trends: MarketTrend[],
    competitiveLandscape: any
  ): number {
    let score = 0;

    // Segment attractiveness (0-3 points)
    const avgSegmentScore = segments.reduce((sum, s) => sum + s.attractiveness, 0) / segments.length;
    score += (avgSegmentScore / 10) * 3;

    // Trend relevance (0-3 points)
    const avgTrendScore = trends.reduce((sum, t) => sum + t.relevance, 0) / trends.length;
    score += (avgTrendScore / 10) * 3;

    // Competition factor (0-2 points)
    const competitionScore: Record<string, number> = {
      'low': 2,
      'medium': 1,
      'high': 0.5,
    };
    score += competitionScore[competitiveLandscape.intensity] || 1;

    // Growth potential (0-2 points)
    const hasHighGrowth = segments.some(s => parseFloat(s.growthRate) > 20);
    score += hasHighGrowth ? 2 : 1;

    return Math.min(10, score);
  }

  /**
   * Generate recommendations based on findings
   */
  protected override generateRecommendations(analysis: MarketResearchResult): string[] {
    const recommendations: string[] = [];

    // Segment-based recommendations
    const topSegment = analysis.segments.reduce((best, current) =>
      current.attractiveness > best.attractiveness ? current : best
    );
    recommendations.push(
      `Focus on ${topSegment.name} segment with ${topSegment.attractiveness}/10 attractiveness`
    );

    // Trend-based recommendations
    const criticalTrends = analysis.trends.filter(t => t.impact === 'high' && t.timeframe === 'short');
    if (criticalTrends.length > 0) {
      recommendations.push(
        `Immediately address: ${criticalTrends.map(t => t.name).join(', ')}`
      );
    }

    // Competition-based recommendations
    if (analysis.competitiveLandscape.intensity === 'high') {
      recommendations.push(
        'Differentiate through innovation or niche focus',
        'Consider partnerships or acquisitions for scale'
      );
    }

    // Opportunity-based recommendations
    recommendations.push(
      'Prioritize top 3 opportunities for next quarter',
      'Develop specific strategies for each target segment',
      'Monitor trends quarterly and adjust strategy'
    );

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  protected override calculateConfidence(analysis: MarketResearchResult): number {
    const factors = {
      segmentData: analysis.segments.length > 0 ? 2.5 : 0,
      trendData: analysis.trends.length > 0 ? 2.5 : 0,
      competitiveData: analysis.competitiveLandscape ? 2 : 0,
      marketMetrics: analysis.marketSize !== 'Unknown' ? 2 : 1,
      completeness: 1,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}
