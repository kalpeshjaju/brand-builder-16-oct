# Guardian Stack - Usage Guide

**Purpose**: Fact-check claims and verify statement consistency across multiple sources.

---

## Quick Start

### **1. Ingest Research Documents**

First, build your research database by ingesting documents:

```bash
# Ingest brand materials
brandos ingest brand-deck.pdf --brand acme --index
brandos ingest company-website.docx --brand acme --index
brandos ingest investor-presentation.pdf --brand acme --index

# Ingest market research
brandos ingest industry-report.pdf --brand acme --index
brandos ingest competitor-analysis.docx --brand acme --index

# Check what's in the database
brandos research list --brand acme
brandos research stats --brand acme
```

### **2. Fact-Check Claims**

Verify specific claims against your research database:

```bash
# Check a customer count claim
brandos guardian check "We have 10,000+ active customers" --brand acme

# Check a market position claim
brandos guardian check "We are the leading platform in our category" --brand acme

# Check a performance claim
brandos guardian check "Our platform reduces operational costs by 50%" --brand acme
```

### **3. Verify Cross-Source Consistency**

Check if statements are consistent across multiple sources:

```bash
# Verify positioning statement
brandos guardian verify "Enterprise-grade platform for growing businesses" --brand acme

# Verify market claim
brandos guardian verify "Fastest-growing solution in the market" --brand acme

# Verify value proposition
brandos guardian verify "Combines affordability with premium features" --brand acme
```

---

## Understanding Output

### **Fact Check Report**

```
Fact Check Report:
Claim: "We have 10,000+ active customers"
  Status: ✓ Verified
  Confidence: high (8/10)
  Recommendation: ✓ ACCEPT

Sources:
  Supporting: 3
    1. Q4 2024 Investor Report (tier: tier1)
    2. Company Website Homepage (tier: tier2)
    3. CEO Interview - TechCrunch (tier: tier2)
  Contradicting: 0

Notes:
  • Found 3 supporting source(s)
  • 2 tier1 (high-quality) source(s)
```

**Key Fields**:
- **Status**: Verified or Not Verified
- **Confidence**: high (8-10), medium (5-7), low (3-4), unverified (0-2)
- **Recommendation**:
  - ✓ ACCEPT - Use the claim confidently
  - ⚠ VERIFY - Needs more evidence
  - ✗ REJECT - Evidence contradicts claim
  - ⚠ NEEDS REVIEW - Conflicting evidence found
- **Sources**: List of supporting and contradicting sources

### **Cross-Source Verification Report**

```
Cross-Source Verification Report:
Statement: "Industry-leading customer satisfaction"
  Status: ✗ Inconsistent
  Level: Weak
  Score: 4/10
  Recommendation: ⚠ INVESTIGATE

Sources Analyzed:
  Total: 5
  Agree: 2
  Disagree: 2
  Neutral: 1

Source Quality:
  Tier 1: 1
  Tier 2: 2
  Tier 3: 1
  Tier 4: 1
  Average Quality: 2.4/4

⚠️ Conflicts Detected:
  1. MAJOR: High-quality sources disagree
     Company Press Release vs Industry Benchmark Report
     Suggestion: Seek additional tier1 sources or expert review
```

**Key Fields**:
- **Status**: Consistent or Inconsistent
- **Level**: Strong, Moderate, Weak, Conflicting
- **Score**: 0-10 consensus score
- **Recommendation**:
  - ✓ ACCEPT - Statement is well-supported
  - ⚠ INVESTIGATE - Inconsistent sources
  - ✗ REJECT - Sources disagree
  - ⚠ NEEDS MORE SOURCES - Insufficient data
- **Conflicts**: Major (tier1 vs tier1) or Minor (tier2 vs tier2)

---

## Source Tiers

The guardian stack categorizes sources by quality:

| Tier | Description | Examples | Weight |
|------|-------------|----------|--------|
| **tier1** | Official, authoritative | Financial reports, official docs, academic papers | Highest |
| **tier2** | Credible secondary | News articles, industry reports, verified reviews | High |
| **tier3** | General information | Blog posts, social media, forums | Medium |
| **tier4** | Unverified | User-generated, anonymous sources | Low |

**How Tiers Affect Verification**:
- Tier1 sources weighted more heavily in consensus
- Major conflicts detected when tier1 sources disagree
- Minimum tier requirements can be configured

---

## Configuration

### **FactChecker Configuration**

Default settings:
```typescript
{
  minSourcesRequired: 2,         // Need at least 2 sources to verify
  minConfidenceThreshold: 7,     // Score must be ≥7/10 to accept
  requireTier1Sources: false,    // Don't require tier1 sources
  checkContradictions: true      // Detect contradicting evidence
}
```

### **CrossSourceVerifier Configuration**

Default settings:
```typescript
{
  minSourcesForConsensus: 3,     // Need 3+ sources for consensus
  consensusThreshold: 0.7,       // 70% of sources must agree
  tierWeighting: true,           // Weight tier1 sources more
  detectConflicts: true          // Detect major/minor conflicts
}
```

---

## Common Workflows

### **Workflow 1: Strategy Validation**

Validate claims in your strategy document:

```bash
# 1. Ingest research
brandos ingest market-research/*.pdf --brand acme --index

# 2. Extract claims from strategy (manual or automated)
# Example claims:
# - "Leading provider of X in Y market"
# - "Trusted by 500+ enterprises"
# - "99.9% uptime SLA"

# 3. Check each claim
brandos guardian check "Leading provider of X in Y market" --brand acme
brandos guardian check "Trusted by 500+ enterprises" --brand acme
brandos guardian check "99.9% uptime SLA" --brand acme

# 4. Review output and adjust strategy based on recommendations
```

### **Workflow 2: Competitive Claims**

Verify competitive positioning statements:

```bash
# 1. Ingest competitor research
brandos ingest competitor-reports/*.pdf --brand acme --index

# 2. Verify competitive claims
brandos guardian verify "Only platform with feature X" --brand acme
brandos guardian verify "Better pricing than competitors" --brand acme
brandos guardian verify "More integrations than any alternative" --brand acme

# 3. Resolve conflicts if detected
# - If MAJOR conflicts: Add more tier1 sources
# - If MINOR conflicts: Clarify the claim
```

### **Workflow 3: Marketing Copy Review**

Check marketing claims before publishing:

```bash
# 1. Have research database ready
brandos research stats --brand acme

# 2. Check website copy claims
brandos guardian check "Fastest deployment in the industry" --brand acme
brandos guardian check "Used by Fortune 500 companies" --brand acme

# 3. Verify consistency of messaging
brandos guardian verify "Enterprise security with startup simplicity" --brand acme

# 4. Only publish claims with ✓ ACCEPT recommendation
```

---

## Best Practices

### **1. Build a Strong Research Database**

- **Ingest diverse sources**: Official docs, reports, news, reviews
- **Include competitors**: Comparative claims need competitor data
- **Update regularly**: Stale data = unreliable verification
- **Use high-quality sources**: Tier1/tier2 sources improve accuracy

### **2. Interpret Results Carefully**

- **ACCEPT (✓)**: Safe to use, well-supported
- **VERIFY (⚠)**: Add more sources before using
- **NEEDS REVIEW (⚠)**: Resolve conflicts first
- **REJECT (✗)**: Don't use, contradicted by evidence

### **3. Handle Conflicts**

When conflicts are detected:
1. **Review conflicting sources** - Which is more authoritative?
2. **Add more tier1 sources** - Seek definitive evidence
3. **Clarify the claim** - May be too broad/vague
4. **Update research** - Sources may be outdated

### **4. Maintain Source Quality**

- Document sources with accurate tiers
- Verify source credibility
- Note source dates (recency matters)
- Update when sources change

---

## Troubleshooting

### **Issue: "No research findings in database"**

**Cause**: Research database is empty.

**Solution**:
```bash
# Check database status
brandos research stats --brand acme

# If empty, ingest documents
brandos ingest document.pdf --brand acme --index
```

### **Issue: "Not Verified (low confidence)"**

**Cause**: Insufficient supporting sources.

**Solution**:
- Ingest more relevant documents
- Check if claim is too specific (broaden it)
- Verify sources are indexed correctly

### **Issue: "Conflicting evidence detected"**

**Cause**: Sources disagree on the claim.

**Solution**:
1. Review conflicting sources
2. Add authoritative sources to resolve
3. Clarify or modify the claim
4. Document the conflict in notes

### **Issue: "Needs more sources"**

**Cause**: Below minimum source threshold.

**Solution**:
```bash
# Check current source count
brandos research search "keyword" --brand acme

# Ingest additional relevant documents
brandos ingest additional-report.pdf --brand acme --index
```

---

## Integration with Workflows

### **With Generation**

```bash
# 1. Generate strategy
brandos generate --brand acme --mode professional

# 2. Extract claims from generated strategy
# (Manual or automated)

# 3. Verify all claims
brandos guardian check "Generated claim 1" --brand acme
brandos guardian check "Generated claim 2" --brand acme

# 4. Edit strategy based on verification results
```

### **With Audit**

```bash
# 1. Audit strategy quality
brandos audit --input strategy.json --mode comprehensive

# 2. For any flagged claims, run guardian checks
brandos guardian check "Flagged claim" --brand acme

# 3. Resolve issues before finalizing
```

---

## Example Verification Report

**Input**: "We reduce customer acquisition costs by 40%"

**Output**:
```
Fact Check Report:
Claim: "We reduce customer acquisition costs by 40%"
  Status: ⚠ Not Verified
  Confidence: medium (6/10)
  Recommendation: ⚠ VERIFY (needs more evidence)

Sources:
  Supporting: 2
    1. Case Study - Enterprise Client A (tier: tier2)
    2. Sales Deck Q3 2024 (tier: tier3)
  Contradicting: 0

Notes:
  • Found 2 supporting source(s)
  • Confidence below threshold (6 < 7)
  • No tier1 (high-quality) source(s)
  • Recommendation: Add authoritative source (e.g., third-party study)
```

**Action**:
- Add tier1 source (third-party study, audit, verified case study)
- OR soften claim ("up to 40%" or "average 40% across clients")
- OR add qualifier ("in our case studies")

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/kalpeshjaju/brand-builder-16-oct/issues
- Documentation: `docs/README.md`
- CLI Help: `brandos guardian --help`
