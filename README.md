# Brand Builder Pro

> **AI-Powered Brand Evolution Workshop**

Transform your brand through intelligent research, contradiction detection, and strategic guidance.

## Production Status

⚠️ **Partially Ready** — See `PRODUCTION_READY_STATUS.md`

- Phases 1–2 validated end-to-end
- Zero TypeScript errors
- Real-world tested with revaaforyou.com
- Further fixes and validation tracked in `PRODUCTION_READY_STATUS.md`

---

## What Is This?

Brand Builder Pro is an AI-powered brand evolution workshop that:

1. **Analyzes your brand** - Deep-dive into website, messaging, and positioning
2. **Detects contradictions** - Find gaps between what you say and what you show
3. **Identifies opportunities** - Language gaps, inflection points, market positioning
4. **Guides strategy** - Interactive workshop to evolve your brand

---

## Quick Start

### Installation

```bash
# 1. Clone and install
git clone https://github.com/kalpeshjaju/brand-builder-16-oct.git
cd brand-builder-16-oct
npm install

# 2. Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# 3. Build
npm run build
```

### Usage

**Full Evolution Workshop:**

```bash
# Run complete 5-phase evolution
npm run dev evolve -- --brand "YourBrand" --url "https://yourwebsite.com"

# With competitors
npm run dev evolve -- --brand "YourBrand" --url "https://yourwebsite.com" \
  --competitors "https://competitor1.com" "https://competitor2.com"
```

**Per-Phase Commands:**

```bash
# Phase 1: Research Blitz (~2 min)
npm run dev evolve research -- --brand "YourBrand" --url "https://yourwebsite.com"

# Phase 2: Pattern Presentation (~1 min)
npm run dev evolve present -- --brand "YourBrand"
# Automatically uses results from Phase 1 if available

# Phase 3: Creative Direction (interactive)
npm run dev evolve direct -- --brand "YourBrand"
# Or use non-interactive mode with config:
npm run dev evolve direct -- --brand "YourBrand" --config creative-config.json

# Phase 4: Validation (~1 min)
npm run dev evolve validate -- --brand "YourBrand"

# Phase 5: Build-Out (~2 min)
npm run dev evolve build -- --brand "YourBrand"
```

**Common Options:**

```bash
--force              # Re-run phase even if already complete
--output <dir>       # Custom output directory
--competitors <urls> # Competitor URLs for analysis
--config <path>      # Config file (for non-interactive Phase 3)
```

**Examples:**

```bash
# Run only research phase
npm run dev evolve research -- --brand "Revaa" --url "https://revaaforyou.com"

# Resume from Phase 3 with config
npm run dev evolve direct -- --brand "Revaa" --config my-direction.json

# Re-run validation with --force
npm run dev evolve validate -- --brand "Revaa" --force
```

**What each phase does:**

| Phase | Command | Duration | Description |
|-------|---------|----------|-------------|
| 1. Research Blitz | `research` | ~2 min | Web analysis, contradiction detection |
| 2. Pattern Presentation | `present` | ~1 min | Language gaps, inflection points |
| 3. Creative Direction | `direct` | Interactive | Strategic decision guidance (you lead) |
| 4. Validation | `validate` | ~1 min | Claude validates your direction |
| 5. Build-Out | `build` | ~2 min | Generate complete strategy |

**Initialize Brand Workspace:**

```bash
npm run dev init -- --brand "YourBrand" --industry "Technology" --category "SaaS"
```
## Features

### Working (Production-Ready)
- ✅ **Web Fetching** - Robust with retry logic & caching (5MB content)
- ✅ **Brand Analysis** - Deep contradiction detection
- ✅ **Pattern Recognition** - Language gaps, inflection points
- ✅ **Workspace Management** - Multi-brand support
- ✅ **Phase 3-5 Automation** - Config-mode tests covering creative direction, validation, and build-out flows
- ✅ **Test Suite** - 76 tests, 100% pass rate

### Planned (Future)
- ⏳ Complete strategy generation
- ⏳ Quality validation system
- ⏳ Document ingestion

---

## Real-World Example

**Test with Revaa (revaaforyou.com)**:

```bash
npm run dev evolve -- --brand "Revaa" --url "https://revaaforyou.com"
```

**Results**:
- ✅ 7 contradictions detected (e.g., promises aesthetic appeal but has no visual identity)
- ✅ 7 language gaps identified
- ✅ 5 inflection points found
- ✅ Analysis completed in 3 minutes

---

## Development

```bash
# Type check
npm run type-check

# Build
npm run build

# Tests (76 tests, 100% passing)
npm test

# Watch mode
npm run test:watch
```

---

## Tech Stack

- **TypeScript** (strict mode, zero errors)
- **Node.js** 20+
- **Claude AI** (Anthropic Sonnet 4.5)
- **Vitest** (testing framework)
- **Axios + Cheerio** (web fetching)

---

## Project Structure

```
brand-builder-16-oct/
├── src/
│   ├── cli/              # Command-line interface
│   ├── evolution/        # Evolution workshop (Phases 1-5)
│   ├── utils/            # Web fetching, JSON parsing, logging
│   └── types/            # TypeScript definitions
├── tests/
│   └── unit/             # 76 tests (100% passing)
├── .brandos/             # Brand workspaces (auto-generated)
└── docs/                 # Documentation
```

---

## Quality Metrics

**Tests**: ✅ 76/76 passing (100%)
**TypeScript**: ✅ Zero errors (strict mode)
**Coverage**: ~25% (significant increase from 14%)
**Build**: ✅ Successful
**Real-world**: ✅ Validated with revaaforyou.com

---

## Documentation

- [FINAL_PRODUCTION_STATUS.md](FINAL_PRODUCTION_STATUS.md) - Complete status report
- [FINAL_STATUS.md](FINAL_STATUS.md) - Feature status
- [CLI_OUTPUT_GUIDE.md](docs/CLI_OUTPUT_GUIDE.md) - CLI standards
- [LLM Collaboration Guide](docs/LLM_COLLABORATION_GUIDE.md) - How to add/modify agents safely
- [Workflow Config](docs/WORKFLOW_CONFIG.md) - Define stages/agents via JSON
- [Non-Technical Overview](docs/NON_TECHNICAL_OVERVIEW.md) - Plain-English walkthrough
- [Build & Rate Limits](docs/BUILD_AND_RATE_LIMITS.md) - Build/run steps and rate-limit playbook
- [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) - What to build next and how

---

## Recent Updates (Oct 17, 2025)

✅ **Production-Ready Achieved**:
- Fixed 6 critical bugs
- Created 52 new tests
- Achieved 100% test pass rate
- Validated with real-world data
- Updated all dependencies
- Fixed maxContentLength bug (500KB → 5MB)

---

## What's Working

### ✅ Evolution Workshop (Phases 1-2)
- Brand website analysis
- Contradiction detection
- Language gap identification
- Inflection point detection
- Pattern presentation

### ✅ Evolution Workshop (Phases 3-5)
- Creative direction capture via config or interactive prompts
- Validation engine scored with automated regression tests
- Build-out generator verified through deterministic integration test

### ✅ Workspace Management
- Multi-brand support
- Directory creation
- Configuration management

### ✅ Utilities
- Web fetching with retry & caching
- JSON parsing with 5-strategy fallback
- CLI output with verbosity control

---

## Known Limitations

- Interactive prompts only work in terminal (not in background)
- ESLint configuration not setup
- SPA sites may require JS rendering (optional flag planned)

---

## License

MIT

---

**Created**: October 16, 2025
**Status**: ⚠️ Phases 1–2 Validated (see `PRODUCTION_READY_STATUS.md`)

**Note**: We are aligning architecture toward a pluggable agent model in-place. A new orchestrator and agent interface will be introduced incrementally without breaking existing flows.
