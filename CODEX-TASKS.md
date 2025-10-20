# 🤖 GPT-5/CODEX TASK LIST - 45 Issues

**Project**: brand-builder-16-oct  
**Generated**: 2025-10-20  
**For**: GPT-5/Codex (OpenAI)  
**Source**: Captured from latest time-estimate session  
**Estimated Time**: 16 hours 15 minutes total (T1 3h15, T2 4h05, T3 8h55)

---

## ⏱️ TIME ESTIMATES FOR 45 ISSUES

### Terminal 1 · Type Safety & Imports (15 issues)

| Issue  | Task                                                              | Time   | Difficulty |
|--------|-------------------------------------------------------------------|--------|------------|
| #1-5   | Replace `as any` in 5 files (LLM, Strategy, Context, Ask, Ingest) | 45 min | 🟡 Easy    |
| #6-7   | Fix `Record<string, any>` in Oracle + Quality Metrics             | 20 min | 🟡 Easy    |
| #8     | Remove unused imports                                             | 10 min | 🟢 Trivial |
| #9-10  | Fix `any` in agent constructors + base agent                      | 30 min | 🟡 Easy    |
| #11    | Convert wildcard imports to named imports                         | 15 min | 🟡 Easy    |
| #12    | Make `BaseAgent` generic                                          | 40 min | 🟠 Medium  |
| #13-14 | Improve type narrowing patterns                                   | 25 min | 🟡 Easy    |
| #15    | Add JSDoc for type predicates                                     | 10 min | 🟢 Trivial |

**Terminal 1 Total**: 3 hours 15 minutes

---

### Terminal 2 · Error Handling & Validation (15 issues)

| Issue | Task                                          | Time   | Difficulty |
|-------|-----------------------------------------------|--------|------------|
| #16   | Add logging to empty catch block (Audit)      | 5 min  | 🟢 Trivial |
| #17   | Improve error messages (Evolution)            | 10 min | 🟢 Trivial |
| #18   | Add input validation (Oracle command)         | 20 min | 🟡 Easy    |
| #19   | Replace `process.exit` with graceful shutdown | 30 min | 🟡 Easy    |
| #20   | Improve error message generation              | 10 min | 🟢 Trivial |
| #21   | Add null checks (Context command)             | 15 min | 🟡 Easy    |
| #22   | Add error handler to retry operations         | 20 min | 🟡 Easy    |
| #23   | Add timeout tracking and logging              | 25 min | 🟡 Easy    |
| #24   | Validate brand name for path traversal        | 30 min | 🟠 Medium  |
| #25   | Add Zod schema validation to JSON reads       | 45 min | 🟠 Medium  |
| #26   | Add parameter validation (Prompt Registry)    | 20 min | 🟡 Easy    |
| #27   | Add file locking/atomic writes                | 40 min | 🟠 Medium  |
| #28   | Add bounds checking (PDF Parser)              | 15 min | 🟡 Easy    |
| #29   | Improve error logging consistency             | 10 min | 🟢 Trivial |
| #30   | Add bounds check (JSON Parser)                | 10 min | 🟢 Trivial |

**Terminal 2 Total**: 4 hours 5 minutes

---

### Terminal 3 · Documentation & Testing (15 issues)

| Issue  | Task                                       | Time   | Difficulty |
|--------|--------------------------------------------|--------|------------|
| #31-32 | Add JSDoc to LLM Service + Prompt Registry | 30 min | 🟡 Easy    |
| #33    | Expand file headers (Base Agent)           | 15 min | 🟢 Trivial |
| #34    | Document edge cases (JSON Parser)          | 20 min | 🟡 Easy    |
| #35    | Add usage examples (Strategy Loader)       | 20 min | 🟡 Easy    |
| #36    | Write tests for LLM Service                | 90 min | 🔴 Hard    |
| #37    | Write tests for Oracle Client              | 75 min | 🔴 Hard    |
| #38    | Write tests for JSON Parser                | 60 min | 🟠 Medium  |
| #39    | Write tests for Strategy Loader            | 75 min | 🔴 Hard    |
| #40-41 | Resolve/document all TODOs                 | 20 min | 🟡 Easy    |
| #42    | Add inline comments (OCR Parser)           | 10 min | 🟢 Trivial |
| #43    | Document complex calculations              | 15 min | 🟡 Easy    |
| #44    | Write tests for Error Handler              | 60 min | 🟠 Medium  |
| #45    | Write tests for Validation Schemas         | 45 min | 🟠 Medium  |

**Terminal 3 Total**: 8 hours 55 minutes

---

### Rollup & Notes

- **Total Effort**: 16 hours 15 minutes across 45 scoped issues.
- Mix of quick wins (logging, imports) and deeper testing work; schedule hard items (#36-39) with sufficient uninterrupted time.
- Coordinate validation tasks with any in-flight schema changes to avoid merge conflicts.
