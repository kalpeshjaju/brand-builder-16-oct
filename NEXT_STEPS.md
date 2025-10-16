# Next Steps for Brand Builder Pro

**Current Status**: Foundation complete, ready for module implementation

---

## Immediate Next Steps (Session 2)

### Step 1: Install Dependencies (5 minutes)

```bash
cd /Users/kalpeshjaju/Development/brand-builder-16-oct
npm install
```

### Step 2: Verify Setup (2 minutes)

```bash
# Should pass with zero errors
npm run type-check

# Should show package info
npm list --depth=0
```

### Step 3: Port GENESIS Module (2-3 hours)

Copy and adapt files from `horizon-brand-builder`:

**3.1 Create Utils First**
```bash
# Copy utility functions
cp ../horizon-brand-builder/src/utils/*.ts src/utils/
# Update imports to use new type system
```

**3.2 Port Core Services**
```bash
# Project Tracker
cp ../horizon-brand-builder/src/services/project-tracker.ts src/genesis/project-tracker.ts

# Research Database (4 files)
mkdir -p src/genesis/research-database
cp ../horizon-brand-builder/src/services/research-database/*.ts src/genesis/research-database/

# Report Generator
cp ../horizon-brand-builder/src/services/report-generator.ts src/genesis/report-generator.ts

# LLM Service
cp ../horizon-brand-builder/src/services/llm-service.ts src/genesis/llm-service.ts
```

**3.3 Port Configuration**
```bash
# Research topics
cp ../horizon-brand-builder/src/config/research-topic-templates.ts src/genesis/config/research-topics.ts

# Deliverables framework
cp ../horizon-brand-builder/src/config/deliverables-framework.ts src/genesis/config/deliverables.ts
```

**3.4 Update Imports**
For each copied file:
- Replace old type imports with: `import type { ... } from '../types/index.js';`
- Update file paths to use new structure
- Ensure `.js` extensions in all imports
- Fix any type mismatches

**3.5 Test Compilation**
```bash
npm run type-check
# Fix any errors before proceeding
```

### Step 4: Port GUARDIAN Module (1-2 hours)

Copy and adapt files from `brand-quality-auditor`:

```bash
# Create guardian directory structure
mkdir -p src/guardian/auditors

# Copy auditors
cp ../brand-quality-auditor/src/auditors/*.ts src/guardian/auditors/

# Copy services
cp ../brand-quality-auditor/src/services/report-generator.ts src/guardian/report-generator.ts

# Update all imports
# Replace: import type { ... } from './types/audit-types.js';
# With: import type { ... } from '../types/index.js';
```

### Step 5: Create Basic CLI (1-2 hours)

**5.1 Create CLI Entry Point**
```typescript
// src/cli/index.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { askCommand } from './commands/ask.js';

const program = new Command();

program
  .name('brandos')
  .description('Brand Builder Pro CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a brand workspace')
  .option('-b, --brand <name>', 'Brand name')
  .action(initCommand);

program
  .command('ask <query>')
  .description('Ask a question')
  .option('-s, --strategy <type>', 'Search strategy')
  .action(askCommand);

program.parse();
```

**5.2 Implement Init Command**
```typescript
// src/cli/commands/init.ts
import type { InitCommandOptions } from '../../types/index.js';

export async function initCommand(options: InitCommandOptions) {
  // Create brand workspace
  // Initialize context manager
  // Create initial config
  console.log(`Initializing workspace for ${options.brand}...`);
}
```

**5.3 Make CLI Executable**
```bash
chmod +x src/cli/index.ts
npm run build
npm link  # Makes 'brandos' command available globally
```

### Step 6: First Integration Test (1 hour)

```typescript
// tests/integration/basic-workflow.test.ts
import { describe, it, expect } from 'vitest';
import { ProjectTracker } from '../../src/genesis/project-tracker.js';

describe('Basic Workflow', () => {
  it('should initialize project tracker', async () => {
    const tracker = new ProjectTracker({
      brandName: 'Test Brand',
      industry: 'Technology',
      category: 'SaaS',
      projectObjectives: {
        primary: 'Test objective',
        goals: ['Goal 1'],
      },
    });

    await tracker.initialize();
    expect(tracker).toBeDefined();
  });
});
```

Run test:
```bash
npm test
```

---

## Session 3: Context Manager & Ingestion Engine

### Implement Context Manager
- File system watchers with chokidar
- SQLite database for state
- SHA-256 fingerprinting
- Knowledge graph

### Implement Smart Ingestion Engine
- PDF parser (using pdf-parse)
- DOCX parser (using mammoth)
- Markdown parser (using marked)
- XLSX parser (using xlsx)

---

## Session 4: ORACLE Module & Daemon

### ORACLE Module
- Python-TypeScript bridge
- ChromaDB integration
- Deterministic QA

### Daemon Service
- Background task queue
- File watch event handling
- State management

---

## Session 5: Testing & Polish

### Testing
- Unit tests (80%+ coverage)
- Integration tests
- E2E CLI tests

### Documentation
- ARCHITECTURE.md
- API docs
- Example workflows

---

## Commands Reference

```bash
# Development
npm run dev              # Run in dev mode
npm run type-check       # TypeScript check
npm run lint            # Lint code
npm run format          # Format code

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Building
npm run build           # Build for production
npm start              # Run built version

# CLI (after npm link)
brandos init --brand "My Brand"
brandos ask "What are our strengths?"
brandos generate --mode professional
brandos audit --input strategy.json
brandos context status
```

---

## Tips for Next Session

1. **Start with type-check**: Run `npm run type-check` frequently
2. **Small commits**: Commit after each file successfully ports
3. **Test as you go**: Don't wait until the end to test
4. **Follow file size rule**: Keep files under 500 lines
5. **Use strict types**: No `any`, use `unknown` when needed
6. **Push to GitHub**: Regular pushes for backup

---

## Troubleshooting

### "Cannot find module"
- Ensure `.js` extension in imports
- Check file paths are correct
- Verify tsconfig.json is correct

### "Type errors"
- Check import paths from `../types/index.js`
- Ensure all types are exported
- Use strict type annotations

### "Module has no default export"
- Use named imports: `import { Foo } from './foo.js';`
- Avoid default exports

---

**Ready to continue!** Start with Step 1: Install Dependencies.

**GitHub**: https://github.com/kalpeshjaju/brand-builder-16-oct
**Current Branch**: main
**Latest Commit**: Type system complete
