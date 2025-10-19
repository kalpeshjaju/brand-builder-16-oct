/**
 * Cross-Source Verifier - Validates consistency across multiple sources
 *
 * FROM: horizon-brand-builder
 * ADAPTED FOR: brand-builder-16-oct structure
 *
 * Features:
 * - Multi-source consistency checking
 * - Contradiction detection
 * - Consensus building
 * - Source reliability scoring
 * - Conflict resolution recommendations
 */

import type { ResearchSource } from '../../types/common-types.js';
import type { ResearchFinding } from '../../types/research-types.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('CrossSourceVerifier');

export interface VerificationResult {
  statement: string;
  isConsistent: boolean;
  consensusLevel: 'strong' | 'moderate' | 'weak' | 'conflicting';
  consensusScore: number; // 0-10
  agreeSources: ResearchSource[];
  disagreeSources: ResearchSource[];
  neutralSources: ResearchSource[];
  totalSourcesChecked: number;
  reliability: {
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
    averageTierQuality: number; // 1-4 (lower is better)
  };
  recommendation: 'accept' | 'investigate' | 'reject' | 'needs_more_sources';
  conflicts: Conflict[];
  verifiedAt: string;
}

export interface Conflict {
  source1: ResearchSource;
  source2: ResearchSource;
  description: string;
  severity: 'major' | 'minor';
  resolutionSuggestion: string;
}

export interface CrossSourceConfig {
  minSourcesForConsensus: number; // Minimum sources to establish consensus
  consensusThreshold: number; // Percentage of sources that must agree (0-1)
  tierWeighting: boolean; // Weight tier1 sources more heavily
  detectConflicts: boolean; // Enable conflict detection
}

export class CrossSourceVerifier {
  private config: CrossSourceConfig;

  constructor(config?: Partial<CrossSourceConfig>) {
    this.config = {
      minSourcesForConsensus: config?.minSourcesForConsensus ?? 3,
      consensusThreshold: config?.consensusThreshold ?? 0.7,
      tierWeighting: config?.tierWeighting ?? true,
      detectConflicts: config?.detectConflicts ?? true,
    };

    logger.info('CrossSourceVerifier initialized', this.config);
  }

  /**
   * Verify a statement across multiple research findings
   */
  async verify(
    statement: string,
    findings: ResearchFinding[]
  ): Promise<VerificationResult> {
    logger.info('Verifying statement', { statement: statement.slice(0, 100) });

    // Categorize sources based on their stance
    const { agree, disagree, neutral } = this.categorizeSources(statement, findings);

    // Calculate reliability metrics
    const reliability = this.calculateReliability([...agree, ...disagree, ...neutral]);

    // Calculate consensus
    const consensusScore = this.calculateConsensus(agree, disagree, neutral, reliability);
    const consensusLevel = this.scoreToConsensusLevel(consensusScore);

    // Detect conflicts
    const conflicts = this.config.detectConflicts
      ? this.detectConflicts(agree, disagree, statement)
      : [];

    // Determine if consistent
    const isConsistent = this.isStatementConsistent(
      agree,
      disagree,
      consensusScore
    );

    // Get recommendation
    const recommendation = this.getRecommendation(
      isConsistent,
      consensusScore,
      agree,
      disagree,
      conflicts
    );

    const result: VerificationResult = {
      statement,
      isConsistent,
      consensusLevel,
      consensusScore,
      agreeSources: agree,
      disagreeSources: disagree,
      neutralSources: neutral,
      totalSourcesChecked: agree.length + disagree.length + neutral.length,
      reliability,
      recommendation,
      conflicts,
      verifiedAt: new Date().toISOString(),
    };

    logger.info('Verification complete', {
      isConsistent,
      consensus: consensusLevel,
      sources: result.totalSourcesChecked,
    });

    return result;
  }

  /**
   * Verify multiple statements in batch
   */
  async verifyBatch(
    statements: string[],
    findings: ResearchFinding[]
  ): Promise<VerificationResult[]> {
    logger.info('Batch verification', { count: statements.length });

    const results: VerificationResult[] = [];
    for (const statement of statements) {
      const result = await this.verify(statement, findings);
      results.push(result);
    }

    return results;
  }

  /**
   * Categorize sources based on their stance toward statement
   */
  private categorizeSources(
    statement: string,
    findings: ResearchFinding[]
  ): {
    agree: ResearchSource[];
    disagree: ResearchSource[];
    neutral: ResearchSource[];
  } {
    const agree: ResearchSource[] = [];
    const disagree: ResearchSource[] = [];
    const neutral: ResearchSource[] = [];

    const statementLower = statement.toLowerCase();
    const statementKeywords = this.extractKeywords(statementLower);

    for (const finding of findings) {
      const contentLower = finding.content.toLowerCase();

      // Calculate relevance
      const relevanceScore = this.calculateRelevance(statementKeywords, contentLower);

      if (relevanceScore < 0.2) {
        // Not relevant enough
        continue;
      }

      // Detect stance
      const stance = this.detectStance(statementLower, contentLower);

      finding.sources.forEach((source) => {
        // Avoid duplicates
        const isDuplicate =
          agree.some((s) => s.url === source.url) ||
          disagree.some((s) => s.url === source.url) ||
          neutral.some((s) => s.url === source.url);

        if (isDuplicate) return;

        if (stance === 'agree') {
          agree.push({ ...source, score: relevanceScore });
        } else if (stance === 'disagree') {
          disagree.push({ ...source, score: relevanceScore });
        } else {
          neutral.push({ ...source, score: relevanceScore });
        }
      });
    }

    return { agree, disagree, neutral };
  }

  /**
   * Detect stance of content toward statement
   */
  private detectStance(
    statement: string,
    content: string
  ): 'agree' | 'disagree' | 'neutral' {
    // Simple heuristic-based detection
    const negationWords = ['not', 'no', 'never', 'false', 'incorrect', 'wrong', 'oppose'];
    const affirmationWords = ['yes', 'true', 'correct', 'confirm', 'verify', 'validate', 'support'];

    // Check for key phrases from statement in content
    const statementPhrases = statement.split(/[,\.;]/).map((p) => p.trim());
    let agreeCount = 0;
    let disagreeCount = 0;

    for (const phrase of statementPhrases) {
      if (phrase.length < 10) continue; // Skip short phrases

      if (content.includes(phrase)) {
        // Check for negation nearby
        const phraseIndex = content.indexOf(phrase);
        const contextBefore = content.slice(Math.max(0, phraseIndex - 50), phraseIndex);

        const hasNegation = negationWords.some((word) => contextBefore.includes(word));
        const hasAffirmation = affirmationWords.some((word) => contextBefore.includes(word));

        if (hasNegation) {
          disagreeCount++;
        } else if (hasAffirmation) {
          agreeCount++;
        } else {
          agreeCount++; // Presence implies agreement
        }
      }
    }

    if (agreeCount > disagreeCount) return 'agree';
    if (disagreeCount > agreeCount) return 'disagree';
    return 'neutral';
  }

  /**
   * Calculate reliability metrics
   */
  private calculateReliability(sources: ResearchSource[]): VerificationResult['reliability'] {
    const tier1Count = sources.filter((s) => s.tier === 'tier1').length;
    const tier2Count = sources.filter((s) => s.tier === 'tier2').length;
    const tier3Count = sources.filter((s) => s.tier === 'tier3').length;
    const tier4Count = sources.filter((s) => s.tier === 'tier4' || !s.tier).length;

    const averageTierQuality = sources.length > 0
      ? (tier1Count * 1 + tier2Count * 2 + tier3Count * 3 + tier4Count * 4) / sources.length
      : 4;

    return {
      tier1Count,
      tier2Count,
      tier3Count,
      tier4Count,
      averageTierQuality,
    };
  }

  /**
   * Calculate consensus score
   */
  private calculateConsensus(
    agree: ResearchSource[],
    disagree: ResearchSource[],
    neutral: ResearchSource[],
    reliability: VerificationResult['reliability']
  ): number {
    const total = agree.length + disagree.length + neutral.length;
    if (total === 0) return 0;

    let score = 0;

    // Base score from agreement ratio
    const agreeRatio = agree.length / total;
    score += agreeRatio * 6; // Max 6 points

    // Weighted score if tier weighting enabled
    if (this.config.tierWeighting) {
      const tier1AgreeCount = agree.filter((s) => s.tier === 'tier1').length;
      const tier1Total = reliability.tier1Count;

      if (tier1Total > 0) {
        const tier1AgreeRatio = tier1AgreeCount / tier1Total;
        score += tier1AgreeRatio * 2; // Max 2 points bonus
      }
    }

    // Bonus for high source count
    if (total >= this.config.minSourcesForConsensus) {
      score += 1;
    }

    // Penalty for disagreement
    const disagreeRatio = disagree.length / total;
    score -= disagreeRatio * 3;

    // Bonus for source quality
    score += (4 - reliability.averageTierQuality) * 0.5;

    // Clamp to 0-10
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Check if statement is consistent across sources
   */
  private isStatementConsistent(
    agree: ResearchSource[],
    disagree: ResearchSource[],
    consensusScore: number
  ): boolean {
    const total = agree.length + disagree.length;
    if (total < this.config.minSourcesForConsensus) {
      return false;
    }

    const agreeRatio = agree.length / total;
    if (agreeRatio < this.config.consensusThreshold) {
      return false;
    }

    if (consensusScore < 6) {
      return false;
    }

    return true;
  }

  /**
   * Detect conflicts between sources
   */
  private detectConflicts(
    agree: ResearchSource[],
    disagree: ResearchSource[],
    statement: string
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Major conflict: tier1 sources disagree
    const tier1Agree = agree.filter((s) => s.tier === 'tier1');
    const tier1Disagree = disagree.filter((s) => s.tier === 'tier1');

    if (tier1Agree.length > 0 && tier1Disagree.length > 0) {
      tier1Agree.forEach((source1) => {
        tier1Disagree.forEach((source2) => {
          conflicts.push({
            source1,
            source2,
            description: `High-quality sources disagree on: "${statement.slice(0, 80)}..."`,
            severity: 'major',
            resolutionSuggestion: 'Seek additional tier1 sources or expert review',
          });
        });
      });
    }

    // Minor conflict: tier2 sources disagree
    const tier2Agree = agree.filter((s) => s.tier === 'tier2');
    const tier2Disagree = disagree.filter((s) => s.tier === 'tier2');

    if (tier2Agree.length > 0 && tier2Disagree.length > 0 && tier2Agree[0] && tier2Disagree[0]) {
      conflicts.push({
        source1: tier2Agree[0],
        source2: tier2Disagree[0],
        description: `Medium-quality sources show conflicting information`,
        severity: 'minor',
        resolutionSuggestion: 'Verify with tier1 sources',
      });
    }

    return conflicts;
  }

  /**
   * Get recommendation based on verification results
   */
  private getRecommendation(
    isConsistent: boolean,
    consensusScore: number,
    agree: ResearchSource[],
    disagree: ResearchSource[],
    conflicts: Conflict[]
  ): 'accept' | 'investigate' | 'reject' | 'needs_more_sources' {
    const total = agree.length + disagree.length;

    if (total < this.config.minSourcesForConsensus) {
      return 'needs_more_sources';
    }

    if (conflicts.some((c) => c.severity === 'major')) {
      return 'investigate';
    }

    if (isConsistent && consensusScore >= 7) {
      return 'accept';
    }

    if (!isConsistent && consensusScore < 4) {
      return 'reject';
    }

    return 'investigate';
  }

  /**
   * Convert consensus score to level
   */
  private scoreToConsensusLevel(score: number): 'strong' | 'moderate' | 'weak' | 'conflicting' {
    if (score >= 8) return 'strong';
    if (score >= 6) return 'moderate';
    if (score >= 4) return 'weak';
    return 'conflicting';
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'they', 'will', 'would']);
    return words.filter((word) => !stopWords.has(word));
  }

  /**
   * Calculate relevance between keywords and text
   */
  private calculateRelevance(keywords: string[], text: string): number {
    if (keywords.length === 0) return 0;

    const matches = keywords.filter((keyword) => text.includes(keyword));
    return matches.length / keywords.length;
  }
}
