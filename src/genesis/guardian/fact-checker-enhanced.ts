/**
 * Enhanced Fact Checker - Validates claims against multiple sources
 *
 * FROM: horizon-brand-builder
 * ADAPTED FOR: brand-builder-16-oct structure
 *
 * Features:
 * - Multi-source verification
 * - Confidence scoring
 * - Contradiction detection
 * - Evidence tracking
 * - Source quality assessment
 */

import type { SourcedClaim, ResearchSource, ConfidenceLevel } from '../../types/common-types.js';
import type { ResearchFinding } from '../../types/research-types.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('FactCheckerEnhanced');

export interface FactCheckConfig {
  minSourcesRequired: number; // Minimum sources to verify claim
  minConfidenceThreshold: number; // Minimum confidence (0-10) to accept
  requireTier1Sources: boolean; // Require at least one tier1 source
  checkContradictions: boolean; // Enable contradiction detection
}

export interface FactCheckReport {
  claim: string;
  isVerified: boolean;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-10
  sourcesCount: number;
  supportingSources: ResearchSource[];
  contradictingSources: ResearchSource[];
  recommendedAction: 'accept' | 'verify' | 'reject' | 'needs_review';
  notes: string[];
  checkedAt: string;
}

export class FactCheckerEnhanced {
  private config: FactCheckConfig;

  constructor(config?: Partial<FactCheckConfig>) {
    this.config = {
      minSourcesRequired: config?.minSourcesRequired ?? 2,
      minConfidenceThreshold: config?.minConfidenceThreshold ?? 7,
      requireTier1Sources: config?.requireTier1Sources ?? false,
      checkContradictions: config?.checkContradictions ?? true,
    };

    logger.info('FactCheckerEnhanced initialized', this.config);
  }

  /**
   * Check a single claim against research findings
   */
  async checkClaim(
    claim: string,
    findings: ResearchFinding[]
  ): Promise<FactCheckReport> {
    logger.info('Checking claim', { claim: claim.slice(0, 100) });

    // Find supporting evidence
    const supportingSources = this.findSupportingEvidence(claim, findings);
    const contradictingSources = this.config.checkContradictions
      ? this.findContradictingEvidence(claim, findings)
      : [];

    // Calculate confidence
    const confidenceScore = this.calculateConfidence(
      supportingSources,
      contradictingSources,
      findings
    );
    const confidenceLevel = this.scoreToLevel(confidenceScore);

    // Determine verification status
    const isVerified = this.isClaimVerified(
      supportingSources,
      contradictingSources,
      confidenceScore
    );

    // Generate recommendation
    const recommendedAction = this.getRecommendedAction(
      isVerified,
      confidenceScore,
      supportingSources,
      contradictingSources
    );

    // Generate notes
    const notes = this.generateNotes(
      supportingSources,
      contradictingSources,
      confidenceScore
    );

    const report: FactCheckReport = {
      claim,
      isVerified,
      confidence: confidenceLevel,
      confidenceScore,
      sourcesCount: supportingSources.length,
      supportingSources,
      contradictingSources,
      recommendedAction,
      notes,
      checkedAt: new Date().toISOString(),
    };

    logger.info('Claim checked', {
      isVerified,
      confidence: confidenceLevel,
      sources: supportingSources.length,
    });

    return report;
  }

  /**
   * Batch check multiple claims
   */
  async checkClaims(
    claims: string[],
    findings: ResearchFinding[]
  ): Promise<FactCheckReport[]> {
    logger.info('Batch checking claims', { count: claims.length });

    const reports: FactCheckReport[] = [];
    for (const claim of claims) {
      const report = await this.checkClaim(claim, findings);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Check SourcedClaim objects (with existing source info)
   */
  async checkSourcedClaims(
    claims: SourcedClaim[],
    findings: ResearchFinding[]
  ): Promise<FactCheckReport[]> {
    logger.info('Checking sourced claims', { count: claims.length });

    const reports: FactCheckReport[] = [];
    for (const sourcedClaim of claims) {
      const report = await this.checkClaim(sourcedClaim.claim, findings);

      // Augment with existing source info if available
      if (sourcedClaim.source && sourcedClaim.sourceUrl) {
        const existingSource: ResearchSource = {
          title: sourcedClaim.source,
          url: sourcedClaim.sourceUrl,
          tier: this.inferTier(sourcedClaim.confidence),
        };

        // Add to supporting sources if not already present
        if (!report.supportingSources.find((s) => s.url === existingSource.url)) {
          report.supportingSources.push(existingSource);
          report.sourcesCount++;
        }
      }

      reports.push(report);
    }

    return reports;
  }

  /**
   * Find evidence that supports the claim
   */
  private findSupportingEvidence(
    claim: string,
    findings: ResearchFinding[]
  ): ResearchSource[] {
    const claimLower = claim.toLowerCase();
    const claimKeywords = this.extractKeywords(claimLower);
    const sources: ResearchSource[] = [];

    for (const finding of findings) {
      const contentLower = finding.content.toLowerCase();
      const topicLower = finding.topic.toLowerCase();

      // Check if finding contains claim keywords
      const matchScore = this.calculateMatchScore(claimKeywords, contentLower + ' ' + topicLower);

      if (matchScore > 0.3) {
        // Threshold for relevance
        finding.sources.forEach((source) => {
          if (!sources.find((s) => s.url === source.url)) {
            sources.push({
              ...source,
              score: matchScore,
            });
          }
        });
      }
    }

    // Sort by score
    return sources.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Find evidence that contradicts the claim
   */
  private findContradictingEvidence(
    claim: string,
    findings: ResearchFinding[]
  ): ResearchSource[] {
    // Simple contradiction detection (in production, use NLP)
    const contradictionKeywords = ['not', 'never', 'false', 'incorrect', 'wrong', 'opposed'];
    const claimLower = claim.toLowerCase();
    const sources: ResearchSource[] = [];

    for (const finding of findings) {
      const contentLower = finding.content.toLowerCase();

      // Check if finding contains contradiction signals
      const hasContradiction = contradictionKeywords.some((keyword) =>
        contentLower.includes(keyword)
      );

      if (hasContradiction && contentLower.includes(claimLower.slice(0, 30))) {
        finding.sources.forEach((source) => {
          if (!sources.find((s) => s.url === source.url)) {
            sources.push(source);
          }
        });
      }
    }

    return sources;
  }

  /**
   * Calculate confidence score based on sources
   */
  private calculateConfidence(
    supportingSources: ResearchSource[],
    contradictingSources: ResearchSource[],
    findings: ResearchFinding[]
  ): number {
    let score = 0;

    // Base score from number of sources
    score += Math.min(supportingSources.length * 2, 6); // Max 6 points

    // Tier quality bonus
    const hasTier1 = supportingSources.some((s) => s.tier === 'tier1');
    const hasTier2 = supportingSources.some((s) => s.tier === 'tier2');
    if (hasTier1) score += 2;
    else if (hasTier2) score += 1;

    // Penalty for contradictions
    score -= contradictingSources.length * 1.5;

    // Bonus for high-confidence findings
    const avgFindingConfidence =
      findings.reduce((sum, f) => sum + (f.confidence || 5), 0) / findings.length;
    score += (avgFindingConfidence - 5) * 0.2;

    // Clamp to 0-10
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Check if claim is verified
   */
  private isClaimVerified(
    supportingSources: ResearchSource[],
    contradictingSources: ResearchSource[],
    confidenceScore: number
  ): boolean {
    // Must meet minimum sources
    if (supportingSources.length < this.config.minSourcesRequired) {
      return false;
    }

    // Must meet confidence threshold
    if (confidenceScore < this.config.minConfidenceThreshold) {
      return false;
    }

    // Must have tier1 source if required
    if (this.config.requireTier1Sources) {
      const hasTier1 = supportingSources.some((s) => s.tier === 'tier1');
      if (!hasTier1) return false;
    }

    // No major contradictions
    if (contradictingSources.length > supportingSources.length) {
      return false;
    }

    return true;
  }

  /**
   * Get recommended action
   */
  private getRecommendedAction(
    isVerified: boolean,
    confidenceScore: number,
    supportingSources: ResearchSource[],
    contradictingSources: ResearchSource[]
  ): 'accept' | 'verify' | 'reject' | 'needs_review' {
    if (contradictingSources.length > 0 && supportingSources.length > 0) {
      return 'needs_review'; // Conflicting evidence
    }

    if (isVerified && confidenceScore >= 8) {
      return 'accept';
    }

    if (!isVerified && confidenceScore < 5) {
      return 'reject';
    }

    return 'verify'; // Needs more evidence
  }

  /**
   * Generate explanatory notes
   */
  private generateNotes(
    supportingSources: ResearchSource[],
    contradictingSources: ResearchSource[],
    confidenceScore: number
  ): string[] {
    const notes: string[] = [];

    if (supportingSources.length === 0) {
      notes.push('No supporting sources found');
    } else {
      notes.push(`Found ${supportingSources.length} supporting source(s)`);
    }

    if (contradictingSources.length > 0) {
      notes.push(`Warning: ${contradictingSources.length} contradicting source(s) found`);
    }

    if (confidenceScore < this.config.minConfidenceThreshold) {
      notes.push(`Confidence below threshold (${confidenceScore} < ${this.config.minConfidenceThreshold})`);
    }

    const tier1Count = supportingSources.filter((s) => s.tier === 'tier1').length;
    if (tier1Count > 0) {
      notes.push(`${tier1Count} tier1 (high-quality) source(s)`);
    }

    return notes;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Remove stop words (simplified)
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'they', 'will', 'would']);
    return words.filter((word) => !stopWords.has(word));
  }

  /**
   * Calculate match score between keywords and text
   */
  private calculateMatchScore(keywords: string[], text: string): number {
    if (keywords.length === 0) return 0;

    const matches = keywords.filter((keyword) => text.includes(keyword));
    return matches.length / keywords.length;
  }

  /**
   * Convert confidence score to level
   */
  private scoreToLevel(score: number): ConfidenceLevel {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    if (score >= 3) return 'low';
    return 'unverified';
  }

  /**
   * Infer tier from confidence level
   */
  private inferTier(confidence: ConfidenceLevel): 'tier1' | 'tier2' | 'tier3' | 'tier4' {
    switch (confidence) {
      case 'high':
        return 'tier1';
      case 'medium':
        return 'tier2';
      case 'low':
        return 'tier3';
      default:
        return 'tier4';
    }
  }
}
