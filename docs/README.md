# Brand Builder Pro - Architecture Documentation

**Version**: 1.1.0
**Last Updated**: 2025-10-19

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Module Breakdown](#module-breakdown)
5. [CLI Commands](#cli-commands)
6. [File Structure](#file-structure)
7. [Type System](#type-system)
8. [Testing](#testing)
9. [Development](#development)

---

## System Overview

**Brand Builder Pro** is a CLI-first Brand Intelligence Operating System that combines:
- **AI-Powered Strategy Generation** (Anthropic Claude)
- **Quality Validation** (Enhanced guardian stack)
- **Semantic Search** (ChromaDB vector database)
- **Research Management** (Structured findings database)

**Core Philosophy**: Multi-brand support, type safety, reproducibility, evidence-based outputs.

---

## Architecture

### **High-Level Design**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                          │
│  (Commander.js - 12 commands, 30+ subcommands)             │
└────────────┬────────────────────────────────────────────────┘
             │
     ┌───────┴────────┬───────────────┬──────────────┐
     │                │               │              │
     ▼                ▼               ▼              ▼
┌─────────┐   ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Ingest  │   │  Generate    │  │ Research │  │  ORACLE  │
│ Service │   │  Service     │  │ Database │  │  Client  │
└────┬────┘   └──────┬───────┘  └─────┬────┘  └─────┬────┘
     │               │                │              │
     ▼               ▼                ▼              ▼
┌─────────────┐ ┌──────────┐   ┌──────────┐  ┌──────────┐
│   Parsers   │ │   LLM    │   │  Index   │  │ ChromaDB │
│ PDF/DOCX/TXT│ │ Service  │   │  Search  │  │ (Python) │
└─────────────┘ └──────────┘   └──────────┘  └──────────┘
```

### **Layer Breakdown**

1. **CLI Layer** (`src/cli/`)
   - User-facing commands
   - Input validation
   - Output formatting
   - Error handling

2. **Service Layer** (`src/ingestion/`, `src/llm/`, `src/library/`)
   - Business logic
   - Orchestration
   - State management

3. **Genesis Layer** (`src/genesis/`)
   - Core intelligence modules
   - Research database
   - Project tracker
   - Prompt registry

4. **Infrastructure Layer** (`src/utils/`, `src/types/`)
   - File operations
   - Logging
   - Type definitions
   - Configuration

---

## Data Flow

### **1. Ingestion Flow**

```
Document → Parser → IngestionService → [ORACLE + ResearchDB]
```

**Steps**:
1. User runs: `brandos ingest document.pdf --brand acme`
2. `IngestionService` detects format → routes to parser
3. Parser extracts text, structure, metadata
4. `ResearchDatabase` stores findings with confidence scores
5. `ORACLE` indexes chunks for semantic search
6. `ContextManager` tracks state

**Output**:
- `~/.brandos/acme/data/research-db.json` (findings)
- ChromaDB collection (vectors)
- `context-state.json` (tracking)

### **2. Generation Flow**

```
Query → ContextManager → [ORACLE + ResearchDB] → LLMService → Strategy
```

**Steps**:
1. User runs: `brandos generate --brand acme`
2. `ContextManager` retrieves:
   - High-confidence research findings
   - Semantic context from ORACLE
3. `LLMService` constructs prompt with context
4. Anthropic Claude generates strategy
5. Output saved to `~/.brandos/acme/outputs/`

### **3. Research Flow**

```
Query → ResearchDatabase → [Search/Filter] → Results
```

**Steps**:
1. User runs: `brandos research search "positioning" --brand acme`
2. `DatabaseSearch` filters by keyword
3. `DatabaseIndexer` provides fast lookups
4. Results ranked by confidence
5. Formatted output to CLI

---

## Module Breakdown

### **Genesis Modules** (`src/genesis/`)

#### **1. ResearchDatabase** (480 lines, 4 files)
- **database-core.ts**: CRUD operations, metadata tracking
- **database-search.ts**: Keyword, topic, confidence filtering
- **database-indexer.ts**: Fast lookups by topic/source/confidence/keywords
- **index.ts**: Unified interface (addFinding, searchFindings, getStats, exportToFile)

**Data Model**:
```typescript
interface ResearchFinding {
  topic: string;
  content: string;
  sources: ResearchSource[];
  confidence?: number; // 0-10 scale
  timestamp?: string;
}
```

**Storage**: `~/.brandos/<brand>/data/research-db.json`

#### **2. ProjectTracker** (542 lines, 2 files)
- **project-tracker.ts**: Track 64 deliverables across 5 phases
- **project-tracker-dashboard.ts**: Generate markdown reports

**Features**:
- Phase/deliverable status tracking
- Milestone management
- Progress statistics
- Dashboard generation

**Storage**: `~/.brandos/<brand>/data/project-status.json`

#### **3. PromptRegistry** (1 file)
- SQLite-based prompt versioning
- Create/update/activate/rollback
- Usage statistics
- Template validation

**Storage**: `~/.brandos/.prompts/registry.db`

### **Ingestion Modules** (`src/ingestion/`)

#### **Parsers**
- **pdf-parser.ts**: pdf-parse library
- **docx-parser.ts**: mammoth library
- **text-parser.ts**: Simple text/markdown
- **index.ts**: Parser factory (getParser)

**Output Format**:
```typescript
interface ProcessedContent {
  raw: string;             // Raw text
  structured: {            // Structured data
    headings?: string[];
    sections?: Array<{ heading: string; content: string }>;
    tables?: any[];
  };
  cleaned: string;         // Cleaned for indexing
}
```

#### **IngestionService**
- Orchestrates parsing
- Indexes in ORACLE
- Stores in ResearchDatabase
- Calculates fingerprints
- Confidence scoring

### **LLM Modules** (`src/llm/`, `src/genesis/llm-service.ts`)

#### **LLMService**
- Anthropic Claude integration
- Retry logic (exponential backoff)
- Context injection
- JSON extraction
- Token counting

**Configuration**:
```typescript
interface LLMConfig {
  provider: 'anthropic';
  model: 'claude-sonnet-4.5';
  temperature: 0.7;
  maxTokens: 4096;
}
```

### **ORACLE** (`src/library/oracle-client.ts`, `oracle-service/`)

#### **Architecture**
- **TypeScript Client**: SDK for Node.js
- **Python Service**: FastAPI + ChromaDB
- **Communication**: HTTP REST API

#### **Features**
- Document indexing (chunk + embed)
- Semantic search
- Reranking (Cross-Encoder)
- Multi-brand collections
- Health checks

**Endpoints**:
- `POST /index` - Index document
- `POST /context` - Get context for query
- `POST /search` - Semantic search
- `GET /health` - Health check
- `GET /stats` - Collection statistics

---

## CLI Commands

### **Command Structure**

```bash
brandos <command> [subcommand] [options]
```

### **Available Commands** (12)

| Command | Subcommands | Purpose |
|---------|-------------|---------|
| `init` | - | Initialize brand workspace |
| `ingest` | - | Ingest document (auto-stores in ResearchDB) |
| `research` | list, search, stats, export | Manage research database |
| `generate` | - | Generate brand strategy |
| `narrative` | - | Generate 6-act narrative |
| `brief` | - | Generate agency brief |
| `audit` | - | Audit strategy quality |
| `ask` | - | Q&A with context |
| `context` | status, list, clear, sync | Manage context |
| `prompts` | list, show, create, update, activate, rollback, history, stats, delete | Manage prompts |
| `oracle` | start, stop, status, reindex, search, stats | Manage ORACLE service |
| `evolve` | workshop | Brand evolution workflow |

### **Example Workflows**

#### **Setup Brand**
```bash
brandos init --brand "Acme Inc" --industry Technology --category SaaS
```

#### **Ingest Documents**
```bash
brandos ingest brand-deck.pdf --brand acme --index
brandos ingest competitor-analysis.docx --brand acme --index
```

#### **Research & Query**
```bash
brandos research list --brand acme
brandos research search "positioning" --brand acme
brandos ask "What are our key differentiators?" --brand acme
```

#### **Generate Strategy**
```bash
brandos generate --brand acme --mode professional --use-context
brandos narrative --brand acme --format html
brandos brief --brand acme --detail comprehensive
```

#### **Quality Assurance**
```bash
brandos audit --input outputs/strategy.json --mode comprehensive
```

---

## File Structure

### **Workspace Structure**

```
~/.brandos/<brand>/
├── brand-config.json           # Brand configuration
│
├── data/                       # System data
│   ├── context-state.json      # Context tracking
│   ├── research-db.json        # Research findings
│   └── project-status.json     # Project tracker
│
├── inputs/                     # Raw input files
│   ├── brand-deck.pdf
│   └── user-interviews.docx
│
├── resources/                  # Reference materials
│   └── competitor-analysis.pdf
│
├── documents/                  # Ingested documents
│   └── processed/
│
├── outputs/                    # Generated strategies
│   ├── strategy.json
│   ├── narrative.html
│   └── brief.json
│
└── state/                      # System state
    └── last-generation.json
```

### **Source Code Structure**

```
src/
├── cli/                        # CLI commands
│   ├── index.ts                # Main CLI entry
│   └── commands/               # 12 command files
│
├── genesis/                    # Core intelligence
│   ├── research-database/      # 4-file database
│   ├── project-tracker.ts
│   ├── llm-service.ts
│   └── prompt-registry.ts
│
├── ingestion/                  # Document processing
│   ├── ingestion-service.ts
│   └── parsers/                # PDF, DOCX, TXT
│
├── library/                    # Shared libraries
│   ├── context-manager.ts
│   └── oracle-client.ts
│
├── types/                      # TypeScript types
│   ├── brand-types.ts
│   ├── research-types.ts
│   ├── common-types.ts
│   └── ...
│
├── utils/                      # Utilities
│   ├── file-system.ts
│   ├── logger.ts
│   └── errors.ts
│
└── evolution/                  # Evolution workflow
    ├── pattern-analyzer.ts
    ├── creative-director.ts
    └── validator.ts
```

---

## Type System

### **Core Types**

#### **BrandConfiguration**
```typescript
interface BrandConfiguration {
  brandName: string;
  industry: string;
  category: string;
  companyProfile?: CompanyProfile;
  projectObjectives: ProjectObjectives;
  competitors?: Competitor[];
  targetAudience?: string[];
}
```

#### **ResearchFinding**
```typescript
interface ResearchFinding {
  topic: string;
  content: string;
  sources: ResearchSource[];
  confidence?: number;
  timestamp?: string;
}
```

#### **ResearchSource**
```typescript
interface ResearchSource {
  title: string;
  url: string;
  tier?: SourceTier; // tier1-tier4
  score?: number;
  isRecent?: boolean;
}
```

### **Type Safety**

- **Strict Mode**: Enabled (`tsconfig.json`)
- **No Implicit Any**: Enforced
- **Null Checks**: Strict
- **Files**: 151 TypeScript files
- **Build**: Type-checked before compilation

---

## Testing

### **Framework**: Vitest

### **Test Suites** (83 tests)
- CLI commands (init, generate, audit)
- Library (context-manager, file-system)
- Ingestion (parsers)
- LLM service
- ORACLE client

### **Coverage**
- **Passing**: 82/83 (98.8%)
- **Skipped**: 1
- **Failing**: 0

### **Run Tests**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

---

## Development

### **Setup**

```bash
# Clone repository
git clone https://github.com/kalpeshjaju/brand-builder-16-oct.git
cd brand-builder-16-oct

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add ANTHROPIC_API_KEY

# Build
npm run build

# Link globally
npm run install-global
```

### **Development Workflow**

```bash
# Type-check
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Test
npm test

# Build
npm run build

# Run locally
npm run dev -- init --brand test --industry tech --category saas
```

### **Code Quality**

- **TypeScript**: Strict mode
- **ESLint**: Type-aware linting
- **Prettier**: Code formatting
- **Vitest**: Unit/integration tests
- **Git Hooks**: Pre-commit checks (planned)

---

## Contributing

See [COMPLETION_PLAN.md](./COMPLETION_PLAN.md) for current gaps and roadmap.

**Priority Areas**:
1. Creative director automation
2. Enhanced guardian stack
3. Multi-source parsers
4. Integration tests

---

## License

MIT License - See LICENSE file

---

**Maintained by**: Kalpesh Jaju
**AI Partner**: Claude (Anthropic)
**Repository**: https://github.com/kalpeshjaju/brand-builder-16-oct
