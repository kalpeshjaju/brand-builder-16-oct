# Build, Run, and Rate Limits – Operator Guide

Purpose
- Enable other LLMs and humans to reliably build, run, and diagnose the system, including handling API rate limits.

Scope
- Environment setup, build commands, running flows, optional dependencies, and how to detect/mitigate rate limits.

Prerequisites
- Node.js 20+ and npm 10+
- Git
- (Optional) Python 3.9+ if using ORACLE (semantic search)
- Anthropic API key (unless using offline mode)

Environment Variables
- `ANTHROPIC_API_KEY` – required unless `BRANDOS_OFFLINE=true`
- `DEFAULT_MODEL` – defaults to `claude-sonnet-4-5-20250929`
- `LLM_TEMPERATURE` – defaults to `0.2`
- `LLM_MAX_TOKENS` – defaults to `8000`
- `LLM_TIMEOUT_MS` – defaults to `60000`
- `LLM_MAX_RETRIES` – defaults to `3`
- `LOG_LEVEL` – `debug|info|warn|error` (default `info`)
- `LOG_FILE` – defaults to `.brandos/logs/brandos.log`
- `BRANDOS_OFFLINE` – set `true` to run without network/API calls (deterministic local stubs)

Install
```
# From project root
npm install

# If you do NOT need ORACLE and want to skip Python postinstall
npm install --ignore-scripts
```

Build
```
# Type-check only
npm run type-check

# Build TS → dist and generate agents manifest (postbuild)
npm run build

# Optional global link for CLI usage
npm run install-global
```

Run (CLI)
```
# Development (no build needed, uses tsx)
npm run dev -- workflow run -- --brand "Acme" --url "https://acme.com"

# Or with the installed CLI after build/link
brandos workflow run --brand "Acme" --url "https://acme.com"

# Explain plan first (plain-English summary)
brandos workflow run --brand "Acme" --url "https://acme.com" --explain

# With competitors and custom config
brandos workflow run \
  --brand "Acme" \
  --url "https://acme.com" \
  --competitors https://c1.com https://c2.com \
  --config config/workflow.json
```

Outputs
- `outputs/evolution/<brand>/01-research-blitz.json`
- `outputs/evolution/<brand>/02-patterns.json`
- `outputs/evolution/<brand>/02-patterns.md`

Resuming Work (Start Where You Left Off)
- Legacy workshop (stateful): If you used the original Evolution Workshop, it persists state at `outputs/evolution/<brand>/workflow-state.json`. To resume from the last completed phase:
  - Full resume: `brandos evolve -- --brand "Acme"` (continues phases in order)
  - Specific phase: `brandos evolve present -- --brand "Acme"` (runs Pattern Presentation)
  - Force re-run a phase: add `--force`
- Config workflow (stateless by default): The new config-driven workflow writes outputs but doesn’t track internal state yet. Two easy ways to “resume”:
  1) Keep previously generated files and edit `config/workflow.json` to include only the agents you still need to run (e.g., remove `evolution.research-blitz` if `01-research-blitz.json` exists).
  2) Leave the config as-is and re-run; existing files will be overwritten. Use `--explain` first to confirm the plan.
  - Output ↔ Agent mapping:
    - `evolution.research-blitz` → `01-research-blitz.json`
    - `evolution.pattern-presentation` → `02-patterns.json`, `02-patterns.md`

Offline Mode (No API Calls)
```
# Use deterministic local stubs
export BRANDOS_OFFLINE=true

# Then run as usual
brandos workflow run --brand "Acme" --url "https://acme.com"
```

ORACLE (Semantic Search) – Optional
- Python dependencies auto-install via npm `postinstall`:
  - If you do not need ORACLE, use `npm install --ignore-scripts`.
  - To enable later, run: `pip3 install -r src/oracle/requirements.txt`.
- The workflow is designed to run without ORACLE by default (`features.useOracle=false`).

Rate Limiting & Resilience
- LLM client (Anthropic) implements:
  - Rate limiter (bounded concurrency, short interval)
  - Retries with exponential backoff
  - Timeout protection
  - Circuit breaker (opens after repeated failures, cools down)
  - Basic in-memory response cache (disabled by default)
- Configuration knobs (via environment variables):
  - `LLM_TIMEOUT_MS` – increase for slower networks/models
  - `LLM_MAX_RETRIES` – increase carefully to survive transient 429s
  - `LLM_TEMPERATURE`, `LLM_MAX_TOKENS` – output behavior/size
- Advanced (code-level) knobs in `src/config/constants.ts`:
  - `RATE_LIMITING.MAX_CONCURRENCY`, `INTERVAL_MS`, `QUEUE_TIMEOUT_MS`
  - `CIRCUIT_BREAKER.FAILURE_THRESHOLD`, `SUCCESS_THRESHOLD`, `COOLDOWN_MS`

Detecting Rate Limits
- Watch stdout/stderr and the log file (`LOG_FILE`, defaults to `.brandos/logs/brandos.log`).
- Signals:
  - Warnings like: `LLM <op> attempt <n> failed` (transient failures/retries)
  - Error: `LLM circuit breaker is open...` (sustained failures)
  - HTTP 429 or provider-specific rate limit errors
- Quick grep:
```
rg -n "circuit breaker|429|rate limit|attempt .* failed" .brandos/logs/brandos.log
```

What to Do If Rate-Limited
- Prefer `BRANDOS_OFFLINE=true` for development/regression runs.
- Reduce concurrency (code constant) or add small delays between LLM-heavy steps.
- Increase `LLM_MAX_RETRIES` modestly; avoid long tight loops.
- Raise `LLM_TIMEOUT_MS` if timeouts dominate.
- If affordable, switch to a smaller/faster model via `DEFAULT_MODEL`.

Build Verification Checklist (For LLMs)
- [ ] Set environment: `ANTHROPIC_API_KEY` (or `BRANDOS_OFFLINE=true`)
- [ ] Run `npm install` (or `--ignore-scripts` if skipping ORACLE)
- [ ] Run `npm run type-check` (should pass)
- [ ] Run `npm run build` (should pass; also generates `docs/agents-manifest.json`)
- [ ] Run `brandos workflow run --brand "Acme" --url "https://acme.com"`
- [ ] Confirm outputs in `outputs/evolution/acme/`
- [ ] Check `LOG_FILE` for rate limit signals; if present, apply mitigation above

CI / Non-Interactive Example
```
export BRANDOS_OFFLINE=true
npm ci --ignore-scripts
npm run build
brandos workflow run --brand "Acme" --url "https://acme.com"
```

Troubleshooting
- Missing API key:
  - Error: `ANTHROPIC_API_KEY is not set...`
  - Fix: Set the env var or use `BRANDOS_OFFLINE=true`.
- Python errors on install:
  - Use `npm install --ignore-scripts` if you don’t need ORACLE.
- Invalid workflow config:
  - CLI `--explain` or orchestrator will print friendly errors with JSON pointers.
- Slow runs/timeouts:
  - Increase `LLM_TIMEOUT_MS` or use offline mode.

References
- Agent contract: `src/agents/IAgent.ts`
- Orchestrator: `src/orchestrator/config-orchestrator.ts`
- Workflow schema: `config/workflow.schema.json`
- LLM client (resilience): `src/services/llm-service.ts`
- Offline stubs and prompt registry: `src/genesis/llm-service.ts`
