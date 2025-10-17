/**
 * Base Agent Class
 * Foundation for all specialized agents in the multi-agent system
 */

import type { LLMService } from '../services/llm-service.js';

/**
 * Agent input structure
 */
export interface AgentInput {
  brandName: string;
  brandUrl?: string;
  data?: any;
  context?: Record<string, any>;
  previousAgentOutputs?: AgentOutput[];
}

/**
 * Agent output structure
 */
export interface AgentOutput {
  agentName: string;
  agentVersion: string;
  status: 'success' | 'partial' | 'failed';
  executionTime: number;
  findings?: any;
  recommendations?: string[];
  confidence: number; // 0-10
  errors?: string[];
  metadata?: Record<string, any>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  version: string;
  description: string;
  timeout?: number;
  retryCount?: number;
  dependencies?: string[]; // Other agent names this depends on
}

/**
 * Base class for all agents
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected llmService?: LLMService;
  private startTime: number = 0;

  constructor(config: AgentConfig, llmService?: LLMService) {
    this.config = config;
    this.llmService = llmService;
  }

  /**
   * Get agent name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get agent version
   */
  get version(): string {
    return this.config.version;
  }

  /**
   * Get agent description
   */
  get description(): string {
    return this.config.description;
  }

  /**
   * Get agent dependencies
   */
  get dependencies(): string[] {
    return this.config.dependencies || [];
  }

  /**
   * Main execution method - must be implemented by each agent
   */
  abstract analyze(input: AgentInput): Promise<AgentOutput>;

  /**
   * Execute agent with timing and error handling
   */
  async execute(input: AgentInput): Promise<AgentOutput> {
    this.startTime = Date.now();

    try {
      // Check dependencies if any
      if (this.dependencies.length > 0) {
        const missingDeps = this.checkDependencies(input.previousAgentOutputs);
        if (missingDeps.length > 0) {
          return this.createErrorOutput(`Missing required agent outputs: ${missingDeps.join(', ')}`);
        }
      }

      // Execute main analysis
      const result = await this.withTimeout(
        this.analyze(input),
        this.config.timeout || 30000
      );

      // Add execution time
      result.executionTime = Date.now() - this.startTime;

      return result;

    } catch (error) {
      return this.createErrorOutput(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check if required dependencies are present
   */
  protected checkDependencies(previousOutputs?: AgentOutput[]): string[] {
    if (!previousOutputs) return this.dependencies;

    const availableAgents = new Set(previousOutputs.map(o => o.agentName));
    return this.dependencies.filter(dep => !availableAgents.has(dep));
  }

  /**
   * Execute with timeout
   */
  protected async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Agent timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Create standardized output structure
   */
  protected createOutput(
    findings: any,
    recommendations: string[] = [],
    confidence: number = 7.5,
    status: 'success' | 'partial' | 'failed' = 'success'
  ): AgentOutput {
    return {
      agentName: this.name,
      agentVersion: this.version,
      status,
      executionTime: Date.now() - this.startTime,
      findings,
      recommendations,
      confidence,
    };
  }

  /**
   * Create error output
   */
  protected createErrorOutput(error: string): AgentOutput {
    return {
      agentName: this.name,
      agentVersion: this.version,
      status: 'failed',
      executionTime: Date.now() - this.startTime,
      confidence: 0,
      errors: [error],
    };
  }

  /**
   * Calculate confidence score based on findings
   */
  protected calculateConfidence(findings: any): number {
    // Default implementation - agents can override
    if (!findings) return 0;

    const factors = {
      hasData: findings ? 2 : 0,
      dataCompleteness: this.assessDataCompleteness(findings),
      dataQuality: this.assessDataQuality(findings),
      consistency: this.assessConsistency(findings),
    };

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    return Math.min(10, totalScore);
  }

  /**
   * Assess data completeness (0-2.5 points)
   */
  protected assessDataCompleteness(findings: any): number {
    // Override in specific agents
    return 1.5;
  }

  /**
   * Assess data quality (0-2.5 points)
   */
  protected assessDataQuality(findings: any): number {
    // Override in specific agents
    return 1.5;
  }

  /**
   * Assess consistency (0-3 points)
   */
  protected assessConsistency(findings: any): number {
    // Override in specific agents
    return 2;
  }

  /**
   * Generate recommendations based on findings
   */
  protected generateRecommendations(findings: any): string[] {
    // Default implementation - agents should override
    return [];
  }

  /**
   * Log agent activity
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.name}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ERROR:`, message);
        break;
      case 'warn':
        console.warn(`${prefix} WARN:`, message);
        break;
      default:
        console.log(`${prefix} INFO:`, message);
    }
  }
}