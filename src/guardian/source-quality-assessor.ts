// Source Quality Assessor - 4-tier credibility system

import type { SourceTier, VerifiedSource } from '../types/index.js';

export class SourceQualityAssessor {
  /**
   * Assess source quality and assign tier
   */
  assessSource(url: string, title?: string): VerifiedSource {
    const tier = this.determineTier(url);
    const score = this.calculateScore(tier);

    return {
      url,
      title: title || url,
      tier,
      score,
      isRecent: true, // Would check date if available
      reasoning: this.getTierReasoning(tier),
    };
  }

  /**
   * Determine tier based on URL patterns
   */
  private determineTier(url: string): SourceTier {
    const urlLower = url.toLowerCase();

    // Tier 1: Official, governmental, educational, peer-reviewed
    if (
      urlLower.includes('.gov') ||
      urlLower.includes('.edu') ||
      urlLower.includes('doi.org') ||
      urlLower.includes('scholar.google') ||
      urlLower.includes('pubmed')
    ) {
      return 'tier1';
    }

    // Tier 2: Reputable news, industry publications
    if (
      urlLower.includes('wsj.com') ||
      urlLower.includes('ft.com') ||
      urlLower.includes('bloomberg.com') ||
      urlLower.includes('reuters.com') ||
      urlLower.includes('forbes.com') ||
      urlLower.includes('harvard') ||
      urlLower.includes('mckinsey')
    ) {
      return 'tier2';
    }

    // Tier 3: Blogs, industry sites, whitepapers
    if (
      urlLower.includes('medium.com') ||
      urlLower.includes('blog') ||
      urlLower.includes('techcrunch') ||
      urlLower.includes('venturebeat')
    ) {
      return 'tier3';
    }

    // Tier 4: Social media, forums, unknown
    return 'tier4';
  }

  /**
   * Calculate numerical score based on tier
   */
  private calculateScore(tier: SourceTier): number {
    switch (tier) {
      case 'tier1':
        return 0.95;
      case 'tier2':
        return 0.75;
      case 'tier3':
        return 0.50;
      case 'tier4':
        return 0.25;
      default:
        return 0.10;
    }
  }

  /**
   * Get tier reasoning
   */
  private getTierReasoning(tier: SourceTier): string {
    switch (tier) {
      case 'tier1':
        return 'Official/governmental/peer-reviewed source - highest credibility';
      case 'tier2':
        return 'Reputable publication - high credibility';
      case 'tier3':
        return 'Industry source/blog - moderate credibility';
      case 'tier4':
        return 'Social/forum/unknown - lower credibility, verify claims';
      default:
        return 'Unknown source - requires verification';
    }
  }

  /**
   * Batch assess multiple sources
   */
  assessMultipleSources(sources: Array<{ url: string; title?: string }>): VerifiedSource[] {
    return sources.map((source) => this.assessSource(source.url, source.title));
  }

  /**
   * Get average tier from multiple sources
   */
  getAverageTier(sources: VerifiedSource[]): number {
    if (sources.length === 0) return 4;

    const tierValues = sources.map((s) => {
      switch (s.tier) {
        case 'tier1':
          return 1;
        case 'tier2':
          return 2;
        case 'tier3':
          return 3;
        case 'tier4':
          return 4;
        default:
          return 4;
      }
    });

    return tierValues.reduce((sum, val) => sum + val, 0) / tierValues.length;
  }
}
