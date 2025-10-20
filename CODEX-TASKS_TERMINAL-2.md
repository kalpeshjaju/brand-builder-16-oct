# 🤖 GPT-5/CODEX TASK LIST — Terminal 2 (Error Handling & Validation)

**Project**: brand-builder-16-oct  
**Generated**: 2025-10-20  
**Terminal**: 2 — Error Handling & Validation  
**Issues**: 15 (≈305 minutes, ~5.1 hours)  
**Focus**: Harden CLI reliability, validate inputs, surface actionable failures, and add safe file IO/parse guards.

---

## 📊 Issue Overview

| Issue | Task                                        | Time  | Difficulty |
|-------|---------------------------------------------|-------|------------|
| #16   | Add logging to empty catch block (Audit)    | 5 min | 🟢 Trivial |
| #17   | Improve error messages (Evolution)          | 10 min| 🟢 Trivial |
| #18   | Add input validation (Oracle command)       | 20 min| 🟡 Easy    |
| #19   | Replace process.exit with graceful shutdown | 30 min| 🟡 Easy    |
| #20   | Improve error message generation            | 10 min| 🟢 Trivial |
| #21   | Add null checks (Context command)           | 15 min| 🟡 Easy    |
| #22   | Add error handler to retry operations       | 20 min| 🟡 Easy    |
| #23   | Add timeout tracking and logging            | 25 min| 🟡 Easy    |
| #24   | Validate brand name for path traversal      | 30 min| 🟠 Medium  |
| #25   | Add Zod schema validation to JSON reads     | 45 min| 🟠 Medium  |
| #26   | Add parameter validation (Prompt Registry)  | 20 min| 🟡 Easy    |
| #27   | Add file locking/atomic writes              | 40 min| 🟠 Medium  |
| #28   | Add bounds checking (PDF Parser)            | 15 min| 🟡 Easy    |
| #29   | Improve error logging consistency           | 10 min| 🟢 Trivial |
| #30   | Add bounds check (JSON Parser)              | 10 min| 🟢 Trivial |

---

### Issue #16 — Add Logging to Empty Catch Block (Audit)
- **File**: `src/cli/commands/audit.ts:61-73`
- **Problem**: The `catch` around loading evolution outputs is empty, silently masking missing folders or real IO failures.
- **Fix**: Log the outcome with context. Treat `ENOENT` (missing directory) as a debug/info message (`logger.info('No evolution outputs found', { brand: loaded.brandName })`) and emit a warning for unexpected errors with the original message preserved. Keep the command running even when outputs are missing.
- **Verification**: `npm run lint` and re-run `npm run type-check`.

### Issue #17 — Improve Evolution Error Messaging
- **Files**: `src/evolution/evolution-orchestrator.ts:123-301`, `src/cli/commands/evolve.ts:23-94`
- **Problem**: Phase failures only emit generic messages like “Pattern presentation failed”; the CLI exits with vague output and no causal hints.
- **Fix**: For each `spinner.fail(...)` branch, include the phase, brand, and the captured error message (use `error instanceof Error`). Re-throw a `CommandExecutionError` (wrapping the original error) so the caller surfaces a rich reason. In `evolveCommand`, remove direct `process.exit` calls and rely on `handleCommandError`-style handling so the improved messages reach users and logs.
- **Verification**: Run `npm run type-check` and execute `npm run build`; smoke-test `npm run dev -- evolve --brand Demo --url https://example.com` to confirm detailed failures.

### Issue #18 — Add Input Validation for Oracle CLI
- **File**: `src/cli/commands/oracle.ts:149-315`
- **Problem**: Commands trust raw `options.brand`, `options.topK`, and `query` strings, enabling path traversal, NaN topK, and empty search terms.
- **Fix**: Use existing sanitizers: `sanitizeBrandName`, `sanitizePositiveInteger`, `sanitizeQuery`, and `sanitizeFilePath` where appropriate. Validate all user options before hitting the client, fail fast with helpful messages, and reflect sanitized values in logs/spinner text. Guard `topK` parsing and disallow zero/negative values.
- **Verification**: `npm run lint` plus manual checks: `npm run dev -- oracle search "" --brand ../../tmp` should now print a validation error instead of hitting the API.

### Issue #19 — Replace `process.exit` with Graceful Shutdown
- **Files**: `src/cli/commands/evolve.ts:86-92`, `src/cli/commands/oracle.ts:33-315`, `src/cli/commands/narrative.ts:145-161`, `src/cli/commands/guardian.ts:91-179`, `src/cli/commands/research.ts:58-202`, `src/cli/commands/prompts.ts`, plus `src/cli/utils/graceful-shutdown.ts`
- **Problem**: Command handlers terminate the process directly, preventing tests from catching errors and bypassing registered cleanup callbacks.
- **Fix**: Replace `process.exit(...)` with either `return` after setting `process.exitCode` or by throwing `CommandExecutionError`. Wire CLI entry points to call `handleCommandError` once, and update `registerGracefulShutdownHandlers` to rely on `process.exitCode` instead of forcing exits. Ensure cleanup callbacks still run.
- **Verification**: `npm run build`, `npm run test`, and run a few commands (`npm run dev -- narratives ...`) to confirm commands exit gracefully without abrupt termination.

### Issue #20 — Improve Agent Error Message Generation
- **Files**: `src/core/base-agent.ts:120-176` and agent subclasses under `src/analysis/agents`, `src/strategy/agents`, `src/generation/agents`, `src/validation/agents`
- **Problem**: `createErrorOutput` delivers generic strings (“Analysis failed”) even when stack/cause data exists, reducing debuggability.
- **Fix**: Introduce a helper in `BaseAgent` that normalizes errors into rich messages (`{ name, message, cause, phase }`). Update agent catch blocks to pass the formatted summary instead of literals. Ensure the error array contains actionable text and retains the underlying message.
- **Verification**: `npm run lint` and run a representative agent test (if available) or execute an orchestrated command to confirm new messages appear in logs.

### Issue #21 — Add Null Guards to Context Command
- **File**: `src/cli/commands/context.ts:25-71`
- **Problem**: Code assumes `contextState.stats` and `files` always exist, throwing when the JSON is incomplete or corrupt.
- **Fix**: Guard each nested access with optional chaining/defaults. When stats are missing, warn and surface a remediation hint instead of throwing. Ensure JSON output remains valid (`undefined` removed, fall back to `[]`/`0`).
- **Verification**: `npm run lint` and manually run `npm run dev -- context status --brand Demo` against an empty or trimmed `context-state.json`.

### Issue #22 — Add Error Handler to Retry Operations
- **File**: `src/cli/utils/error-handler.ts:31-87`
- **Problem**: `runWithRetry` rethrows raw errors; callers lose attempt metadata and spinner feedback when retries exhaust.
- **Fix**: Extend `runWithRetry` to accept an `onFailedAttempt` callback or internally invoke `handleCommandError`-style logging. Wrap the final failure in `CommandExecutionError` with details (`operationName`, `attempts`, `lastErrorMessage`). Update `ask`/`generate`/`health` callers to surface retry info in logs.
- **Verification**: `npm run lint`, then temporarily force a retry (e.g., point LLM to invalid endpoint) and confirm logs include attempt counts.

### Issue #23 — Add Timeout Tracking & Logging
- **Files**: `src/cli/commands/oracle.ts:64-122`, `src/core/base-agent.ts:188-214`
- **Problem**: Long waits (service startup loop, agent timeouts) exit silently without timing information, making diagnosis difficult.
- **Fix**: Capture start time and log elapsed seconds when the Oracle service loop ends (success or timeout). Emit a warning when approaching the timeout threshold. In `BaseAgent.withTimeout`, log and attach the timeout duration to the thrown error so `createErrorOutput` can relay it.
- **Verification**: Run `npm run dev -- oracle start` while blocking the service to observe timeout logs; execute an agent scenario with an injected delay to see timeout metrics.

### Issue #24 — Validate Brand Name to Prevent Path Traversal
- **File**: `src/utils/file-system.ts:118-152`
- **Problem**: `getBrandWorkspacePath` lowercases and hyphenates but does not guard against `../brand`. Attackers can escape the workspace.
- **Fix**: Apply `sanitizeBrandName` (or an equivalent regex) before constructing paths. Reject names containing slashes, `..`, or control characters. Document the constraint and update callers if needed.
- **Verification**: `npm run lint`; unit-test `FileSystemUtils.getBrandWorkspacePath` with malicious inputs.

### Issue #25 — Add Zod Validation to JSON Reads
- **Files**: `src/utils/strategy-loader.ts:70-199`, `src/cli/commands/context.ts`, `src/cli/commands/audit.ts`
- **Problem**: `FileSystemUtils.readJSON` returns `any`; consumers trust unvalidated shapes, leading to runtime errors when the files drift.
- **Fix**: Define Zod schemas for key JSON payloads (strategy files, context state, evolution outputs). Parse results via `parseJSONWithSchema` or new helpers, and throw descriptive errors when data is invalid. Update consumers to rely on typed output.
- **Verification**: `npm run lint`, `npm run type-check`; add/adjust unit tests if present (`npm run test`).

### Issue #26 — Prompt Registry Parameter Validation
- **File**: `src/genesis/prompt-registry.ts:16-180`
- **Problem**: `registerPrompt` and `updatePrompt` accept unchecked objects, allowing malformed prompts to persist.
- **Fix**: Introduce a Zod schema for `PromptTemplate` input (required fields, enums, usage counters). Validate parameters before writing to disk, reject invalid categories/ids, and surface actionable errors. Ensure the cache and versions directory are only updated after validation passes.
- **Verification**: `npm run lint`; run `npm run dev -- prompts list` and `npm run dev -- prompts register ...` with bad arguments to confirm new validation messages.

### Issue #27 — Add File Locking / Atomic Writes
- **File**: `src/utils/file-system.ts:22-83`
- **Problem**: `writeJSON`/`writeFile` write directly to the target path; a crash mid-write can corrupt outputs consumed by downstream commands.
- **Fix**: Write to a temporary file in the same directory (e.g., `filename.tmp`), `fsync`, and `rename` atomically. Optionally guard with advisory locks if multiple writers can collide. Update error messages to mention the temp path when failures occur.
- **Verification**: `npm run lint`; manually interrupt a write (Ctrl+C while generating) and confirm the final file remains intact.

### Issue #28 — PDF Parser Bounds Checking
- **File**: `src/ingestion/parsers/pdf-parser.ts:15-115`
- **Problem**: Large PDFs load fully into memory without size/page limits; malformed documents can exhaust memory or block parsing.
- **Fix**: Add a configurable `maxBytes`/`maxPages` guard (default sane limits). Check `dataBuffer.byteLength` and `result.pages`; if exceeded, throw a descriptive error. Consider truncating extracted text length to protect downstream processing.
- **Verification**: `npm run lint`; ingest an oversized PDF to confirm the graceful failure message.

### Issue #29 — Standardize Error Logging
- **Files**: `src/cli/commands/narrative.ts:129-162`, `src/cli/commands/guardian.ts:91-179`, `src/cli/commands/ingest.ts`, `src/cli/commands/metrics.ts`
- **Problem**: Some commands log via `console.error` without `logger.error`, creating inconsistent telemetry.
- **Fix**: Import `logger` (or instantiate `Logger`) and ensure every catch block emits `logger.error('<command> failed', error)` before user-facing output. Keep console output for UX, but align logging for observability.
- **Verification**: `npm run lint`; execute affected commands with forced failures and confirm unified log entries.

### Issue #30 — Add Bounds Check in JSON Parser
- **File**: `src/utils/json-parser.ts:24-108`
- **Problem**: Regex matches operate on entire responses; extremely long strings can hang or blow memory.
- **Fix**: Impose a hard cap (e.g., 100_000 chars) on the substring inspected, short-circuit when input exceeds the limit, and mention truncation in error logs. Ensure the logging preview remains bounded.
- **Verification**: `npm run test` (if parser tests exist); run a manual parse with a huge response to see the bounded behavior.

---

## ✅ Suggested Regression Checks (Post-Implementation)
- `npm run lint && npm run type-check`
- `npm run test` (focus on strategy loader, prompt registry, PDF parser)
- Manual CLI smoke tests: `brandos audit`, `brandos evolve`, `brandos oracle start/search`, `brandos context status`
- Verify logs in `.brandos/logs` capture enriched error details after induced failures.
