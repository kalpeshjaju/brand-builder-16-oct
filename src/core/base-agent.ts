/**
 * Base Agent Class
 * Foundation for all specialized agents in the multi-agent system
 */

import type { LLMService } from '../services/llm-service.js';
import { Logger } from '../utils/logger.js';

export type AgentStatus = 'success' | 'partial' | 'failed';

export interface AgentOutput<Findings = unknown, Metadata extends Record<string, unknown> = Record<string, unknown>> {
  agentName: string;
  agentVersion: string;
  status: AgentStatus;
  executionTime: number;
  findings?: Findings;
  recommendations?: string[];
  confidence: number; // 0-10
  errors?: string[];
  metadata?: Metadata;
}

export interface AgentInput<
  Data = Record<string, unknown>,
  Context = Record<string, unknown>,
  PreviousOutput extends AgentOutput = AgentOutput
> {
  brandName: string;
  brandUrl?: string;
  data?: Data;
  context?: Context;
  previousAgentOutputs?: PreviousOutput[];
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
export abstract class BaseAgent<
  Data = Record<string, unknown>,
  Context = Record<string, unknown>,
  Findings = unknown,
  Metadata extends Record<string, unknown> = Record<string, unknown>,
  PreviousOutput extends AgentOutput = AgentOutput
> {
  protected config: AgentConfig;
  protected llmService?: LLMService;
  private startTime = 0;
  protected logger: Logger;

  constructor(config: AgentConfig, llmService?: LLMService) {
    this.config = config;
    this.llmService = llmService;
    this.logger = new Logger(config.name);
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
  abstract analyze(
    input: AgentInput<Data, Context, PreviousOutput>
  ): Promise<AgentOutput<Findings, Metadata>>;

  /**
   * Execute agent with timing and error handling
   */
  async execute(input: AgentInput<Data, Context, PreviousOutput>): Promise<AgentOutput<Findings, Metadata>> {
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
  protected checkDependencies(previousOutputs?: PreviousOutput[]): string[] {
    if (!previousOutputs) return this.dependencies;

    const availableAgents = new Set(previousOutputs.map(output => output.agentName));
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
    findings: Findings,
    recommendations: string[] = [],
    confidence: number = 7.5,
    status: AgentStatus = 'success',
    metadata?: Metadata
  ): AgentOutput<Findings, Metadata> {
    return {
      agentName: this.name,
      agentVersion: this.version,
      status,
      executionTime: Date.now() - this.startTime,
      findings,
      recommendations,
      confidence,
      ...(metadata ? { metadata } : {}),
    };
  }

  /**
   * Create error output
   */
  protected createErrorOutput(error: string): AgentOutput<Findings, Metadata> {
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
  protected calculateConfidence(findings: Findings): number {
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
  protected assessDataCompleteness(_findings: Findings): number {
    // Override in specific agents
    return 1.5;
  }

  /**
   * Assess data quality (0-2.5 points)
   */
  protected assessDataQuality(_findings: Findings): number {
    // Override in specific agents
    return 1.5;
  }

  /**
   * Assess consistency (0-3 points)
   */
  protected assessConsistency(_findings: Findings): number {
    // Override in specific agents
    return 2;
  }

  /**
   * Generate recommendations based on findings
   */
  protected generateRecommendations(_findings: Findings): string[] {
    // Default implementation - agents should override
    return [];
  }

  /**
   * Log agent activity
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    // Use Logger class for structured logging instead of console.*
    switch (level) {
      case 'error':
        this.logger.error(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      default:
        this.logger.info(message);
    }
  }
}

export type AgentLLMService = LLMService;
