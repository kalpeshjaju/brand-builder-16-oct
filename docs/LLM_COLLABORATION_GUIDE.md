# LLM Collaboration Guide

Purpose: Make this repo legible to any LLM or human contributor, keep changes modular, and prevent ripple effects.

Key Ideas
- Stateless agents: Each agent takes context, returns data; no hidden state.
- Config-as-code: `config/workflow.json` defines the pipeline; no hard-coded stage order.
- Strong boundaries: Agents cannot write files; CLI/orchestrator handles persistence.
- Backward compatible: New agents must not break existing names or outputs.

Directory Signals
- `src/agents/` – Agent implementations. Keep files small and single-purpose.
- `src/orchestrator/` – Runs agents per `workflow.json`. No domain logic here.
- `config/workflow.json` – Stages and agent names. Schema in `config/workflow.schema.json`.
- `outputs/evolution/<brand>/` – Saved outputs (JSON + Markdown), written by CLI.

Agent Contract (TypeScript)
```ts
export interface IAgentContext {
  brandName: string;
  brandUrl: string;
  competitorUrls?: string[];
  useOracle?: boolean;
  results: Record<string, unknown>; // prior agent outputs
}

export interface IAgentResult<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string;
}

export interface AgentMetadata {
  description: string;
  version?: string;
  inputs?: string[];
  outputs?: string[];
}

export interface IAgent {
  readonly name: string; // e.g., "evolution.research-blitz"
  readonly metadata?: AgentMetadata;
  execute(context: IAgentContext): Promise<IAgentResult>;
}
```

Add a New Agent (Checklist)
1) Create file in `src/agents/<stage>/new-agent.ts`
2) Implement `IAgent` and provide `metadata`
3) Register in `src/orchestrator/AgentFactory.ts`
4) Add to `config/workflow.json` under the right stage
5) Avoid file writes; return data via `IAgentResult`

Workflow Config (JSON Schema)
- See `config/workflow.schema.json` for machine-readable structure
- Minimal example:
```json
{
  "$schema": "./workflow.schema.json",
  "stages": [
    { "name": "Discovery", "agents": [{ "name": "evolution.research-blitz" }] }
  ]
}
```

Do/Don’t (Modularity Rules)
- DO keep agents pure and idempotent; same inputs → same outputs
- DO read dependencies only from `context.results`
- DO document inputs/outputs in `metadata`
- DO keep prompts and templates close to the agent file or a shared prompt registry
- DON’T import CLI modules inside agents
- DON’T write to disk inside agents
- DON’T change existing agent names; add new agents instead

PR Checklist
- [ ] Agent implements `IAgent`, includes `metadata`
- [ ] Agent registered in `AgentFactory`
- [ ] `workflow.json` updated (if needed) and validates against schema
- [ ] Basic README note or doc snippet added if behavior is user-visible

Non-Technical Explanation
- “Agents” are small workers that each do one thing (e.g., research, then analyze patterns). A simple file (`workflow.json`) lists which workers to run and in what order. The CLI runs them and saves easy-to-read reports to the outputs folder.

