# CLI Output Guide

Complete reference for all Brand Builder Pro CLI commands and their outputs.

---

## Evolution Commands

### Full Evolution Run

```bash
npm run dev evolve -- --brand "YourBrand" --url "https://yourwebsite.com"
```

**Output Structure:**
```
outputs/evolution/yourbrand/
├── research-blitz.json          # Phase 1 output
├── pattern-presentation.json    # Phase 2 output
├── creative-direction.json      # Phase 3 output
├── validation-report.json       # Phase 4 output
├── brand-strategy.json          # Phase 5 output
└── workflow-state.json          # Progress tracker
```

**Console Output:**
```
🏗️  Brand Evolution Workshop

Brand: YourBrand
URL: https://yourwebsite.com
Output: outputs/evolution/yourbrand

════════════════════════════════════════════
Phase 1: Research Blitz
════════════════════════════════════════════

⏳ Fetching brand website...
✓ Fetched homepage (12.3 KB)
... [continues with full workflow]
```

---

### Per-Phase Commands

#### Phase 1: Research Blitz

```bash
npm run dev evolve research -- \
  --brand "YourBrand" \
  --url "https://yourwebsite.com" \
  [--competitors "https://comp1.com" "https://comp2.com"] \
  [--output "custom/path"] \
  [--force]
```

**Required Options:**
- `--brand <name>` - Brand name (slugified for file paths)
- `--url <url>` - Brand website URL

**Optional:**
- `--competitors <urls...>` - Competitor URLs (space-separated)
- `--output <dir>` - Custom output directory
- `--force` - Re-run even if already complete

**Output File:** `research-blitz.json`

**Output Contents:**
```json
{
  "brandName": "YourBrand",
  "brandUrl": "https://yourwebsite.com",
  "competitorUrls": ["https://comp1.com"],
  "scrapedData": {
    "brand": { "homepage": "...", "pages": [...] },
    "competitors": [...]
  },
  "contradictions": [
    {
      "id": "contradiction-1",
      "brandSays": "We're the fastest",
      "evidenceShows": "No speed claims on website",
      "implication": "Messaging mismatch",
      "severity": "medium",
      "sourcePages": ["homepage"]
    }
  ],
  "generatedAt": "2025-10-21T00:00:00.000Z"
}
```

**Console Example:**
```
════════════════════════════════════════════
Phase 1: Research Blitz
════════════════════════════════════════════

⏳ Fetching brand website...
✓ Fetched homepage (12.3 KB)
✓ Fetched /about (8.1 KB)

🔍 Detecting contradictions...
✓ Found 5 contradictions

📊 Summary

Contradictions detected: 5
Pages analyzed: 3
Competitors analyzed: 1

✅ Phase 1 complete!
📁 Saved to: outputs/evolution/yourbrand/research-blitz.json
```

---

#### Phase 2: Pattern Presentation

```bash
npm run dev evolve present -- \
  --brand "YourBrand" \
  [--url "https://yourwebsite.com"] \
  [--output "custom/path"] \
  [--force]
```

**Required Options:**
- `--brand <name>` - Brand name

**Optional:**
- `--url <url>` - Required only if Phase 1 wasn't run
- `--output <dir>` - Custom output directory
- `--force` - Re-run even if already complete

**Output File:** `pattern-presentation.json`

**Output Contents:**
```json
{
  "brandName": "YourBrand",
  "generatedAt": "2025-10-21T00:00:00.000Z",
  "contradictions": [...],  // Passed through from Phase 1
  "whiteSpace": [
    {
      "id": "gap-1",
      "description": "No competitor addresses sustainability",
      "opportunity": "First-mover advantage in eco-positioning",
      "confidence": 0.8
    }
  ],
  "tensions": [
    {
      "tension": "Premium pricing vs. mass market reach",
      "insight": "Opportunity for tiered offering"
    }
  ],
  "observations": [
    "Strong heritage messaging",
    "Unclear value proposition"
  ]
}
```

**Console Example:**
```
════════════════════════════════════════════
Phase 2: Pattern Presentation
════════════════════════════════════════════

✓ Loaded research from Phase 1

🔍 Analyzing patterns...
✓ Identified 3 white space opportunities
✓ Detected 2 strategic tensions

📊 Summary

White space gaps: 3
Strategic tensions: 2
Key observations: 5

✅ Phase 2 complete!
```

---

#### Phase 3: Creative Direction

**Interactive Mode:**
```bash
npm run dev evolve direct -- --brand "YourBrand"
```

**Non-Interactive Mode (Config):**
```bash
npm run dev evolve direct -- --brand "YourBrand" --config my-config.json
```

**Required Options:**
- `--brand <name>` - Brand name

**Optional:**
- `--config <path>` - Config file for non-interactive mode
- `--url <url>` - Required if earlier phases not run
- `--output <dir>` - Custom output directory
- `--force` - Re-run even if already complete

**Interactive Prompts:**

1. **Contradictions Review** (for each contradiction):
   ```
   Contradiction: Premium quality vs Budget pricing
   How should we treat this contradiction?
   > Explore - This is interesting
     Skip - Not relevant
     Note - Keep in mind
   
   Your creative direction for this contradiction:
   > Reframe as "accessible premium"
   ```

2. **White Space Review** (for each gap):
   ```
   White Space: No competitors address sustainability
   Should we pursue this opportunity?
   > Pursue - Let's explore this
     Skip - Not for us
   
   Your reasoning:
   > Market is ready for eco-friendly premium
   ```

3. **Creative Leaps**:
   ```
   Creative leap (or press Enter to finish):
   > Launch eco-luxury line
   
   Rationale for this leap:
   > Combines sustainability with premium positioning
   
   Add another leap? No
   ```

4. **Intuitions**:
   ```
   Intuition (or press Enter to finish):
   > Market is ready for disruption
   
   Context for this intuition:
   > Customer feedback shows demand
   
   How confident are you?
   > Very confident (0.9)
   
   Add another intuition? No
   ```

5. **Primary Direction**:
   ```
   Summarize your overall direction:
   > Become the sustainable premium brand for conscious consumers
   
   Key themes (comma-separated):
   > sustainability, quality, accessibility
   ```

**Output File:** `creative-direction.json`

**Output Contents:**
```json
{
  "brandName": "YourBrand",
  "generatedAt": "2025-10-21T00:00:00.000Z",
  "selectedContradictions": [
    {
      "patternId": "contradiction-1",
      "pattern": "Premium quality vs Budget pricing",
      "direction": "Reframe as accessible premium",
      "reasoning": "Value perception mismatch"
    }
  ],
  "whiteSpaceDecisions": [
    {
      "gapId": "gap-1",
      "gap": "No competitors address sustainability",
      "decision": "pursue",
      "reasoning": "Market ready for eco-friendly premium"
    }
  ],
  "creativeLeaps": [
    {
      "idea": "Launch eco-luxury line",
      "rationale": "Combines sustainability with premium",
      "relatedPatterns": []
    }
  ],
  "intuitions": [
    {
      "observation": "Market is ready for disruption",
      "context": "Customer feedback shows demand",
      "confidence": 0.9
    }
  ],
  "primaryDirection": "Become the sustainable premium brand",
  "keyThemes": ["sustainability", "quality", "accessibility"]
}
```

**Console Example (Interactive):**
```
════════════════════════════════════════════
Phase 3: Creative Direction
════════════════════════════════════════════

🎨 Creative Direction Session

Brand: YourBrand

Your role: Make creative leaps based on the patterns shown.
Claude will validate and build out your direction.

📋 Part 1: Contradictions Review
... [interactive prompts]

✅ Creative direction captured!

📊 Summary

Primary Direction: Become the sustainable premium brand
Key Themes: sustainability, quality, accessibility

Selected 1 contradictions
Made 1 white space decisions
Captured 1 creative leaps
Recorded 1 intuitions
```

**Console Example (Config Mode):**
```
🎨 Creative Direction (Config Mode)

Brand: YourBrand
Loading configuration...

✅ Creative direction loaded from config!
```

---

#### Phase 4: Validation

```bash
npm run dev evolve validate -- --brand "YourBrand" [--force]
```

**Output File:** `validation-report.json`

**Output Contents:**
```json
{
  "brandName": "YourBrand",
  "generatedAt": "2025-10-21T00:00:00.000Z",
  "alignmentScore": 8,
  "evidence": [
    "Direction reinforces heritage craftsmanship",
    "Aligns with customer desires for sustainability"
  ],
  "concerns": [],
  "brandDnaFactors": ["Quality-first development"],
  "risks": [
    {
      "risk": "Supply chain costs increase",
      "severity": "medium",
      "likelihood": "medium",
      "mitigation": "Lock long-term supplier contracts",
      "impact": "Margins compressed"
    }
  ],
  "viability": {
    "canDeliver": true,
    "resourcesNeeded": ["Supply chain partners", "Certification"],
    "timeframe": "6-12 months",
    "confidence": "high"
  }
}
```

---

#### Phase 5: Build-Out

```bash
npm run dev evolve build -- --brand "YourBrand" [--force]
```

**Output File:** `brand-strategy.json`

**Output Contents:**
```json
{
  "brandName": "YourBrand",
  "generatedAt": "2025-10-21T00:00:00.000Z",
  "positioningStatement": "We are the sustainable premium brand...",
  "targetAudience": {
    "primary": "Conscious consumers aged 25-45",
    "secondary": "Eco-minded professionals"
  },
  "valueProposition": "Premium quality with environmental responsibility",
  "messagingPillars": [
    "Sustainable Materials",
    "Exceptional Craftsmanship",
    "Transparent Process"
  ],
  "brandVoice": {
    "tone": "Authentic, confident, educational",
    "keyPhrases": ["Crafted responsibly", "Quality that lasts"]
  },
  "visualDirection": {
    "colorPalette": ["Earth tones", "Natural greens"],
    "imagery": "Real products in natural settings",
    "typography": "Clean, modern serif"
  },
  "actionPlan": [
    {
      "action": "Update homepage messaging",
      "priority": "high",
      "owner": "Marketing",
      "timeline": "Week 1"
    }
  ]
}
```

---

## State Management

### Workflow State File

Location: `outputs/evolution/{brand}/workflow-state.json`

**Purpose:** Tracks completion of each phase for resume functionality

**Contents:**
```json
{
  "brandName": "YourBrand",
  "brandUrl": "https://yourwebsite.com",
  "startedAt": "2025-10-21T00:00:00.000Z",
  "lastUpdated": "2025-10-21T00:05:00.000Z",
  "outputs": {
    "research": "research-blitz.json",
    "patterns": "pattern-presentation.json",
    "direction": "creative-direction.json",
    "validation": null,
    "buildout": null
  }
}
```

### Resume Behavior

- Completed phases are automatically skipped
- Use `--force` to re-run a specific phase
- State persists across command invocations
- Can resume full evolution from any phase

**Examples:**
```bash
# Run full evolution (skips completed phases)
npm run dev evolve -- --brand "YourBrand" --url "https://yourwebsite.com"

# Force re-run of Phase 3
npm run dev evolve direct -- --brand "YourBrand" --force

# Continue from where you left off
npm run dev evolve -- --brand "YourBrand"  # Auto-resumes
```

---

## Error Handling

### Common Errors

**Error: "Brand URL required"**
```
Cause: Trying to run later phase without URL in state
Solution: Provide --url flag or run earlier phases first
```

**Error: "Creative direction config validation failed"**
```
Cause: Invalid config JSON structure
Solution: Check config against schema in evolution-config-types.ts
```

**Error: "Phase 1 must complete before Phase 2"**
```
Cause: Attempting to skip Phase 1
Solution: Run phases in sequence or provide all required data
```

### Debug Mode

```bash
# Enable detailed logging
DEBUG=brandos:* npm run dev evolve -- --brand "YourBrand" --url "..."
```

---

## Config File Examples

### Creative Direction Config

**File:** `my-creative-direction.json`

```json
{
  "contradictions": [
    {
      "patternId": "contradiction-1",
      "action": "explore",
      "direction": "Lean into premium accessible positioning"
    },
    {
      "patternId": "contradiction-2",
      "action": "skip"
    }
  ],
  "whiteSpace": [
    {
      "gapId": "gap-1",
      "decision": "pursue",
      "reasoning": "Strong market opportunity for eco-premium"
    }
  ],
  "creativeLeaps": [
    {
      "idea": "Launch sustainable premium line",
      "rationale": "Market research shows demand"
    }
  ],
  "intuitions": [
    {
      "observation": "Customers value authenticity over perfection",
      "context": "User interviews and feedback",
      "confidence": 0.9
    }
  ],
  "primaryDirection": "Become the authentic sustainable premium brand",
  "keyThemes": ["sustainability", "authenticity", "quality"]
}
```

**Usage:**
```bash
npm run dev evolve direct -- --brand "YourBrand" --config my-creative-direction.json
```

---

## Output File Reference

### research-blitz.json

**Size:** ~50-200 KB (depends on scraped content)  
**Purpose:** Complete research dump with contradictions  
**Key Fields:**
- `contradictions[]` - Detected brand messaging issues
- `scrapedData` - Full website content
- `competitorUrls` - URLs analyzed

### pattern-presentation.json

**Size:** ~10-30 KB  
**Purpose:** Synthesized patterns for creative direction  
**Key Fields:**
- `whiteSpace[]` - Market opportunities
- `tensions[]` - Strategic contradictions to leverage
- `observations[]` - Key insights

### creative-direction.json

**Size:** ~5-15 KB  
**Purpose:** Your strategic decisions and creative leaps  
**Key Fields:**
- `selectedContradictions[]` - How to handle each contradiction
- `creativeLeaps[]` - Bold strategic ideas
- `primaryDirection` - One-sentence strategy summary

### validation-report.json

**Size:** ~15-40 KB  
**Purpose:** Claude's analysis of your direction  
**Key Fields:**
- `alignmentScore` - How well direction aligns with brand DNA (0-10)
- `risks[]` - Potential issues and mitigations
- `viability` - Delivery assessment

### brand-strategy.json

**Size:** ~30-80 KB  
**Purpose:** Complete executable brand strategy  
**Key Fields:**
- `positioningStatement` - Market position
- `messagingPillars[]` - Core messages
- `visualDirection` - Design guidance
- `actionPlan[]` - Implementation steps

---

## Command Aliases

```bash
# Short aliases for common workflows
alias bb-research="npm run dev evolve research --"
alias bb-direct="npm run dev evolve direct --"
alias bb-full="npm run dev evolve --"

# Usage
bb-research --brand "MyBrand" --url "https://mybrand.com"
bb-direct --brand "MyBrand"
bb-full --brand "MyBrand" --url "https://mybrand.com"
```

---

## Performance Benchmarks

| Phase | Typical Duration | API Calls | Output Size |
|-------|-----------------|-----------|-------------|
| Research | 1-3 min | 3-8 | 50-200 KB |
| Patterns | 30-90 sec | 2-4 | 10-30 KB |
| Direction | 2-10 min | 0 (interactive) | 5-15 KB |
| Validation | 30-60 sec | 4-6 | 15-40 KB |
| Build-Out | 1-2 min | 5-8 | 30-80 KB |
| **Total** | **5-15 min** | **14-26** | **110-365 KB** |

*Durations vary based on website size and LLM response time*

---

## Tips & Best Practices

### 1. Run phases incrementally
```bash
# Day 1: Research and patterns
npm run dev evolve present -- --brand "YourBrand" --url "https://..."

# Day 2: Review patterns, then do creative direction
npm run dev evolve direct -- --brand "YourBrand"

# Day 3: Validate and build out
npm run dev evolve build -- --brand "YourBrand"
```

### 2. Use --force sparingly
```bash
# Good: Re-run direction after changing your mind
npm run dev evolve direct -- --brand "YourBrand" --force

# Avoid: Re-running research wastes API calls
npm run dev evolve research -- --brand "YourBrand" --force  # Only if data changed
```

### 3. Save creative configs
```bash
# After interactive session, save your direction
cp outputs/evolution/yourbrand/creative-direction.json configs/yourbrand-2025-10-21.json

# Re-run validation with same direction later
npm run dev evolve direct -- --brand "YourBrand" --config configs/yourbrand-2025-10-21.json --force
```

### 4. Multiple iterations
```bash
# Test different creative directions
npm run dev evolve direct -- --brand "YourBrand" --config direction-v1.json --force
npm run dev evolve validate -- --brand "YourBrand"
# Review validation report, adjust direction
npm run dev evolve direct -- --brand "YourBrand" --config direction-v2.json --force
npm run dev evolve validate -- --brand "YourBrand" --force
```

---

## Testing Commands

```bash
# Run all tests
npm test

# Run specific integration tests
npm test -- evolution-phases3-5
npm test -- evolution-interactive

# Watch mode
npm test -- --watch
```

---

## Troubleshooting

### Output directory issues

**Problem:** Can't find output files  
**Solution:**
```bash
# Check default output location
ls -la outputs/evolution/$(echo "YourBrand" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')/

# Or specify custom output
npm run dev evolve -- --brand "YourBrand" --output ./my-outputs
```

### State corruption

**Problem:** Phases run in wrong order  
**Solution:**
```bash
# Delete state file and restart
rm outputs/evolution/yourbrand/workflow-state.json
npm run dev evolve research -- --brand "YourBrand" --url "..."
```

### API timeouts

**Problem:** Claude API timeouts  
**Solution:** Phase automatically retries, or run phase individually with --force

---

**Document Version:** 2.0  
**Last Updated:** October 21, 2025  
**Corresponds to:** Brand Builder Pro v1.2.0
