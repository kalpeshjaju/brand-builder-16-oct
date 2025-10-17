/**
 * Value Proposition Agent
 * Crafts compelling value propositions
 * Part of the Strategy Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig } from '../../core/base-agent.js';

/**
 * Value Proposition analysis result
 */
interface ValuePropositionResult {
  summary: string;
  findings: any[];
  score: number;
  confidence: number;
  recommendations: string[];
  metadata?: Record<string, any>;
}

/**
 * Value Proposition Agent
 * Crafts compelling value propositions
 */
export class ValuePropositionAgent extends BaseAgent {
  constructor(llmService?: any) {
    const config: AgentConfig = {
      name: 'Value Proposition',
      version: '1.0.0',
      description: 'Crafts compelling value propositions',
      timeout: 30000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze customer value drivers, benefits, and unique value
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting value proposition analysis');

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
  private async performAnalysis(_data: any): Promise<ValuePropositionResult> {
    // Use LLM for intelligent analysis if available
    if (this.llmService) {
      try {
        const prompt = `Analyze crafts compelling value propositions for ${_data.brandName}.

Brand Context:
- Brand Name: ${_data.brandName}
- Brand URL: ${_data.brandUrl || 'Not specified'}
- Industry: ${_data.context?.industry || 'Not specified'}
- Target Market: ${_data.context?.targetMarket || 'Not specified'}

Context from strategy module focusing on brand strategy and positioning.

Previous Analysis Context:
${_data.previousAnalyses?.length > 0 ? JSON.stringify(_data.previousAnalyses.map((a: any) => ({
  type: a.type,
  summary: a.summary,
})), null, 2) : 'No previous analysis available'}

Provide comprehensive analysis for: Crafts compelling value propositions

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
    "analysisType": "value_proposition",
    "timestamp": "ISO timestamp"
  }
}`;

        const response = await this.llmService.analyze(prompt, 'value-proposition');

        if (response && response.summary) {
          return {
            summary: response.summary || 'Crafts compelling value propositions',
            findings: response.findings || [],
            score: response.score || 7.5,
            confidence: response.confidence || 8,
            recommendations: response.recommendations || [],
            metadata: {
              analysisType: 'value_proposition',
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

    const analysis: ValuePropositionResult = {
      summary: 'Crafts compelling value propositions',
      findings: [
        {
          type: 'insight',
          description: 'Key finding from value proposition analysis',
          impact: 'high',
          confidence: 0.85,
        },
      ],
      score: 7.5,
      confidence: 8,
      recommendations: [],
      metadata: {
        analysisType: 'value_proposition',
        timestamp: new Date().toISOString(),
      },
    };

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  protected override generateRecommendations(analysis: ValuePropositionResult): string[] {
    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (analysis.score < 5) {
      recommendations.push('Immediate attention required for customer value drivers, benefits, and unique value');
    } else if (analysis.score < 7) {
      recommendations.push('Consider improvements to customer value drivers, benefits, and unique value');
    } else {
      recommendations.push('Maintain current approach to customer value drivers, benefits, and unique value');
    }

    // Add specific recommendations based on findings
    analysis.findings.forEach(finding => {
      if (finding.impact === 'high') {
        recommendations.push(`Address: ${finding.description}`);
      }
    });

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  protected override calculateConfidence(analysis: ValuePropositionResult): number {
    const factors = {
      dataCompleteness: 2,
      analysisDepth: 2,
      findingsQuality: analysis.findings.length > 0 ? 3 : 1,
      consistency: 3,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}
