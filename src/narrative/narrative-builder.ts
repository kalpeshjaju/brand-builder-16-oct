// Narrative Builder - Transform flat outputs into 6-act story structure

import type {
  NarrativeStructure,
  NarrativeAct,
  NarrativeDocument,
  BrandStrategy,
} from '../types/index.js';
import { FileSystemUtils } from '../utils/index.js';
import path from 'path';

interface BrandContext {
  brandName: string;
  industry?: string;
  category?: string;
  url?: string;
  config?: Record<string, unknown>;
}

interface EvolutionOutputs {
  phase1?: {
    contradictions: Array<{
      id: string;
      type: string;
      severity: string;
      brandSays: string;
      evidenceShows: string;
      implication: string;
    }>;
    analysis?: unknown;
  };
  phase2?: {
    languageGaps?: Array<{ customersSay: string; brandSays: string; gap: string }>;
    inflectionPoints?: Array<{ point: string; significance: string }>;
    marketWhiteSpace?: Array<{ opportunity: string; potential: string }>;
  };
  phase3?: {
    decisions?: Array<{ decision: string; rationale: string }>;
    direction?: string;
  };
  phase4?: {
    validation?: unknown;
  };
  phase5?: {
    roadmap?: unknown;
  };
}

export class NarrativeBuilder {
  private brandContext: BrandContext;
  private strategy?: BrandStrategy;
  private evolutionOutputs?: EvolutionOutputs;
  private auditResults?: unknown;

  constructor(brandName: string) {
    this.brandContext = { brandName };
  }

  /**
   * Load brand context from workspace
   */
  async loadContext(): Promise<void> {
    const workspacePath = FileSystemUtils.getBrandWorkspacePath(this.brandContext.brandName);
    const configPath = path.join(workspacePath, 'brand-config.json');

    if (await FileSystemUtils.fileExists(configPath)) {
      this.brandContext.config = await FileSystemUtils.readJSON(configPath);
    }
  }

  /**
   * Add brand strategy
   */
  setStrategy(strategy: BrandStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Add evolution outputs
   */
  setEvolutionOutputs(outputs: EvolutionOutputs): void {
    this.evolutionOutputs = outputs;
  }

  /**
   * Add audit results
   */
  setAuditResults(results: unknown): void {
    this.auditResults = results;
  }

  /**
   * Build complete 6-act narrative
   */
  async build(): Promise<NarrativeStructure> {
    await this.loadContext();

    const acts: NarrativeAct[] = [
      this.buildAct1_WhoWeAre(),
      this.buildAct2_WhereWeAreToday(),
      this.buildAct3_WhatWeDiscovered(),
      this.buildAct4_WhereWeShouldGo(),
      this.buildAct5_IsThisReady(),
      this.buildAct6_HowWeExecute(),
    ];

    // Calculate metadata
    const totalDocuments = acts.reduce((sum, act) => sum + act.documents.length, 0);
    const totalWords = this.estimateWordCount(acts);

    return {
      brandName: this.brandContext.brandName,
      title: `${this.brandContext.brandName} Brand Transformation Package`,
      subtitle: 'Complete Brand Strategy & Execution Roadmap',
      acts,
      metadata: {
        totalDocuments,
        totalWords,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * ACT 1: WHO WE ARE (Foundation)
   */
  private buildAct1_WhoWeAre(): NarrativeAct {
    const documents: NarrativeDocument[] = [];
    let order = 1;

    // Document 01: Brand Overview
    documents.push({
      id: '01-brand-overview',
      title: 'Brand Overview',
      section: 'Foundation',
      content: this.generateBrandOverview(),
      order: order++,
    });

    // Document 02: Brand Foundation
    if (this.strategy) {
      documents.push({
        id: '02-brand-foundation',
        title: 'Brand Foundation',
        section: 'Foundation',
        content: this.generateBrandFoundation(),
        order: order++,
      });
    }

    // Document 03: Brand Personality
    if (this.strategy?.personality) {
      documents.push({
        id: '03-brand-personality',
        title: 'Brand Personality',
        section: 'Foundation',
        content: this.generateBrandPersonality(),
        order: order++,
      });
    }

    // Document 04: Voice & Tone
    if (this.strategy?.voiceAndTone) {
      documents.push({
        id: '04-voice-and-tone',
        title: 'Voice & Tone Guidelines',
        section: 'Foundation',
        content: this.generateVoiceAndTone(),
        order: order++,
      });
    }

    return {
      actNumber: 1,
      title: 'WHO WE ARE',
      description: 'Brand foundation, identity, and core attributes',
      documents,
    };
  }

  /**
   * ACT 2: WHERE WE ARE TODAY (Current Reality)
   */
  private buildAct2_WhereWeAreToday(): NarrativeAct {
    const documents: NarrativeDocument[] = [];
    let order = 1;

    // Document 05: Current Positioning
    if (this.strategy?.positioning) {
      documents.push({
        id: '05-current-positioning',
        title: 'Current Brand Positioning',
        section: 'Current State',
        content: this.generateCurrentPositioning(),
        order: order++,
      });
    }

    // Document 06: Contradictions Found
    if (this.evolutionOutputs?.phase1?.contradictions) {
      documents.push({
        id: '06-contradictions',
        title: 'Brand Contradictions Analysis',
        section: 'Current State',
        content: this.generateContradictions(),
        order: order++,
      });
    }

    // Document 07: Current Challenges
    documents.push({
      id: '07-current-challenges',
      title: 'Current Challenges',
      section: 'Current State',
      content: this.generateCurrentChallenges(),
      order: order++,
    });

    return {
      actNumber: 2,
      title: 'WHERE WE ARE TODAY',
      description: 'Current state analysis, contradictions, and challenges',
      documents,
    };
  }

  /**
   * ACT 3: WHAT WE DISCOVERED (Market Intelligence)
   */
  private buildAct3_WhatWeDiscovered(): NarrativeAct {
    const documents: NarrativeDocument[] = [];
    let order = 1;

    // Document 08: Language Gaps
    if (this.evolutionOutputs?.phase2?.languageGaps) {
      documents.push({
        id: '08-language-gaps',
        title: 'Customer Language vs Brand Language',
        section: 'Insights',
        content: this.generateLanguageGaps(),
        order: order++,
      });
    }

    // Document 09: Inflection Points
    if (this.evolutionOutputs?.phase2?.inflectionPoints) {
      documents.push({
        id: '09-inflection-points',
        title: 'Strategic Inflection Points',
        section: 'Insights',
        content: this.generateInflectionPoints(),
        order: order++,
      });
    }

    // Document 10: Market Opportunities
    if (this.evolutionOutputs?.phase2?.marketWhiteSpace) {
      documents.push({
        id: '10-market-opportunities',
        title: 'Market White Space & Opportunities',
        section: 'Insights',
        content: this.generateMarketOpportunities(),
        order: order++,
      });
    }

    return {
      actNumber: 3,
      title: 'WHAT WE DISCOVERED',
      description: 'Market intelligence, patterns, and strategic insights',
      documents,
    };
  }

  /**
   * ACT 4: WHERE WE SHOULD GO (Strategic Vision)
   */
  private buildAct4_WhereWeShouldGo(): NarrativeAct {
    const documents: NarrativeDocument[] = [];
    let order = 1;

    // Document 11: Brand Vision
    if (this.strategy?.vision) {
      documents.push({
        id: '11-brand-vision',
        title: 'Brand Vision & Mission',
        section: 'Strategy',
        content: this.generateBrandVision(),
        order: order++,
      });
    }

    // Document 12: New Positioning
    if (this.strategy?.positioning) {
      documents.push({
        id: '12-new-positioning',
        title: 'Strategic Brand Positioning',
        section: 'Strategy',
        content: this.generateNewPositioning(),
        order: order++,
      });
    }

    // Document 13: Messaging Architecture
    if (this.strategy?.keyMessages) {
      documents.push({
        id: '13-messaging-architecture',
        title: 'Messaging Architecture',
        section: 'Strategy',
        content: this.generateMessagingArchitecture(),
        order: order++,
      });
    }

    // Document 14: Competitive Differentiation
    if (this.strategy?.differentiators) {
      documents.push({
        id: '14-differentiation',
        title: 'Competitive Differentiation Strategy',
        section: 'Strategy',
        content: this.generateDifferentiation(),
        order: order++,
      });
    }

    return {
      actNumber: 4,
      title: 'WHERE WE SHOULD GO',
      description: 'Strategic vision, positioning, and messaging framework',
      documents,
    };
  }

  /**
   * ACT 5: IS THIS READY? (Quality Validation)
   */
  private buildAct5_IsThisReady(): NarrativeAct {
    const documents: NarrativeDocument[] = [];
    let order = 1;

    // Document 15: Comprehensive Audit
    if (this.auditResults) {
      documents.push({
        id: '15-comprehensive-audit',
        title: 'Comprehensive Quality Audit',
        section: 'Validation',
        content: this.generateAuditReport(),
        order: order++,
      });
    }

    // Document 16: Gap Analysis
    documents.push({
      id: '16-gap-analysis',
      title: 'Strategic Gap Analysis',
      section: 'Validation',
      content: this.generateGapAnalysis(),
      order: order++,
    });

    // Document 17: Readiness Assessment
    documents.push({
      id: '17-readiness-assessment',
      title: 'Implementation Readiness',
      section: 'Validation',
      content: this.generateReadinessAssessment(),
      order: order++,
    });

    return {
      actNumber: 5,
      title: 'IS THIS READY?',
      description: 'Quality validation, gap analysis, and readiness assessment',
      documents,
    };
  }

  /**
   * ACT 6: HOW WE EXECUTE (Action Plan)
   */
  private buildAct6_HowWeExecute(): NarrativeAct {
    const documents: NarrativeDocument[] = [];
    let order = 1;

    // Document 18: Execution Overview
    documents.push({
      id: '18-execution-overview',
      title: 'Execution Roadmap Overview',
      section: 'Execution',
      content: this.generateExecutionOverview(),
      order: order++,
    });

    // Document 19: Phase 1 Actions
    documents.push({
      id: '19-phase-1-actions',
      title: 'Phase 1: Foundation (Weeks 1-4)',
      section: 'Execution',
      content: this.generatePhase1Actions(),
      order: order++,
    });

    // Document 20: Phase 2 Actions
    documents.push({
      id: '20-phase-2-actions',
      title: 'Phase 2: Implementation (Weeks 5-12)',
      section: 'Execution',
      content: this.generatePhase2Actions(),
      order: order++,
    });

    // Document 21: Success Metrics
    documents.push({
      id: '21-success-metrics',
      title: 'Success Metrics & KPIs',
      section: 'Execution',
      content: this.generateSuccessMetrics(),
      order: order++,
    });

    // Document 22: Decision Framework
    documents.push({
      id: '22-decision-framework',
      title: 'Go/No-Go Decision Framework',
      section: 'Execution',
      content: this.generateDecisionFramework(),
      order: order++,
    });

    return {
      actNumber: 6,
      title: 'HOW WE EXECUTE',
      description: 'Implementation roadmap, action plans, and success metrics',
      documents,
    };
  }

  // ============================================
  // Document Generators
  // ============================================

  private generateBrandOverview(): string {
    const sections: string[] = [];

    sections.push(`# Brand Overview: ${this.brandContext.brandName}\n`);
    sections.push(`**Generated**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`);
    sections.push('---\n');

    sections.push('## Executive Summary\n');
    sections.push(`${this.brandContext.brandName} is positioned as a ${this.strategy?.positioning || 'leading brand in its category'}.\n`);

    if (this.brandContext.industry) {
      sections.push(`\n**Industry**: ${this.brandContext.industry}`);
    }

    if (this.brandContext.category) {
      sections.push(`\n**Category**: ${this.brandContext.category}`);
    }

    if (this.brandContext.url) {
      sections.push(`\n**Website**: ${this.brandContext.url}`);
    }

    return sections.join('\n');
  }

  private generateBrandFoundation(): string {
    if (!this.strategy) return '';

    const sections: string[] = [];

    sections.push(`# Brand Foundation\n`);
    sections.push('## Purpose, Mission, Vision\n');

    if (this.strategy.purpose) {
      sections.push('### Purpose\n');
      sections.push(`${this.strategy.purpose}\n`);
    }

    if (this.strategy.mission) {
      sections.push('### Mission\n');
      sections.push(`${this.strategy.mission}\n`);
    }

    if (this.strategy.vision) {
      sections.push('### Vision\n');
      sections.push(`${this.strategy.vision}\n`);
    }

    if (this.strategy.values && this.strategy.values.length > 0) {
      sections.push('### Core Values\n');
      this.strategy.values.forEach((value, index) => {
        sections.push(`${index + 1}. **${value}**`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  private generateBrandPersonality(): string {
    if (!this.strategy?.personality) return '';

    const sections: string[] = [];

    sections.push(`# Brand Personality\n`);
    sections.push('## Personality Traits\n');

    this.strategy.personality.forEach(trait => {
      sections.push(`- ${trait}`);
    });

    return sections.join('\n');
  }

  private generateVoiceAndTone(): string {
    if (!this.strategy?.voiceAndTone) return '';

    const sections: string[] = [];

    sections.push(`# Voice & Tone Guidelines\n`);

    if (this.strategy.voiceAndTone.voice) {
      sections.push('## Brand Voice\n');
      sections.push(`${this.strategy.voiceAndTone.voice}\n`);
    }

    if (this.strategy.voiceAndTone.toneAttributes && this.strategy.voiceAndTone.toneAttributes.length > 0) {
      sections.push('## Tone Attributes\n');
      this.strategy.voiceAndTone.toneAttributes.forEach(attr => {
        sections.push(`- ${attr}`);
      });
    }

    return sections.join('\n');
  }

  private generateCurrentPositioning(): string {
    const sections: string[] = [];

    sections.push(`# Current Brand Positioning\n`);
    sections.push(`${this.strategy?.positioning || 'Positioning analysis pending.'}\n`);

    return sections.join('\n');
  }

  private generateContradictions(): string {
    if (!this.evolutionOutputs?.phase1?.contradictions) return '';

    const sections: string[] = [];
    sections.push(`# Brand Contradictions Analysis\n`);
    sections.push('## Contradictions Found\n');

    this.evolutionOutputs.phase1.contradictions.forEach((contradiction, index) => {
      sections.push(`### ${index + 1}. ${contradiction.id} (${contradiction.severity})\n`);
      sections.push(`**Brand Says**: ${contradiction.brandSays}\n`);
      sections.push(`**Evidence Shows**: ${contradiction.evidenceShows}\n`);
      sections.push(`**Implication**: ${contradiction.implication}\n`);
    });

    return sections.join('\n');
  }

  private generateCurrentChallenges(): string {
    const sections: string[] = [];

    sections.push(`# Current Challenges\n`);
    sections.push('Based on the analysis conducted, the following challenges have been identified:\n');

    if (this.evolutionOutputs?.phase1?.contradictions) {
      sections.push(`\n## Contradiction-Related Challenges\n`);
      sections.push(`- ${this.evolutionOutputs.phase1.contradictions.length} contradictions identified`);
      sections.push('- Gap between brand promises and execution');
    }

    return sections.join('\n');
  }

  private generateLanguageGaps(): string {
    if (!this.evolutionOutputs?.phase2?.languageGaps) return '';

    const sections: string[] = [];
    sections.push(`# Customer Language vs Brand Language\n`);
    sections.push('## Language Gaps Identified\n');

    sections.push('| Customers Say | Brand Says | Gap |\n');
    sections.push('|---------------|------------|-----|\n');

    this.evolutionOutputs.phase2.languageGaps.forEach(gap => {
      sections.push(`| ${gap.customersSay} | ${gap.brandSays} | ${gap.gap} |`);
    });

    return sections.join('\n');
  }

  private generateInflectionPoints(): string {
    if (!this.evolutionOutputs?.phase2?.inflectionPoints) return '';

    const sections: string[] = [];
    sections.push(`# Strategic Inflection Points\n`);

    this.evolutionOutputs.phase2.inflectionPoints.forEach((point, index) => {
      sections.push(`## ${index + 1}. ${point.point}\n`);
      sections.push(`**Significance**: ${point.significance}\n`);
    });

    return sections.join('\n');
  }

  private generateMarketOpportunities(): string {
    if (!this.evolutionOutputs?.phase2?.marketWhiteSpace) return '';

    const sections: string[] = [];
    sections.push(`# Market White Space & Opportunities\n`);

    this.evolutionOutputs.phase2.marketWhiteSpace.forEach((opp, index) => {
      sections.push(`## ${index + 1}. ${opp.opportunity}\n`);
      sections.push(`**Potential**: ${opp.potential}\n`);
    });

    return sections.join('\n');
  }

  private generateBrandVision(): string {
    if (!this.strategy) return '';

    const sections: string[] = [];
    sections.push(`# Brand Vision & Mission\n`);

    if (this.strategy.vision) {
      sections.push('## Vision\n');
      sections.push(`${this.strategy.vision}\n`);
    }

    if (this.strategy.mission) {
      sections.push('## Mission\n');
      sections.push(`${this.strategy.mission}\n`);
    }

    return sections.join('\n');
  }

  private generateNewPositioning(): string {
    const sections: string[] = [];
    sections.push(`# Strategic Brand Positioning\n`);
    sections.push(`${this.strategy?.positioning || ''}\n`);

    return sections.join('\n');
  }

  private generateMessagingArchitecture(): string {
    if (!this.strategy?.keyMessages) return '';

    const sections: string[] = [];
    sections.push(`# Messaging Architecture\n`);
    sections.push('## Key Messages\n');

    this.strategy.keyMessages.forEach((message, index) => {
      sections.push(`${index + 1}. ${message}`);
    });

    return sections.join('\n');
  }

  private generateDifferentiation(): string {
    if (!this.strategy?.differentiators) return '';

    const sections: string[] = [];
    sections.push(`# Competitive Differentiation Strategy\n`);
    sections.push('## Key Differentiators\n');

    this.strategy.differentiators.forEach(diff => {
      sections.push(`- ${diff}`);
    });

    return sections.join('\n');
  }

  private generateAuditReport(): string {
    const sections: string[] = [];
    sections.push(`# Comprehensive Quality Audit\n`);
    sections.push('Quality audit results pending integration.\n');

    return sections.join('\n');
  }

  private generateGapAnalysis(): string {
    const sections: string[] = [];
    sections.push(`# Strategic Gap Analysis\n`);
    sections.push('Analysis of gaps between current state and desired future state.\n');

    return sections.join('\n');
  }

  private generateReadinessAssessment(): string {
    const sections: string[] = [];
    sections.push(`# Implementation Readiness\n`);
    sections.push('## Readiness Checklist\n');
    sections.push('- [ ] Brand strategy documented\n');
    sections.push('- [ ] Quality audit completed\n');
    sections.push('- [ ] Stakeholder alignment achieved\n');
    sections.push('- [ ] Resources allocated\n');

    return sections.join('\n');
  }

  private generateExecutionOverview(): string {
    const sections: string[] = [];
    sections.push(`# Execution Roadmap Overview\n`);
    sections.push('## Implementation Phases\n');
    sections.push('### Phase 1: Foundation (Weeks 1-4)\n');
    sections.push('- Finalize brand identity\n');
    sections.push('- Create brand guidelines\n');
    sections.push('### Phase 2: Implementation (Weeks 5-12)\n');
    sections.push('- Roll out brand across touchpoints\n');
    sections.push('- Train team members\n');

    return sections.join('\n');
  }

  private generatePhase1Actions(): string {
    const sections: string[] = [];
    sections.push(`# Phase 1: Foundation (Weeks 1-4)\n`);
    sections.push('## Week 1: Brand Assets\n');
    sections.push('- [ ] Finalize logo and visual identity\n');
    sections.push('- [ ] Create brand guidelines document\n');
    sections.push('## Week 2-4: Content & Materials\n');
    sections.push('- [ ] Develop key messaging\n');
    sections.push('- [ ] Create marketing materials\n');

    return sections.join('\n');
  }

  private generatePhase2Actions(): string {
    const sections: string[] = [];
    sections.push(`# Phase 2: Implementation (Weeks 5-12)\n`);
    sections.push('## Week 5-8: Internal Rollout\n');
    sections.push('- [ ] Train team on brand guidelines\n');
    sections.push('- [ ] Update internal materials\n');
    sections.push('## Week 9-12: External Launch\n');
    sections.push('- [ ] Launch rebrand externally\n');
    sections.push('- [ ] Monitor and adjust\n');

    return sections.join('\n');
  }

  private generateSuccessMetrics(): string {
    const sections: string[] = [];
    sections.push(`# Success Metrics & KPIs\n`);
    sections.push('## Key Performance Indicators\n');
    sections.push('| Metric | Baseline | Target | Timeframe |\n');
    sections.push('|--------|----------|--------|----------|\n');
    sections.push('| Brand Awareness | TBD | +30% | 6 months |\n');
    sections.push('| Brand Perception | TBD | +25% | 6 months |\n');

    return sections.join('\n');
  }

  private generateDecisionFramework(): string {
    const sections: string[] = [];
    sections.push(`# Go/No-Go Decision Framework\n`);
    sections.push('## Decision Criteria\n');
    sections.push('✅ **GO if**:\n');
    sections.push('- [ ] Strategy is complete and validated\n');
    sections.push('- [ ] Budget approved\n');
    sections.push('- [ ] Stakeholders aligned\n');
    sections.push('\n❌ **NO-GO if**:\n');
    sections.push('- [ ] Critical gaps remain\n');
    sections.push('- [ ] Resources not secured\n');

    return sections.join('\n');
  }

  /**
   * Estimate word count for all acts
   */
  private estimateWordCount(acts: NarrativeAct[]): number {
    let total = 0;

    acts.forEach(act => {
      act.documents.forEach(doc => {
        // Rough estimate: 1 word = 5 characters on average
        total += Math.floor(doc.content.length / 5);
      });
    });

    return total;
  }
}
