/**
 * LLM Service Interface
 * Provides abstraction for LLM interactions
 */

/**
 * LLM Service configuration
 */
export interface LLMServiceConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
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