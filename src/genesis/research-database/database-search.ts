/**
 * Research Database Search - Search and filter functionality
 *
 * FROM: Horizon Brand Builder (unchanged)
 */

import type { ResearchFinding } from '../../types/research-types.js';

export interface SearchOptions {
  query?: string;
  topic?: string;
  minConfidence?: number;
  maxResults?: number;
}

export class DatabaseSearch {
  search(findings: ResearchFinding[], options: SearchOptions): ResearchFinding[] {
    let results = [...findings];

    // Filter by query (searches in topic and content)
    if (options.query) {
      const lowerQuery = options.query.toLowerCase();
      results = results.filter(
        (finding) =>
          finding.topic.toLowerCase().includes(lowerQuery) ||
          finding.content.toLowerCase().includes(lowerQuery) ||
          finding.sources.some((source) => source.title?.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by topic
    if (options.topic) {
      results = results.filter(
        (f) => f.topic.toLowerCase() === options.topic!.toLowerCase()
      );
    }

    // Filter by minimum confidence
    if (options.minConfidence !== undefined) {
      results = results.filter((f) => (f.confidence || 0) >= options.minConfidence!);
    }

    // Limit results
    if (options.maxResults) {
      results = results.slice(0, options.maxResults);
    }

    return results;
  }

  searchByTopic(findings: ResearchFinding[], topic: string): ResearchFinding[] {
    return this.search(findings, { topic });
  }

  searchByConfidence(
    findings: ResearchFinding[],
    minConfidence: number
  ): ResearchFinding[] {
    return this.search(findings, { minConfidence });
  }

  searchByKeyword(findings: ResearchFinding[], keyword: string): ResearchFinding[] {
    return this.search(findings, { query: keyword });
  }

  // Get high-confidence findings
  getHighConfidenceFindings(findings: ResearchFinding[]): ResearchFinding[] {
    return this.search(findings, { minConfidence: 8 });
  }

  // Get findings that need verification
  getLowConfidenceFindings(findings: ResearchFinding[]): ResearchFinding[] {
    return findings.filter((f) => (f.confidence || 10) < 6);
  }
}
