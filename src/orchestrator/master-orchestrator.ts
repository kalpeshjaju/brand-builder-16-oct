/**
 * Master Orchestrator
 * Coordinates all agents across 10 stages of the brand building pipeline
 *
 * Similar to ui-ux-audit-tool but with more comprehensive orchestration
 */

import type { BaseAgent, AgentInput, AgentOutput } from '../core/base-agent.js';
import type { BrandConfiguration } from '../types/genesis-types.js';
import { EventEmitter } from 'events';

/**
 * Orchestration stage definition
 */
interface OrchestrationStage {
  id: string;
  name: string;
  description: string;
  agents: string[];
  parallel: boolean;
  required: boolean;
  timeout: number;
}

/**
 * Pipeline configuration
 */
interface PipelineConfig {
  brandConfig: BrandConfiguration;
  stages: OrchestrationStage[];
  maxParallelAgents: number;
  qualityThreshold: number;
  retryAttempts: number;
}

/**
 * Stage execution result
 */
interface StageResult {
  stageId: string;
  stageName: string;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  startTime: Date;
  endTime: Date;
  duration: number;
  agentResults: AgentOutput[];
  errors?: string[];
  qualityScore?: number;
}

/**
 * Pipeline execution result
 */
interface PipelineResult {
  brandName: string;
  status: 'completed' | 'partial' | 'failed';
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  stageResults: StageResult[];
  deliverables: string[];
  overallQualityScore: number;
  recommendations: string[];
}

/**
 * Agent registry entry
 */
interface AgentRegistryEntry {
  name: string;
  module: string;
  instance?: BaseAgent;
  dependencies: string[];
  stage: string;
}

/**
 * Master Orchestrator
 * Manages the entire multi-agent brand building pipeline
 */
export class MasterOrchestrator extends EventEmitter {
  private agentRegistry: Map<string, AgentRegistryEntry>;
  private stageOrchestrators: Map<string, any>;
  private pipelineConfig?: PipelineConfig;
  private currentStage?: string;
  private executionHistory: StageResult[] = [];

  constructor() {
    super();
    this.agentRegistry = new Map();
    this.stageOrchestrators = new Map();
    this.initializeAgentRegistry();
    this.initializeStages();
  }

  /**
   * Initialize agent registry with all available agents
   */
  private initializeAgentRegistry(): void {
    // Discovery Module Agents (15)
    const discoveryAgents = [
      { name: 'Contradiction Detector', module: 'discovery/agents/contradiction-detector-agent' },
      { name: 'Gap Analyzer', module: 'discovery/agents/gap-analyzer-agent' },
      { name: 'Market Researcher', module: 'discovery/agents/market-researcher-agent' },
      { name: 'Competitor Analyzer', module: 'discovery/agents/competitor-analyzer-agent' },
      { name: 'Audience Researcher', module: 'discovery/agents/audience-researcher-agent' },
      { name: 'Trend Spotter', module: 'discovery/agents/trend-spotter-agent' },
      { name: 'Pricing Analyst', module: 'discovery/agents/pricing-analyst-agent' },
      { name: 'Channel Analyst', module: 'discovery/agents/channel-analyst-agent' },
      { name: 'Brand Auditor', module: 'discovery/agents/brand-auditor-agent' },
      { name: 'Perception Mapper', module: 'discovery/agents/perception-mapper-agent' },
      { name: 'Whitespace Finder', module: 'discovery/agents/whitespace-finder-agent' },
      { name: 'Inflection Detector', module: 'discovery/agents/inflection-detector-agent' },
      { name: 'Language Gap', module: 'discovery/agents/language-gap-agent' },
      { name: 'Pattern Recognizer', module: 'discovery/agents/pattern-recognizer-agent' },
      { name: 'Insight Synthesizer', module: 'discovery/agents/insight-synthesizer-agent' },
    ];

    // Strategy Module Agents (12)
    const strategyAgents = [
      { name: 'Positioning Strategist', module: 'strategy/agents/positioning-strategist-agent' },
      { name: 'Value Proposition', module: 'strategy/agents/value-proposition-agent' },
      { name: 'Differentiation', module: 'strategy/agents/differentiation-agent' },
      { name: 'Messaging Architect', module: 'strategy/agents/messaging-architect-agent' },
      { name: 'Narrative Builder', module: 'strategy/agents/narrative-builder-agent' },
      { name: 'Voice Tone', module: 'strategy/agents/voice-tone-agent' },
      { name: 'Archetype Designer', module: 'strategy/agents/archetype-designer-agent' },
      { name: 'Persona Creator', module: 'strategy/agents/persona-creator-agent' },
      { name: 'Journey Mapper', module: 'strategy/agents/journey-mapper-agent' },
      { name: 'Touchpoint Optimizer', module: 'strategy/agents/touchpoint-optimizer-agent' },
      { name: 'Experience Designer', module: 'strategy/agents/experience-designer-agent' },
      { name: 'Strategy Validator', module: 'strategy/agents/strategy-validator-agent' },
    ];

    // Validation Module Agents (15) - 8-Layer Defense System
    const validationAgents = [
      { name: 'Source Quality', module: 'validation/agents/source-quality-agent' },
      { name: 'Fact Checker', module: 'validation/agents/fact-checker-agent' },
      { name: 'Triple Extractor', module: 'validation/agents/triple-extractor-agent' },
      { name: 'Cross Verifier', module: 'validation/agents/cross-verifier-agent' },
      { name: 'Proof Validator', module: 'validation/agents/proof-validator-agent' },
      { name: 'Numeric Validator', module: 'validation/agents/numeric-validator-agent' },
      { name: 'Strategy Auditor', module: 'validation/agents/strategy-auditor-agent' },
      { name: 'Consistency Checker', module: 'validation/agents/consistency-checker-agent' },
      { name: 'Completeness Verifier', module: 'validation/agents/completeness-verifier-agent' },
      { name: 'Quality Scorer', module: 'validation/agents/quality-scorer-agent' },
      { name: 'Compliance Checker', module: 'validation/agents/compliance-checker-agent' },
      { name: 'Plagiarism Detector', module: 'validation/agents/plagiarism-detector-agent' },
      { name: 'Brand Alignment', module: 'validation/agents/brand-alignment-agent' },
      { name: 'Production Ready', module: 'validation/agents/production-ready-agent' },
      { name: 'Final Approval', module: 'validation/agents/final-approval-agent' },
    ];

    // Register all agents
    [...discoveryAgents, ...strategyAgents, ...validationAgents].forEach(agent => {
      this.agentRegistry.set(agent.name, {
        name: agent.name,
        module: agent.module,
        dependencies: [],
        stage: this.getStageForAgent(agent.name),
      });
    });

    this.emit('registry:initialized', { totalAgents: this.agentRegistry.size });
  }

  /**
   * Initialize pipeline stages
   */
  private initializeStages(): void {
    const stages: OrchestrationStage[] = [
      {
        id: 'discovery',
        name: 'Discovery & Research',
        description: 'Understand current state, market, and opportunities',
        agents: [
          'Contradiction Detector',
          'Gap Analyzer',
          'Market Researcher',
          'Competitor Analyzer',
          'Audience Researcher',
        ],
        parallel: true,
        required: true,
        timeout: 120000, // 2 minutes
      },
      {
        id: 'strategy',
        name: 'Strategy Development',
        description: 'Define positioning, messaging, and experience strategy',
        agents: [
          'Positioning Strategist',
          'Value Proposition',
          'Differentiation',
          'Messaging Architect',
        ],
        parallel: false,
        required: true,
        timeout: 180000, // 3 minutes
      },
      {
        id: 'validation',
        name: 'Quality Validation',
        description: '8-layer defense system for quality assurance',
        agents: [
          'Source Quality',
          'Fact Checker',
          'Triple Extractor',
          'Cross Verifier',
          'Proof Validator',
          'Numeric Validator',
          'Strategy Auditor',
          'Consistency Checker',
        ],
        parallel: false, // Sequential for 8-layer defense
        required: true,
        timeout: 240000, // 4 minutes
      },
    ];

    stages.forEach(stage => {
      this.stageOrchestrators.set(stage.id, stage);
    });
  }

  /**
   * Execute the complete pipeline
   */
  async executePipeline(config: PipelineConfig): Promise<PipelineResult> {
    this.pipelineConfig = config;
    const startTime = new Date();

    this.emit('pipeline:start', {
      brandName: config.brandConfig.brandName,
      totalStages: config.stages.length,
    });

    const result: PipelineResult = {
      brandName: config.brandConfig.brandName,
      status: 'completed',
      startTime,
      endTime: new Date(),
      totalDuration: 0,
      stageResults: [],
      deliverables: [],
      overallQualityScore: 0,
      recommendations: [],
    };

    try {
      // Execute each stage
      for (const stage of config.stages) {
        const stageResult = await this.executeStage(stage, config.brandConfig);
        result.stageResults.push(stageResult);

        // Check quality gate
        if (!this.passesQualityGate(stageResult, config.qualityThreshold)) {
          this.emit('stage:failed', { stage: stage.name, reason: 'Quality gate failed' });

          if (stage.required) {
            result.status = 'failed';
            break;
          }
        }

        this.executionHistory.push(stageResult);
      }

      // Calculate final metrics
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
      result.overallQualityScore = this.calculateOverallQuality(result.stageResults);
      result.deliverables = this.extractDeliverables(result.stageResults);
      result.recommendations = this.generateRecommendations(result);

      this.emit('pipeline:complete', result);

    } catch (error) {
      result.status = 'failed';
      this.emit('pipeline:error', error);
    }

    return result;
  }

  /**
   * Execute a single stage
   */
  private async executeStage(
    stage: OrchestrationStage,
    brandConfig: BrandConfiguration
  ): Promise<StageResult> {
    const startTime = new Date();
    this.currentStage = stage.id;

    this.emit('stage:start', { stage: stage.name });

    const result: StageResult = {
      stageId: stage.id,
      stageName: stage.name,
      status: 'success',
      startTime,
      endTime: new Date(),
      duration: 0,
      agentResults: [],
    };

    try {
      const agentInput: AgentInput = {
        brandName: brandConfig.brandName,
        brandUrl: brandConfig.brandUrl,
        context: { brandConfig },
        previousAgentOutputs: this.getPreviousOutputs(),
      };

      if (stage.parallel) {
        // Execute agents in parallel
        result.agentResults = await this.executeAgentsParallel(
          stage.agents,
          agentInput,
          stage.timeout
        );
      } else {
        // Execute agents sequentially
        result.agentResults = await this.executeAgentsSequential(
          stage.agents,
          agentInput,
          stage.timeout
        );
      }

      // Calculate stage metrics
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.qualityScore = this.calculateStageQuality(result.agentResults);

      this.emit('stage:complete', result);

    } catch (error) {
      result.status = 'failed';
      result.errors = [error instanceof Error ? error.message : 'Stage execution failed'];
      this.emit('stage:error', { stage: stage.name, error });
    }

    return result;
  }

  /**
   * Execute agents in parallel
   */
  private async executeAgentsParallel(
    agentNames: string[],
    input: AgentInput,
    timeout: number
  ): Promise<AgentOutput[]> {
    const promises = agentNames.map(agentName =>
      this.executeAgent(agentName, input, timeout)
    );

    return Promise.all(promises);
  }

  /**
   * Execute agents sequentially
   */
  private async executeAgentsSequential(
    agentNames: string[],
    input: AgentInput,
    timeout: number
  ): Promise<AgentOutput[]> {
    const results: AgentOutput[] = [];

    for (const agentName of agentNames) {
      const result = await this.executeAgent(agentName, input, timeout);
      results.push(result);

      // Update input with previous agent's output for next agent
      input.previousAgentOutputs = [...(input.previousAgentOutputs || []), result];
    }

    return results;
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(
    agentName: string,
    input: AgentInput,
    _timeout: number
  ): Promise<AgentOutput> {
    const agentEntry = this.agentRegistry.get(agentName);

    if (!agentEntry) {
      return {
        agentName,
        agentVersion: '0.0.0',
        status: 'failed',
        executionTime: 0,
        confidence: 0,
        errors: [`Agent ${agentName} not found in registry`],
      };
    }

    this.emit('agent:start', { agent: agentName });

    try {
      // Load agent instance if not already loaded
      if (!agentEntry.instance) {
        agentEntry.instance = await this.loadAgent(agentEntry);
      }

      // Execute agent
      const result = await agentEntry.instance.execute(input);

      this.emit('agent:complete', { agent: agentName, result });

      return result;

    } catch (error) {
      const errorResult: AgentOutput = {
        agentName,
        agentVersion: '0.0.0',
        status: 'failed',
        executionTime: 0,
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Agent execution failed'],
      };

      this.emit('agent:error', { agent: agentName, error });

      return errorResult;
    }
  }

  /**
   * Load agent dynamically
   */
  private async loadAgent(_entry: AgentRegistryEntry): Promise<BaseAgent> {
    // In production, would dynamically import the agent module
    // For now, return a mock instance
    const { ContradictionDetectorAgent } = await import('../discovery/agents/contradiction-detector-agent.js');
    return new ContradictionDetectorAgent();
  }

  /**
   * Get stage for a given agent
   */
  private getStageForAgent(agentName: string): string {
    // Map agents to their stages
    const stageMap: Record<string, string> = {
      'Contradiction Detector': 'discovery',
      'Gap Analyzer': 'discovery',
      'Market Researcher': 'discovery',
      'Positioning Strategist': 'strategy',
      'Value Proposition': 'strategy',
      'Source Quality': 'validation',
      'Fact Checker': 'validation',
    };

    return stageMap[agentName] || 'unknown';
  }

  /**
   * Get previous agent outputs
   */
  private getPreviousOutputs(): AgentOutput[] {
    return this.executionHistory.flatMap(stage => stage.agentResults);
  }

  /**
   * Check if stage passes quality gate
   */
  private passesQualityGate(stage: StageResult, threshold: number): boolean {
    return (stage.qualityScore || 0) >= threshold;
  }

  /**
   * Calculate stage quality score
   */
  private calculateStageQuality(agentResults: AgentOutput[]): number {
    if (agentResults.length === 0) return 0;

    const totalConfidence = agentResults.reduce((sum, result) => sum + result.confidence, 0);
    return totalConfidence / agentResults.length;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQuality(stageResults: StageResult[]): number {
    if (stageResults.length === 0) return 0;

    const totalQuality = stageResults.reduce((sum, stage) => sum + (stage.qualityScore || 0), 0);
    return totalQuality / stageResults.length;
  }

  /**
   * Extract deliverables from results
   */
  private extractDeliverables(_stageResults: StageResult[]): string[] {
    // Would extract actual deliverables from agent outputs
    return [
      'Brand Audit Report',
      'Competitive Analysis',
      'Brand Strategy Document',
      'Quality Validation Report',
    ];
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(result: PipelineResult): string[] {
    const recommendations: string[] = [];

    // Based on quality score
    if (result.overallQualityScore < 7) {
      recommendations.push('Consider additional research to improve confidence');
    }

    // Based on stage results
    result.stageResults.forEach(stage => {
      if (stage.status === 'partial') {
        recommendations.push(`Review and enhance ${stage.stageName} outputs`);
      }
    });

    return recommendations;
  }

  /**
   * Get current pipeline status
   */
  getStatus(): any {
    return {
      currentStage: this.currentStage,
      totalAgents: this.agentRegistry.size,
      executedStages: this.executionHistory.length,
      lastExecution: this.executionHistory[this.executionHistory.length - 1],
      pipelineConfig: this.pipelineConfig,
    };
  }
}