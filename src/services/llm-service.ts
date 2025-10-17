/**
 * LLM Service Interface
 * Provides abstraction for LLM interactions
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * LLM Service configuration
 */
export interface LLMServiceConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

/**
 * LLM response structure
 */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

/**
 * Base LLM Service interface
 */
export interface LLMService {
  /**
   * Send a prompt to the LLM
   */
  prompt(content: string, options?: any): Promise<LLMResponse>;

  /**
   * Analyze content with the LLM
   */
  analyze(content: string, analysisType: string): Promise<any>;

  /**
   * Generate content with the LLM
   */
  generate(prompt: string, type: string): Promise<string>;

  /**
   * Validate content with the LLM
   */
  validate(content: string, rules: any[]): Promise<boolean>;
}

/**
 * Mock LLM Service for testing
 */
export class MockLLMService implements LLMService {
  async prompt(content: string, _options?: any): Promise<LLMResponse> {
    return {
      content: `Mock response for: ${content}`,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
      model: 'mock-model',
    };
  }

  async analyze(_content: string, analysisType: string): Promise<any> {
    return {
      type: analysisType,
      findings: [],
      confidence: 0.75,
    };
  }

  async generate(prompt: string, type: string): Promise<string> {
    return `Generated ${type} content for: ${prompt}`;
  }

  async validate(_content: string, _rules: any[]): Promise<boolean> {
    return true;
  }
}

/**
 * Claude LLM Service
 * Real implementation using Anthropic Claude API
 */
export class ClaudeLLMService implements LLMService {
  private client: Anthropic;
  private config: LLMServiceConfig;

  constructor(config: LLMServiceConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env['ANTHROPIC_API_KEY'],
      model: config.model || 'claude-3-5-sonnet-20241022',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 4096,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    };

    if (!this.config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for ClaudeLLMService');
    }

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  /**
   * Send a prompt to Claude
   */
  async prompt(content: string, options?: any): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: options?.model || this.config.model,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  /**
   * Analyze content with Claude
   */
  async analyze(content: string, analysisType: string): Promise<any> {
    const prompt = `Analyze the following content as a ${analysisType}. Provide detailed findings and insights.

Content to analyze:
${content}

Return your analysis as a structured JSON object with:
- type: string (analysis type)
- findings: array of objects with description, impact, and confidence
- score: number 0-10
- recommendations: array of strings
- metadata: object with relevant context`;

    const response = await this.prompt(prompt);

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch {
      // If not JSON, return structured response
      return {
        type: analysisType,
        findings: [{
          description: response.content,
          impact: 'unknown',
          confidence: 0.7,
        }],
        score: 7,
        recommendations: [],
        metadata: {},
      };
    }
  }

  /**
   * Generate content with Claude
   */
  async generate(promptText: string, type: string): Promise<string> {
    const fullPrompt = `Generate ${type} content based on the following requirements:

${promptText}

Provide high-quality, professional output that addresses all requirements.`;

    const response = await this.prompt(fullPrompt);
    return response.content;
  }

  /**
   * Validate content with Claude
   */
  async validate(content: string, rules: any[]): Promise<boolean> {
    const rulesText = rules.map(r => `- ${JSON.stringify(r)}`).join('\n');
    const prompt = `Validate the following content against these rules:

Rules:
${rulesText}

Content to validate:
${content}

Respond with only "VALID" or "INVALID" followed by a brief explanation.`;

    const response = await this.prompt(prompt);
    return response.content.toLowerCase().startsWith('valid');
  }
}