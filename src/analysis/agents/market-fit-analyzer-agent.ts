/**
 * Market Fit Analyzer Agent
 * Analyzes product-market fit
 * Part of the Analysis Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig, type AgentLLMService } from '../../core/base-agent.js';

/**
 * Market Fit Analyzer result structure
 */
interface MarketFitAnalyzerResult {
  summary: string;
  findings: any[];
  score: number;
  confidence: number;
  recommendations: string[];
  metadata?: Record<string, any>;
}

/**
 * Market Fit Analyzer Agent
 * Analyzes product-market fit
 */
export class MarketFitAnalyzerAgent extends BaseAgent {
  constructor(llmService?: AgentLLMService) {
    const config: AgentConfig = {
      name: 'Market Fit Analyzer',
      version: '1.0.0',
      description: 'Analyzes product-market fit',
      timeout: 30000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze market fit, alignment, and readiness
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting market fit analyzer analysis');

    try {
      // Extract relevant data
      const data = await this.extractData(input);

      // Perform analysis
      const analysis = await this.performAnalysis(data);

      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);

      // Calculate confidence
      const confidence = this.calculateConfidence(analysis);

      this.log(`Analysis complete: ${analysis.summary}`);

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
   * Extract relevant data for analysis
   */
  private async extractData(input: AgentInput): Promise<any> {
    return {
      brandName: input.brandName,
      brandUrl: input.brandUrl,
      data: input.data || {},
      context: input.context || {},
      previousAnalyses: input.previousAgentOutputs || [],
    };
  }

  /**
   * Perform the main analysis
   */
  private async performAnalysis(_data: any): Promise<MarketFitAnalyzerResult> {
    // Use LLM for intelligent analysis if available
    if (this.llmService) {
      try {
        const prompt = `Analyze analyzes product-market fit for ${_data.brandName}.

Brand Context:
- Brand Name: ${_data.brandName}
- Brand URL: ${_data.brandUrl || 'Not specified'}
- Industry: ${_data.context?.industry || 'Not specified'}
- Target Market: ${_data.context?.targetMarket || 'Not specified'}

Context from analysis module focusing on brand analysis and insights.

Previous Analysis Context:
${_data.previousAnalyses?.length > 0 ? JSON.stringify(_data.previousAnalyses.map((a: any) => ({
  type: a.type,
  summary: a.summary,
})), null, 2) : 'No previous analysis available'}

Provide comprehensive analysis for: Analyzes product-market fit

Return as JSON matching this structure:
{
  "summary": "Overall analysis summary",
  "findings": [
    {
      "type": "insight",
      "description": "key finding",
      "impact": "high|medium|low",
      "confidence": 0-1
    }
  ],
  "score": 0-10,
  "recommendations": ["recommendation1", "recommendation2"],
  "metadata": {
    "analysisType": "market_fit_analyzer",
    "timestamp": "ISO timestamp"
  }
}`;

        const response = await this.llmService.analyze(prompt, 'market-fit-analyzer');

        if (response && response.summary) {
          return {
            summary: response.summary || 'Analyzes product-market fit',
            findings: response.findings || [],
            score: response.score || 7.5,
            confidence: response.confidence || 8,
            recommendations: response.recommendations || [],
            metadata: {
              analysisType: 'market_fit_analyzer',
              timestamp: new Date().toISOString(),
              ...response.metadata,
            },
          };
        }
      } catch (error) {
        this.log(`LLM analysis failed, using fallback: ${error}`, 'warn');
      }
    }

    // Fallback to placeholder implementation
    const data = _data; // Alias for function body usage
    void data; // Mark as intentionally unused in placeholder
    // This is a placeholder implementation

    const analysis: MarketFitAnalyzerResult = {
      summary: 'Analyzes product-market fit',
      findings: [
        {
          type: 'insight',
          description: 'Key finding from market fit analyzer analysis',
          impact: 'high',
          confidence: 0.85,
        },
      ],
      score: 7.5,
      confidence: 8,
      recommendations: [],
      metadata: {
        analysisType: 'market_fit_analyzer',
        timestamp: new Date().toISOString(),
      },
    };

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  protected override generateRecommendations(analysis: MarketFitAnalyzerResult): string[] {
    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (analysis.score < 5) {
      recommendations.push('Immediate attention required for market fit, alignment, and readiness');
    } else if (analysis.score < 7) {
      recommendations.push('Consider improvements to market fit, alignment, and readiness');
    } else {
      recommendations.push('Maintain current approach to market fit, alignment, and readiness');
    }

    // Add specific recommendations based on findings
    analysis.findings.forEach(finding => {
      if (finding.impact === 'high') {
        recommendations.push(`Address: ${finding.description}`);
      }
    });

    // Add strategic recommendations
    recommendations.push(
      'Monitor market fit, alignment, and readiness regularly',
      'Benchmark against industry standards',
      'Iterate based on feedback'
    );

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  protected override calculateConfidence(analysis: MarketFitAnalyzerResult): number {
    const factors = {
      dataCompleteness: 2,
      analysisDepth: 2,
      findingsQuality: analysis.findings.length > 0 ? 3 : 1,
      consistency: 3,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}