/**
 * Research Database Indexer - Creates indexes for fast lookups
 *
 * FROM: Horizon Brand Builder (unchanged)
 */

import type { ResearchFinding } from '../../types/research-types.js';

export interface DatabaseIndex {
  topics: Map<string, ResearchFinding[]>;
  sources: Map<string, ResearchFinding[]>;
  confidence: Map<string, ResearchFinding[]>;
  keywords: Map<string, ResearchFinding[]>;
}

export interface IndexStats {
  totalTopics: number;
  totalSources: number;
  confidenceLevels: {
    high: number; // >= 8
    medium: number; // 5-7
    low: number; // < 5
  };
  topKeywords: Array<{ keyword: string; count: number }>;
}

export class DatabaseIndexer {
  createIndex(findings: ResearchFinding[]): DatabaseIndex {
    const index: DatabaseIndex = {
      topics: new Map(),
      sources: new Map(),
      confidence: new Map(),
      keywords: new Map(),
    };

    findings.forEach((finding) => {
      // Index by topic
      if (!index.topics.has(finding.topic)) {
        index.topics.set(finding.topic, []);
      }
      index.topics.get(finding.topic)!.push(finding);

      // Index by source
      finding.sources.forEach((source) => {
        const sourceKey = source.url || source.title;
        if (sourceKey && !index.sources.has(sourceKey)) {
          index.sources.set(sourceKey, []);
        }
        if (sourceKey) {
          index.sources.get(sourceKey)!.push(finding);
        }
      });

      // Index by confidence level
      const confidenceLevel = this.getConfidenceLevel(finding.confidence || 0);
      if (!index.confidence.has(confidenceLevel)) {
        index.confidence.set(confidenceLevel, []);
      }
      index.confidence.get(confidenceLevel)!.push(finding);

      // Index by keywords (extract from content)
      const keywords = this.extractKeywords(finding.content);
      keywords.forEach((keyword) => {
        if (!index.keywords.has(keyword)) {
          index.keywords.set(keyword, []);
        }
        index.keywords.get(keyword)!.push(finding);
      });
    });

    return index;
  }

  getIndexStats(index: DatabaseIndex): IndexStats {
    return {
      totalTopics: index.topics.size,
      totalSources: index.sources.size,
      confidenceLevels: {
        high: index.confidence.get('high')?.length || 0,
        medium: index.confidence.get('medium')?.length || 0,
        low: index.confidence.get('low')?.length || 0,
      },
      topKeywords: Array.from(index.keywords.entries())
        .map(([keyword, findings]) => ({ keyword, count: findings.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    };
  }

  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 8) return 'high';
    if (confidence >= 5) return 'medium';
    return 'low';
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (in production, use NLP library)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4); // Only words > 4 chars

    // Remove common stop words
    const stopWords = new Set([
      'about', 'above', 'after', 'again', 'against', 'all', 'also', 'among',
      'another', 'any', 'are', 'because', 'been', 'before', 'being', 'below',
      'between', 'both', 'but', 'can', 'could', 'did', 'does', 'doing', 'down',
      'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
      'having', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
      'into', 'more', 'most', 'other', 'our', 'ours', 'ourselves', 'out', 'over',
      'own', 'should', 'some', 'such', 'than', 'that', 'their', 'theirs', 'them',
      'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
      'under', 'until', 'very', 'was', 'were', 'what', 'when', 'where', 'which',
      'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'your', 'yours',
      'yourself', 'yourselves',
    ]);

    const keywords = words.filter((word) => !stopWords.has(word));

    // Return unique keywords
    return Array.from(new Set(keywords));
  }
}
