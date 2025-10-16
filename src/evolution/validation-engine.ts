/**
 * Phase 4: Validation Engine
 *
 * Validates creative direction against research evidence
 * Provides logic-based assessment, risk analysis, feasibility check
 */

import { LLMService } from '../genesis/llm-service.js';
import { Logger } from '../utils/logger.js';
import type {
  ResearchBlitzOutput,
  CreativeDirectionOutput,
  ValidationOutput,
  AlignmentCheck,
  EvidenceAssessment,
  Risk,
  FeasibilityCheck,
  MarketViability
} from '../types/evolution-types.js';

const logger = new Logger('ValidationEngine');

export class ValidationEngine {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService({ temperature: 0.1 }); // Very low temp for analytical work
  }

  /**
   * Validate creative direction
   */
  async validate(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<ValidationOutput> {
    logger.info('Validating creative direction', {
      brand: direction.brandName,
      direction: direction.primaryDirection,
    });

    try {
      // 1. Alignment Check
      logger.info('Checking brand DNA alignment...');
      const alignmentCheck = await this.checkAlignment(research, direction);

      // 2. Evidence Assessment
      logger.info('Assessing supporting evidence...');
      const evidenceAssessment = await this.assessEvidence(research, direction);

      // 3. Risk Analysis
      logger.info('Analyzing risks...');
      const riskAnalysis = await this.analyzeRisks(research, direction);

      // 4. Feasibility Check
      logger.info('Checking feasibility...');
      const feasibilityCheck = await this.checkFeasibility(research, direction);

      // 5. Market Viability
      logger.info('Assessing market viability...');
      const marketViability = await this.assessMarketViability(research, direction);

      // 6. Differentiation Score
      logger.info('Calculating differentiation score...');
      const differentiationScore = await this.calculateDifferentiation(research, direction);

      // 7. Overall Confidence & Recommendation
      const { overallConfidence, recommendation, modifications } = this.calculateRecommendation({
        alignmentCheck,
        evidenceAssessment,
        riskAnalysis,
        feasibilityCheck,
        marketViability,
        differentiationScore,
      });

      const output: ValidationOutput = {
        brandName: direction.brandName,
        direction: direction.primaryDirection,
        generatedAt: new Date().toISOString(),
        alignmentCheck,
        evidenceAssessment,
        riskAnalysis,
        feasibilityCheck,
        marketViability,
        differentiationScore,
        overallConfidence,
        recommendation,
        modifications,
      };

      logger.info('Validation complete', {
        confidence: overallConfidence,
        recommendation,
      });

      return output;
    } catch (error) {
      logger.error('Validation failed', error);
      throw new Error(
        `Failed to validate creative direction\n` +
        `Reason: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check alignment with brand DNA
   */
  private async checkAlignment(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<AlignmentCheck> {
    const systemPrompt = `You are analyzing brand alignment.
Check if the proposed direction fits with the brand's DNA, history, and capabilities.
Be analytical and objective.`;

    const userPrompt = `Brand: ${research.brandName}

CURRENT BRAND STATE:
${research.brandAudit.currentState}

CURRENT POSITIONING:
${research.brandAudit.positioning}

PROPOSED DIRECTION:
${direction.primaryDirection}

KEY THEMES:
${direction.keyThemes.join(', ')}

Assess alignment (0-10 scale):
1. Does this fit the brand's DNA?
2. What evidence supports alignment?
3. What concerns exist?
4. What brand DNA factors are relevant?

Format as JSON with keys: score, evidence, concerns, brandDnaFactors`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        score: typeof parsed.score === 'number' ? parsed.score : 5,
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
        brandDnaFactors: Array.isArray(parsed.brandDnaFactors) ? parsed.brandDnaFactors : [],
      };
    } catch (error) {
      logger.error('Failed to parse alignment check', error);
      return {
        score: 5,
        evidence: ['Unable to assess'],
        concerns: ['Assessment incomplete'],
        brandDnaFactors: [],
      };
    }
  }

  /**
   * Assess supporting and contradicting evidence
   */
  private async assessEvidence(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<EvidenceAssessment> {
    const systemPrompt = `You are assessing evidence for a strategic direction.
Identify what supports it and what contradicts it.
Base assessment on research findings ONLY.`;

    const marketGaps = research.marketGaps.map(g => `${g.gap}: ${g.description}`).join('\n');
    const contradictions = research.contradictions.map(c => c.what).join('\n');

    const userPrompt = `Proposed Direction: ${direction.primaryDirection}

AVAILABLE RESEARCH:

Market Gaps:
${marketGaps}

Contradictions:
${contradictions}

Customer Language:
${JSON.stringify(research.customerLanguage, null, 2)}

For the proposed direction, identify:
1. Supporting evidence (from research)
2. Contradicting evidence (from research)
3. Net confidence (0-10)

Format as JSON with keys: supportingEvidence (array of {source, finding, confidence}), contradictingEvidence (same structure), netConfidence`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        supportingEvidence: Array.isArray(parsed.supportingEvidence) ? parsed.supportingEvidence : [],
        contradictingEvidence: Array.isArray(parsed.contradictingEvidence) ? parsed.contradictingEvidence : [],
        netConfidence: typeof parsed.netConfidence === 'number' ? parsed.netConfidence / 10 : 0.5,
      };
    } catch (error) {
      logger.error('Failed to parse evidence assessment', error);
      return {
        supportingEvidence: [],
        contradictingEvidence: [],
        netConfidence: 0.5,
      };
    }
  }

  /**
   * Analyze risks
   */
  private async analyzeRisks(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<Risk[]> {
    const systemPrompt = `You are analyzing strategic risks.
Identify what could go wrong with this direction.
Be realistic but not overly pessimistic.`;

    const userPrompt = `Direction: ${direction.primaryDirection}

Themes: ${direction.keyThemes.join(', ')}

Current Market Context:
${research.competitors.map(c => `${c.name}: ${c.positioning}`).join('\n')}

Identify 5-7 risks:
- What could go wrong?
- Severity (low/medium/high)
- Likelihood (low/medium/high)
- Mitigation strategy
- Potential impact

Format as JSON array with keys: risk, severity, likelihood, mitigation, impact`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any) => ({
        risk: item.risk || '',
        severity: item.severity || 'medium',
        likelihood: item.likelihood || 'medium',
        mitigation: item.mitigation || '',
        impact: item.impact || '',
      }));
    } catch (error) {
      logger.error('Failed to parse risk analysis', error);
      return [];
    }
  }

  /**
   * Check feasibility
   */
  private async checkFeasibility(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<FeasibilityCheck> {
    const systemPrompt = `You are assessing feasibility.
Can this brand actually deliver on the proposed direction?
What would it take?`;

    const userPrompt = `Brand: ${research.brandName}
Direction: ${direction.primaryDirection}

Current State:
${research.brandAudit.currentState}

Assess:
1. Can the brand deliver on this? (yes/no)
2. What requirements are needed?
3. What gaps exist?
4. Estimated timeline
5. Required resources

Format as JSON with keys: canDeliver, requirements, gaps, timeline, resources`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        canDeliver: parsed.canDeliver !== false, // Default to true
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
        timeline: parsed.timeline || 'Unknown',
        resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      };
    } catch (error) {
      logger.error('Failed to parse feasibility check', error);
      return {
        canDeliver: true,
        requirements: [],
        gaps: [],
        timeline: 'Unknown',
        resources: [],
      };
    }
  }

  /**
   * Assess market viability
   */
  private async assessMarketViability(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<MarketViability> {
    const systemPrompt = `You are assessing market viability.
Will this direction resonate with a viable market segment?`;

    const marketGaps = research.marketGaps.map(g => `${g.gap} (${g.opportunitySize})`).join('\n');

    const userPrompt = `Direction: ${direction.primaryDirection}

Market Gaps:
${marketGaps}

Customer Desires:
${research.customerLanguage.desires.join(', ')}

Assess market viability:
1. Score (0-10)
2. Target segment description
3. Estimated segment size
4. Factors that support resonance
5. Barriers to adoption

Format as JSON with keys: score, targetSegment, segmentSize, resonanceFactors, barriers`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        score: typeof parsed.score === 'number' ? parsed.score : 5,
        targetSegment: parsed.targetSegment || 'Unknown',
        segmentSize: parsed.segmentSize || 'Unknown',
        resonanceFactors: Array.isArray(parsed.resonanceFactors) ? parsed.resonanceFactors : [],
        barriers: Array.isArray(parsed.barriers) ? parsed.barriers : [],
      };
    } catch (error) {
      logger.error('Failed to parse market viability', error);
      return {
        score: 5,
        targetSegment: 'Unknown',
        segmentSize: 'Unknown',
        resonanceFactors: [],
        barriers: [],
      };
    }
  }

  /**
   * Calculate differentiation score
   */
  private async calculateDifferentiation(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<number> {
    const systemPrompt = `You are calculating differentiation.
How unique and distinctive is this direction vs. competitors?`;

    const competitorPositionings = research.competitors
      .map(c => c.positioning)
      .join('\n');

    const userPrompt = `Proposed Direction: ${direction.primaryDirection}

Competitor Positionings:
${competitorPositionings}

Rate differentiation (0-10):
- 0 = Identical to competitors
- 5 = Some differentiation
- 10 = Completely unique

Return ONLY a number (0-10).`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    const match = response.match(/\d+(\.\d+)?/);
    if (match) {
      const score = parseFloat(match[0]);
      return Math.min(10, Math.max(0, score));
    }

    return 5; // Default middle score
  }

  /**
   * Calculate overall recommendation
   */
  private calculateRecommendation(scores: {
    alignmentCheck: AlignmentCheck;
    evidenceAssessment: EvidenceAssessment;
    riskAnalysis: Risk[];
    feasibilityCheck: FeasibilityCheck;
    marketViability: MarketViability;
    differentiationScore: number;
  }): {
    overallConfidence: number;
    recommendation: 'proceed' | 'modify' | 'reconsider';
    modifications: string[];
  } {
    // Calculate weighted confidence
    const weights = {
      alignment: 0.25,
      evidence: 0.25,
      feasibility: 0.20,
      market: 0.20,
      differentiation: 0.10,
    };

    const alignmentScore = scores.alignmentCheck.score / 10;
    const evidenceScore = scores.evidenceAssessment.netConfidence;
    const feasibilityScore = scores.feasibilityCheck.canDeliver ? 0.8 : 0.3;
    const marketScore = scores.marketViability.score / 10;
    const diffScore = scores.differentiationScore / 10;

    const overallConfidence =
      alignmentScore * weights.alignment +
      evidenceScore * weights.evidence +
      feasibilityScore * weights.feasibility +
      marketScore * weights.market +
      diffScore * weights.differentiation;

    // Determine recommendation
    let recommendation: 'proceed' | 'modify' | 'reconsider';
    const modifications: string[] = [];

    if (overallConfidence >= 0.75) {
      recommendation = 'proceed';
    } else if (overallConfidence >= 0.5) {
      recommendation = 'modify';

      // Suggest modifications based on low scores
      if (alignmentScore < 0.6) {
        modifications.push('Strengthen alignment with brand DNA');
      }
      if (evidenceScore < 0.6) {
        modifications.push('Gather more supporting evidence');
      }
      if (!scores.feasibilityCheck.canDeliver) {
        modifications.push('Address feasibility gaps before proceeding');
      }
      if (marketScore < 0.6) {
        modifications.push('Refine target segment and market approach');
      }
      if (diffScore < 0.5) {
        modifications.push('Increase differentiation vs. competitors');
      }
    } else {
      recommendation = 'reconsider';
      modifications.push('Overall confidence is low - consider alternative directions');
    }

    return {
      overallConfidence,
      recommendation,
      modifications,
    };
  }

  /**
   * Generate markdown validation report
   */
  generateMarkdownReport(validation: ValidationOutput): string {
    let md = `# Validation Report: ${validation.brandName}\n\n`;
    md += `*Direction*: **${validation.direction}**\n\n`;
    md += `*Generated*: ${new Date(validation.generatedAt).toLocaleDateString()}\n\n`;
    md += `---\n\n`;

    // Overall Assessment
    const recEmoji = validation.recommendation === 'proceed' ? '✅' : validation.recommendation === 'modify' ? '🔧' : '⚠️';
    md += `## ${recEmoji} Overall Assessment\n\n`;
    md += `**Confidence Score**: ${(validation.overallConfidence * 10).toFixed(1)}/10\n\n`;
    md += `**Recommendation**: **${validation.recommendation.toUpperCase()}**\n\n`;

    if (validation.modifications.length > 0) {
      md += `**Modifications Needed**:\n`;
      validation.modifications.forEach(m => md += `- ${m}\n`);
      md += `\n`;
    }

    md += `---\n\n`;

    // Alignment Check
    md += `## 🎯 Brand Alignment\n\n`;
    md += `**Score**: ${validation.alignmentCheck.score}/10\n\n`;
    md += `**Evidence**:\n`;
    validation.alignmentCheck.evidence.forEach(e => md += `- ${e}\n`);
    md += `\n`;
    if (validation.alignmentCheck.concerns.length > 0) {
      md += `**Concerns**:\n`;
      validation.alignmentCheck.concerns.forEach(c => md += `- ${c}\n`);
      md += `\n`;
    }

    // Evidence Assessment
    md += `## 📊 Evidence Assessment\n\n`;
    md += `**Net Confidence**: ${(validation.evidenceAssessment.netConfidence * 10).toFixed(1)}/10\n\n`;
    md += `**Supporting Evidence**:\n`;
    validation.evidenceAssessment.supportingEvidence.forEach(e => {
      md += `- ${e.finding} (confidence: ${e.confidence})\n`;
    });
    md += `\n`;

    // Risks
    md += `## ⚠️ Risk Analysis\n\n`;
    validation.riskAnalysis.forEach((risk, i) => {
      const emoji = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
      md += `### ${i + 1}. ${emoji} ${risk.risk}\n\n`;
      md += `**Severity**: ${risk.severity} | **Likelihood**: ${risk.likelihood}\n\n`;
      md += `**Mitigation**: ${risk.mitigation}\n\n`;
    });

    // Feasibility
    md += `## 🔧 Feasibility Check\n\n`;
    md += `**Can Deliver**: ${validation.feasibilityCheck.canDeliver ? 'Yes ✅' : 'No ❌'}\n\n`;
    md += `**Timeline**: ${validation.feasibilityCheck.timeline}\n\n`;
    md += `**Requirements**:\n`;
    validation.feasibilityCheck.requirements.forEach(r => md += `- ${r}\n`);
    md += `\n`;
    if (validation.feasibilityCheck.gaps.length > 0) {
      md += `**Gaps to Address**:\n`;
      validation.feasibilityCheck.gaps.forEach(g => md += `- ${g}\n`);
      md += `\n`;
    }

    // Market Viability
    md += `## 📈 Market Viability\n\n`;
    md += `**Score**: ${validation.marketViability.score}/10\n\n`;
    md += `**Target Segment**: ${validation.marketViability.targetSegment}\n\n`;
    md += `**Segment Size**: ${validation.marketViability.segmentSize}\n\n`;

    // Differentiation
    md += `## 🎨 Differentiation\n\n`;
    md += `**Score**: ${validation.differentiationScore}/10\n\n`;

    return md;
  }
}
