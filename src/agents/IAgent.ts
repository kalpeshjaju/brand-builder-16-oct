// Core agent interfaces for modular execution
// Keep minimal and focused to avoid coupling during initial rollout

import type { AgentResultMap } from '../types/agent-results.js';

export interface IAgentContext {
  brandName: string;
  brandUrl: string;
  competitorUrls?: string[];

  // Feature flags
  useOracle?: boolean;

  // Shared cross-agent results (typed)
  results: Partial<AgentResultMap>;
}

export interface IAgentResult<TData = unknown> {
  success: boolean;
  data: TData | null;
  error?: string;
}

export interface AgentMetadata {
  description: string;
  version?: string; // semantic version of the agent
  inputs?: string[]; // names of required previous-agent outputs
  outputs?: string[]; // keys produced in result.data
}

export interface IAgent {
  /** Unique, stable agent name (e.g., "evolution.research-blitz") */
  readonly name: string;

  /** Execute the agent with provided context */
  execute(context: IAgentContext): Promise<IAgentResult>;

  /** Optional self-description to help humans/LLMs understand usage */
  readonly metadata?: AgentMetadata;
}
