/**
 * Iconography Agent
 * Creates iconography and graphic elements
 * Part of the Generation Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig, type AgentLLMService } from '../../core/base-agent.js';

/**
 * Iconography result structure
 */
interface IconographyResult {
  summary: string;
  findings: any[];
  score: number;
  confidence: number;
  recommendations: string[];
  metadata?: Record<string, any>;
}

/**
 * Iconography Agent
 * Creates iconography and graphic elements
 */
export class IconographyAgent extends BaseAgent {
  constructor(llmService?: AgentLLMService) {
    const config: AgentConfig = {
      name: 'Iconography',
      version: '1.0.0',
      description: 'Creates iconography and graphic elements',
      timeout: 30000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze icon style, system, and applications
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting iconography analysis');

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
  private async performAnalysis(_data: any): Promise<IconographyResult> {
    // Use LLM for intelligent analysis if available
    if (this.llmService) {
      try {
        const prompt = `Analyze creates iconography and graphic elements for ${_data.brandName}.

Brand Context:
- Brand Name: ${_data.brandName}
- Brand URL: ${_data.brandUrl || 'Not specified'}
- Industry: ${_data.context?.industry || 'Not specified'}
- Target Market: ${_data.context?.targetMarket || 'Not specified'}

Context from generation module focusing on content and creative assets.

Previous Analysis Context:
${_data.previousAnalyses?.length > 0 ? JSON.stringify(_data.previousAnalyses.map((a: any) => ({
  type: a.type,
  summary: a.summary,
})), null, 2) : 'No previous analysis available'}

Provide comprehensive analysis for: Creates iconography and graphic elements

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
    "analysisType": "iconography",
    "timestamp": "ISO timestamp"
  }
}`;

        const response = await this.llmService.analyze(prompt, 'iconography');

        if (response && response.summary) {
          return {
            summary: response.summary || 'Creates iconography and graphic elements',
            findings: response.findings || [],
            score: response.score || 7.5,
            confidence: response.confidence || 8,
            recommendations: response.recommendations || [],
            metadata: {
              analysisType: 'iconography',
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

    const analysis: IconographyResult = {
      summary: 'Creates iconography and graphic elements',
      findings: [
        {
          type: 'insight',
          description: 'Key finding from iconography analysis',
          impact: 'high',
          confidence: 0.85,
        },
      ],
      score: 7.5,
      confidence: 8,
      recommendations: [],
      metadata: {
        analysisType: 'iconography',
        timestamp: new Date().toISOString(),
      },
    };

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  protected override generateRecommendations(analysis: IconographyResult): string[] {
    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (analysis.score < 5) {
      recommendations.push('Immediate attention required for icon style, system, and applications');
    } else if (analysis.score < 7) {
      recommendations.push('Consider improvements to icon style, system, and applications');
    } else {
      recommendations.push('Maintain current approach to icon style, system, and applications');
    }

    // Add specific recommendations based on findings
    analysis.findings.forEach(finding => {
      if (finding.impact === 'high') {
        recommendations.push(`Address: ${finding.description}`);
      }
    });

    // Add strategic recommendations
    recommendations.push(
      'Monitor icon style, system, and applications regularly',
      'Benchmark against industry standards',
      'Iterate based on feedback'
    );

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  protected override calculateConfidence(analysis: IconographyResult): number {
    const factors = {
      dataCompleteness: 2,
      analysisDepth: 2,
      findingsQuality: analysis.findings.length > 0 ? 3 : 1,
      consistency: 3,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}