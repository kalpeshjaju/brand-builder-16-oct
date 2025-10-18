/**
 * Research Database - Main Export
 * Unified interface for research database operations
 *
 * FROM: Horizon Brand Builder
 * ADAPTED FOR: brand-builder-16-oct structure
 */

import { DatabaseCore } from './database-core.js';
import { DatabaseSearch, type SearchOptions } from './database-search.js';
import { DatabaseIndexer, type IndexStats } from './database-indexer.js';
import type { ResearchFinding } from '../../types/research-types.js';
import type { BrandConfiguration } from '../../types/brand-types.js';
import { FileSystemUtils } from '../../utils/file-system.js';

export class ResearchDatabase {
  private core: DatabaseCore;
  private search: DatabaseSearch;
  private indexer: DatabaseIndexer;

  constructor(brandConfig: BrandConfiguration) {
    this.core = new DatabaseCore(brandConfig);
    this.search = new DatabaseSearch();
    this.indexer = new DatabaseIndexer();
  }

  async initialize(): Promise<void> {
    await this.core.initialize();
  }

  async addFinding(finding: ResearchFinding): Promise<void> {
    await this.core.addFinding(finding);
  }

  async addFindings(findings: ResearchFinding[]): Promise<void> {
    await this.core.addFindings(findings);
  }

  async getAllFindings(): Promise<ResearchFinding[]> {
    return await this.core.getAllFindings();
  }

  async searchFindings(options: SearchOptions): Promise<ResearchFinding[]> {
    const findings = await this.core.getAllFindings();
    return this.search.search(findings, options);
  }

  async searchByKeyword(keyword: string): Promise<ResearchFinding[]> {
    const findings = await this.core.getAllFindings();
    return this.search.searchByKeyword(findings, keyword);
  }

  async searchByTopic(topic: string): Promise<ResearchFinding[]> {
    return await this.core.getFindingsByTopic(topic);
  }

  async getHighConfidenceFindings(): Promise<ResearchFinding[]> {
    const findings = await this.core.getAllFindings();
    return this.search.getHighConfidenceFindings(findings);
  }

  async getLowConfidenceFindings(): Promise<ResearchFinding[]> {
    const findings = await this.core.getAllFindings();
    return this.search.getLowConfidenceFindings(findings);
  }

  async getStats(): Promise<{
    metadata: {
      totalFindings: number;
      lastUpdated: string;
      sources: number;
      topics: string[];
      brandName: string;
    };
    indexStats: IndexStats;
  }> {
    const metadata = await this.core.getMetadata();
    const findings = await this.core.getAllFindings();
    const index = this.indexer.createIndex(findings);
    const indexStats = this.indexer.getIndexStats(index);

    return {
      metadata,
      indexStats,
    };
  }

  async clear(): Promise<void> {
    await this.core.clear();
  }

  getDataFile(): string {
    return this.core.getDataFile();
  }

  /**
   * Export all findings to JSON file
   */
  async exportToFile(): Promise<string> {
    const findings = await this.getAllFindings();
    const exportFile = this.getDataFile().replace('.json', '-export.json');
    await FileSystemUtils.writeJSON(exportFile, { findings });
    return exportFile;
  }

  /**
   * Get database statistics summary
   */
  async getSummary(): Promise<{
    totalFindings: number;
    topics: number;
    sources: number;
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
    topKeywords: Array<{ keyword: string; count: number }>;
  }> {
    const stats = await this.getStats();
    return {
      totalFindings: stats.metadata.totalFindings,
      topics: stats.metadata.topics.length,
      sources: stats.metadata.sources,
      confidence: stats.indexStats.confidenceLevels,
      topKeywords: stats.indexStats.topKeywords.slice(0, 10),
    };
  }
}

export default ResearchDatabase;
export { DatabaseCore, DatabaseSearch, DatabaseIndexer };
export type { SearchOptions, IndexStats };
