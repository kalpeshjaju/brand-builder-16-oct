# Brand Builder Pro

> **CLI-First Brand Intelligence Operating System**

Transform any brand through AI-powered research, strategy generation, quality validation, and semantic intelligence.

## Project Status

🚧 **Under Development** - Created October 16, 2025

## What Is This?

Brand Builder Pro combines four powerful systems into a unified CLI-first platform:

1. **GENESIS** - AI-powered brand strategy generation
2. **GUARDIAN** - 8-layer quality validation system
3. **LIBRARY** - Intelligent document management
4. **ORACLE** - Semantic search and intelligence

## Architecture

### Three-Input System

```
brand-builder-16-oct/
├── inputs/          # Your asks (objectives, questions, tasks)
├── resources/       # SME knowledge (frameworks, research, best practices)
├── documents/       # Official brand materials (strategy, guidelines, assets)
└── outputs/         # Generated results (strategies, audits, reports)
```

### Core Modules

- **GENESIS**: Strategy generation with 77 research topics, 64 deliverables
- **GUARDIAN**: Quality validation with fact-checking, source tiering, variance detection
- **LIBRARY**: Document management, context tracking, smart ingestion
- **ORACLE**: Semantic search with ChromaDB, deterministic QA

## Features

- ✅ CLI-first interaction via file system
- ✅ Multi-brand workspace support
- ✅ 8-layer defense against hallucination
- ✅ SHA-256 fingerprinting for consistency
- ✅ Context manager tracking system knowledge
- ✅ Smart ingestion (PDF, DOCX, MD, XLSX)
- ✅ TypeScript strict mode, production-ready

## Quick Start

```bash
# Install dependencies
npm install

# Initialize a brand workspace
brandos init --brand "Your Brand"

# Ask a question
brandos ask "What are our competitive advantages?"

# Generate strategy
brandos generate --brand "Your Brand"

# Audit quality
brandos audit --input strategy.json

# Check context
brandos context status
```

## Tech Stack

- **TypeScript** (strict mode)
- **Node.js** 20+
- **Python** 3.8+ (for ORACLE module)
- **ChromaDB** (vector database)
- **Claude AI** (Anthropic)
- **SQLite** (local state)

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [CLAUDE.md](CLAUDE.md) - AI assistant guide
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Development guide

## License

MIT

---

**Created**: October 16, 2025
**Status**: Initial Development
