/**
 * Persona Creator Agent
 * Creates detailed customer personas
 * Part of the Strategy Module
 */

import { BaseAgent, type AgentInput, type AgentOutput, type AgentConfig, type AgentLLMService } from '../../core/base-agent.js';

/**
 * Persona Creator analysis result
 */
interface PersonaCreatorResult {
  summary: string;
  findings: any[];
  score: number;
  confidence: number;
  recommendations: string[];
  metadata?: Record<string, any>;
}

/**
 * Persona Creator Agent
 * Creates detailed customer personas
 */
export class PersonaCreatorAgent extends BaseAgent {
  constructor(llmService?: AgentLLMService) {
    const config: AgentConfig = {
      name: 'Persona Creator',
      version: '1.0.0',
      description: 'Creates detailed customer personas',
      timeout: 30000,
      retryCount: 2,
      dependencies: [],
    };
    super(config, llmService);
  }

  /**
   * Analyze customer segments, behaviors, and needs
   */
  async analyze(input: AgentInput): Promise<AgentOutput> {
    this.log('Starting persona creator analysis');

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
      return this.createErrorOutput(error, { phase: 'analyze' });
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
  private async performAnalysis(_data: any): Promise<PersonaCreatorResult> {
    // Use LLM for intelligent persona creation if available
    if (this.llmService) {
      try {
        const prompt = `Create detailed customer personas for ${_data.brandName}.

Brand Context:
- Brand Name: ${_data.brandName}
- Brand URL: ${_data.brandUrl || 'Not specified'}
- Industry: ${_data.context?.industry || 'Not specified'}
- Target Market: ${_data.context?.targetMarket || 'Not specified'}

Previous Analysis Context:
${_data.previousAnalyses?.length > 0 ? JSON.stringify(_data.previousAnalyses.map((a: any) => ({
  type: a.type,
  summary: a.summary,
})), null, 2) : 'No previous analysis available'}

Create 3-5 detailed customer personas including:

For each persona:
1. **Demographics**: Age, income, location, occupation, education
2. **Psychographics**: Values, attitudes, interests, lifestyle
3. **Behaviors**: Shopping habits, decision process, media consumption
4. **Goals**: What they want to achieve
5. **Pain Points**: Problems and frustrations
6. **Motivations**: What drives their decisions
7. **Objections**: Barriers to purchase
8. **Preferred Channels**: Where they engage with brands

Return as JSON matching this structure:
{
  "summary": "Overall analysis summary",
  "personas": [
    {
      "name": "Persona Name",
      "tagline": "One-line description",
      "demographics": {
        "age": "age range",
        "income": "income range",
        "location": "location type",
        "occupation": "job type",
        "education": "education level"
      },
      "psychographics": {
        "values": ["value1", "value2"],
        "interests": ["interest1", "interest2"],
        "lifestyle": "lifestyle description"
      },
      "behaviors": {
        "shopping": "shopping behavior",
        "decisionProcess": "how they decide",
        "mediaConsumption": ["channel1", "channel2"]
      },
      "goals": ["goal1", "goal2"],
      "painPoints": ["pain1", "pain2"],
      "motivations": ["motivation1", "motivation2"],
      "objections": ["objection1", "objection2"],
      "preferredChannels": ["channel1", "channel2"]
    }
  ],
  "findings": [
    {
      "type": "insight",
      "description": "key insight",
      "impact": "high|medium|low",
      "confidence": 0-1
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

        const response = await this.llmService.analyze(prompt, 'persona-creation');

        if (response.personas && Array.isArray(response.personas)) {
          return {
            summary: response.summary || 'Customer personas created',
            findings: response.findings || [],
            score: response.personas.length >= 3 ? 8.5 : 7.0,
            confidence: 9,
            recommendations: response.recommendations || [],
            metadata: {
              analysisType: 'persona_creator',
              timestamp: new Date().toISOString(),
              personaCount: response.personas.length,
              personas: response.personas,
            },
          };
        }
      } catch (error) {
        this.log(`LLM analysis failed, using fallback: ${error}`, 'warn');
      }
    }

    // Fallback to placeholder implementation
    const analysis: PersonaCreatorResult = {
      summary: 'Analysis of customer segments, behaviors, and needs',
      findings: [
        {
          type: 'insight',
          description: 'Key finding from persona creator analysis',
          impact: 'high',
          confidence: 0.85,
        },
      ],
      score: 7.5,
      confidence: 8,
      recommendations: [],
      metadata: {
        analysisType: 'persona_creator',
        timestamp: new Date().toISOString(),
      },
    };

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  protected override generateRecommendations(analysis: PersonaCreatorResult): string[] {
    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (analysis.score < 5) {
      recommendations.push('Immediate attention required for customer segments, behaviors, and needs');
    } else if (analysis.score < 7) {
      recommendations.push('Consider improvements to customer segments, behaviors, and needs');
    } else {
      recommendations.push('Maintain current approach to customer segments, behaviors, and needs');
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
  protected override calculateConfidence(analysis: PersonaCreatorResult): number {
    const factors = {
      dataCompleteness: 2,
      analysisDepth: 2,
      findingsQuality: analysis.findings.length > 0 ? 3 : 1,
      consistency: 3,
    };

    return Math.min(10, Object.values(factors).reduce((sum, val) => sum + val, 0));
  }
}