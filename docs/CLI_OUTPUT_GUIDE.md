# CLI Output Guide

This guide provides examples of the command-line interface (CLI) usage for each phase of the Brand Evolution Workshop, along with snippets of the expected output.

## Phase 1: Research Blitz

This phase analyzes the brand's website and its competitors to identify contradictions and market gaps.

### Usage

```bash
npm run dev evolve research -- --brand "Flyberry" --url "https://flyberry.com" --competitors "https://competitor1.com" "https://competitor2.com"
```

### Output Snippet

```text
Running Phase 1: Research Blitz...
✓ Phase 1: Research Blitz completed

📁 Output directory: /Users/kalpeshjaju/Development/brand-builder-16-oct/outputs/evolution/flyberry

📊 Research Blitz Summary
  • Competitors analyzed: 2
  • Market gaps identified: 3
  • Contradictions detected: 5
```

## Phase 2: Pattern Presentation

This phase synthesizes the research from Phase 1 into a presentation of patterns, including white space opportunities and language gaps.

### Usage

```bash
npm run dev evolve present -- --brand "Flyberry"
```

### Output Snippet

```text
Running Phase 2: Pattern Presentation...
✓ Phase 2: Pattern Presentation completed

📁 Output directory: /Users/kalpeshjaju/Development/brand-builder-16-oct/outputs/evolution/flyberry

🔍 Pattern Presentation Summary
  • Contradictions: 5
  • White space opportunities: 4
  • Language gaps: 6
```

## Phase 3: Creative Direction

This phase is an interactive workshop to define the brand's creative direction. It can also be run non-interactively using a configuration file.

### Usage (Interactive)

```bash
npm run dev evolve direct -- --brand "Flyberry"
```

### Output Snippet (Interactive)

```text
Running Phase 3: Creative Direction...
? What is the primary strategic direction? (Use arrow keys)
❯ Reposition as a premium brand
  Focus on affordability and value
  Target a new niche audience
...
✓ Phase 3: Creative Direction completed

📁 Output directory: /Users/kalpeshjaju/Development/brand-builder-16-oct/outputs/evolution/flyberry

💡 Creative Direction Summary
  • Primary direction: Reposition as a premium brand
  • Key themes: Quality, Heritage, Craftsmanship
  • Creative leaps captured: 2
```

### Usage (Non-Interactive)

```bash
npm run dev evolve direct -- --brand "Flyberry" --config creative-config.json
```

### Output Snippet (Non-Interactive)

```text
Running Phase 3: Creative Direction...
✓ Loaded creative direction config from creative-config.json

✓ Phase 3: Creative Direction completed

📁 Output directory: /Users/kalpeshjaju/Development/brand-builder-16-oct/outputs/evolution/flyberry

💡 Creative Direction Summary
  • Primary direction: Reposition as a premium brand
  • Key themes: Quality, Heritage, Craftsmanship
  • Creative leaps captured: 2
```

## Phase 4: Validation

This phase uses an LLM to validate the chosen creative direction, providing a confidence score and identifying potential risks.

### Usage

```bash
npm run dev evolve validate -- --brand "Flyberry"
```

### Output Snippet

```text
Running Phase 4: Validation...
✓ Phase 4: Validation completed

📁 Output directory: /Users/kalpeshjaju/Development/brand-builder-16-oct/outputs/evolution/flyberry

✅ Validation Summary
  • Recommendation: ✅ PROCEED
  • Confidence: 8.5/10
  • Risks identified: 3
```

## Phase 5: Build-Out

This final phase generates a comprehensive brand strategy document based on all the preceding phases.

### Usage

```bash
npm run dev evolve build -- --brand "Flyberry"
```

### Output Snippet

```text
Running Phase 5: Build-Out...
✓ Phase 5: Build-Out completed

📁 Output directory: /Users/kalpeshjaju/Development/brand-builder-16-oct/outputs/evolution/flyberry

🏗️  Build-Out Summary
  • Positioning statement: For discerning food lovers, Flyberry is the gourmet brand that...
  • Messaging pillars: 3
  • Content examples: 5
  • Channel strategies: 4
  • Roadmap phases: 3
```