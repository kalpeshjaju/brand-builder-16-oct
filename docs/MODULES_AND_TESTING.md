# Modular Structure & Component Testing

Goal: Keep architecture legible and scalable by separating Infra, Agents, Inputs, Outputs, Features, Testing; support stage-wise development and easy component tests.

Modules (Logical)
- Infra (`src/utils`, `src/config`, `src/services`)
  - Logging, FS, JSON, env, constants, LLM client, rate limits, retries
- Inputs (`src/ingestion`, `src/utils/web-fetcher.ts`, `src/oracle/*`)
  - Parsers, fetchers, optional semantic search
- Agents (`src/agents/**`)
  - Stateless units that transform context → results
- Orchestrator (`src/orchestrator/*`)
  - Reads `config/workflow.json`, runs agents, accumulates results
- Outputs (`src/presentation/*`, CLI writers)
  - HTML report, Markdown summaries, manifest
- Features (`src/features/*` – future)
  - Higher-level bundles (e.g., full brand package assembly)
- Testing (`tests/**`)
  - Unit: infra, agents, presentation; Integration: workflow; Snapshots for explain output

Stage-wise Modules
- Discovery → Strategy → Validation → Build-Out → Documentation
- Each stage has one or more agents; each agent has a typed output and independent tests.

Component Testing
- Unit
  - Agents: call `agent.execute({ ...mockContext })`, assert `result.success` and schema shape
  - Infra: test utils (parsers, formatter, fs)
  - Presentation: feed fixture outputs → HTML section, assert key content
- Integration
  - Workflow: feed a small config, assert outputs exist and manifest statuses
- Snapshots
  - `--explain` output for readability regressions

Test Helpers (Pattern)
```ts
// tests/helpers/context.ts
import type { IAgentContext } from '../../src/agents/IAgent';
export function makeContext(partial?: Partial<IAgentContext>): IAgentContext {
  return {
    brandName: 'TestBrand',
    brandUrl: 'https://example.com',
    competitorUrls: [],
    useOracle: false,
    results: {},
    ...partial,
  };
}
```

Naming & Files
- Agents: `src/agents/<stage>/<feature>-agent.ts`
- Types: `src/types/<domain>-types.ts`
- Tests: `tests/unit/<domain>/<name>.test.ts`
- Outputs: `outputs/evolution/<brand>/`

Quality Gates
- Enforce typed agent outputs (see `src/types/agent-results.ts`)
- Validate workflow JSON at runtime (friendly errors)
- Skip/resume behavior for incremental runs

CI/Dev
- Deterministic offline runs: `BRANDOS_OFFLINE=true`
- `npm run build` generates agents manifest automatically

