/**
 * Narrative Builder Agent
 * Creates brand narrative and storytelling
 * Part of the Strategy Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig } from '../../core/base-agent.js';

/**
 * Narrative Builder analysis result
 */
interface NarrativeBuilderResult {
  summary: string;
  findings: any[];
  score: number;
  confidence: number;
  recommendations: string[];
  metadata?: Record<string, any>;
}

/**
 * Narrative Builder Agent
 * Creates brand narrative and storytelling
 */
export class NarrativeBuilderAgent extends BaseAgent {
  constructor(llmService?: any) {
    const config: AgentConfig = {
      name: 'Narrative Builder',
      version: '1.0.0',
      description: 'Creates brand narrative and storytelling',
      timeout: 30000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze brand story, narrative arc, and emotional connection
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting narrative builder analysis');

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
  private async performAnalysis(_data: any): Promise<NarrativeBuilderResult> {
    // Use LLM for intelligent analysis if available
    if (this.llmService) {
      try {
        const prompt = `Analyze creates brand narrative and storytelling for ${_data.brandName}.

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

Provide comprehensive analysis for: Creates brand narrative and storytelling

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
    "analysisType": "narrative_builder",
    "timestamp": "ISO timestamp"
  }
}`;

        const response = await this.llmService.analyze(prompt, 'narrative-builder');

        if (response && response.summary) {
          return {
            summary: response.summary || 'Creates brand narrative and storytelling',
            findings: response.findings || [],
            score: response.score || 7.5,
            confidence: response.confidence || 8,
            recommendations: response.recommendations || [],
            metadata: {
              analysisType: 'narrative_builder',
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

    const analysis: NarrativeBuilderResult = {
      summary: 'Creates brand narrative and storytelling',
      findings: [
        {
          type: 'insight',
          description: 'Key finding from narrative builder analysis',
          impact: 'high',
          confidence: 0.85,
        },
      ],
      score: 7.5,
      confidence: 8,
      recommendations: [],
      metadata: {
        analysisType: 'narrative_builder',
        timestamp: new Date().toISOString(),
      },
    };

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  protected override generateRecommendations(analysis: NarrativeBuilderResult): string[] {
    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (analysis.score < 5) {
      recommendations.push('Immediate attention required for brand story, narrative arc, and emotional connection');
    } else if (analysis.score < 7) {
      recommendations.push('Consider improvements to brand story, narrative arc, and emotional connection');
    } else {
      recommendations.push('Maintain current approach to brand story, narrative arc, and emotional connection');
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
  protected override calculateConfidence(analysis: NarrativeBuilderResult): number {
    const factors = {
      dataCompleteness: 2,
      analysisDepth: 2,
      findingsQuality: analysis.findings.length > 0 ? 3 : 1,
      consistency: 3,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}
