# Interactive Mode Testing Guide

## Manual Testing Steps

### Test 1: Interactive Creative Direction Capture

**Command:**
```bash
npm run dev evolve direction -- --brand "CursorTest" --url "https://example.com"
```

**Expected Behavior:**
1. Should load patterns (or prompt to run research/patterns first)
2. Should present interactive prompts for:
   - Part 1: Contradictions Review
   - Part 2: Market White Space  
   - Part 3: Creative Leaps
   - Part 4: Intuitions
   - Part 5: Primary Direction & Key Themes
3. Should save output to `outputs/evolution/cursortest/`

**What to Test:**
- [ ] Prompts appear correctly
- [ ] Can navigate through all sections
- [ ] Can skip optional sections
- [ ] Output JSON is generated
- [ ] Can resume from saved state

### Test 2: Non-Interactive Mode (Config-Driven)

**Setup:**
Create test config file `test-config.json`:
```json
{
  "contradictions": [
    {
      "patternId": "contradiction-1",
      "action": "address",
      "direction": "Lean into authenticity"
    }
  ],
  "whiteSpace": [
    {
      "gapId": "gap-1",
      "decision": "pursue",
      "reasoning": "Market opportunity exists"
    }
  ],
  "creativeLeaps": [
    {
      "idea": "Revolutionary brand positioning",
      "rationale": "Based on pattern analysis"
    }
  ],
  "intuitions": [
    {
      "feeling": "Strong potential for disruption",
      "source": "Experience in market"
    }
  ],
  "primaryDirection": "Be bold and authentic",
  "keyThemes": ["authenticity", "innovation"]
}
```

**Command:**
```bash
npm run dev evolve direction -- --brand "CursorTest" --url "https://example.com" --config test-config.json
```

**Expected Behavior:**
- Should load config without prompts
- Should process all config sections
- Should generate output immediately

### Test 3: Full Evolution Run

**Command:**
```bash
npm run dev evolve -- --brand "TestBrand" --url "https://example.com"
```

**Expected Behavior:**
- Should run all phases sequentially
- Should transition through research → patterns → direction → validation → buildout
- Direction phase should be interactive (unless --config provided)

## Known Issues to Check

1. **State Persistence:** Verify workflow-state.json is created and updated
2. **Error Recovery:** Test what happens if interrupted mid-session
3. **Config Validation:** Ensure invalid configs produce clear errors
4. **Output Format:** Check that all output files follow expected schema

## Automated Testing

See `tests/integration/evolution-phases3-5-interactive.test.ts` for automated tests with stubbed inquirer.

Run automated tests:
```bash
npm test -- evolution-phases3-5-interactive
```

## Troubleshooting

### Issue: "Brand URL required" error
**Solution:** Either provide --url flag or ensure previous phases ran successfully

### Issue: Inquirer prompts not appearing  
**Solution:** Check terminal supports TTY (won't work in non-interactive shells)

### Issue: Config not being used
**Solution:** Ensure --config flag points to valid JSON file with correct schema

## Success Criteria

✅ Interactive prompts display correctly  
✅ Can complete full direction capture  
✅ Output files generated in correct location  
✅ Config mode works without prompts  
✅ State persists across sessions  
✅ Error messages are helpful
