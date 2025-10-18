/**
 * Research Database Core - Generic storage for ANY brand
 * Handles basic CRUD operations for research findings
 *
 * FROM: Horizon Brand Builder
 * ADAPTED FOR: brand-builder-16-oct structure (FileSystemUtils, ~/.brandos/)
 */

import { FileSystemUtils } from '../../utils/file-system.js';
import type { ResearchFinding } from '../../types/research-types.js';
import type { ResearchSource } from '../../types/common-types.js';
import type { BrandConfiguration } from '../../types/brand-types.js';

export interface ResearchDatabase {
  findings: ResearchFinding[];
  metadata: {
    totalFindings: number;
    lastUpdated: string;
    sources: number;
    topics: string[];
    brandName: string;
  };
}

export class DatabaseCore {
  private dataFile: string;
  private data: ResearchDatabase | null;
  private brandConfig: BrandConfiguration;

  constructor(brandConfig: BrandConfiguration) {
    this.brandConfig = brandConfig;
    this.data = null;

    // Store in ~/.brandos/<brand>/data/research-db.json
    this.dataFile = FileSystemUtils.getBrandDataPath(
      brandConfig.brandName,
      'research-db.json'
    );
  }

  async initialize(): Promise<void> {
    try {
      const dataDir = FileSystemUtils.getBrandDataPath(this.brandConfig.brandName);
      await FileSystemUtils.ensureDir(dataDir);

      try {
        this.data = await FileSystemUtils.readJSON<ResearchDatabase>(this.dataFile);
      } catch {
        // Initialize new database
        this.data = {
          findings: [],
          metadata: {
            totalFindings: 0,
            lastUpdated: new Date().toISOString(),
            sources: 0,
            topics: [],
            brandName: this.brandConfig.brandName,
          },
        };
        await this.save();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to initialize research database at ${this.dataFile}\n` +
          `Reason: ${errorMessage}\n` +
          `Fix: Ensure you have write permissions for the directory.`
      );
    }
  }

  async save(): Promise<void> {
    if (!this.data) {
      throw new Error('No database data to save. Call initialize() first.');
    }

    this.data.metadata.lastUpdated = new Date().toISOString();
    await FileSystemUtils.writeJSON(this.dataFile, this.data);
  }

  async addFinding(finding: ResearchFinding): Promise<void> {
    if (!this.data) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    this.data.findings.push(finding);
    this.data.metadata.totalFindings++;

    // Update topics list
    if (!this.data.metadata.topics.includes(finding.topic)) {
      this.data.metadata.topics.push(finding.topic);
    }

    // Update sources count (unique URLs)
    const uniqueUrls = new Set(
      this.data.findings.flatMap((f) => f.sources.map((s: ResearchSource) => s.url).filter(Boolean))
    );
    this.data.metadata.sources = uniqueUrls.size;

    await this.save();
  }

  async addFindings(findings: ResearchFinding[]): Promise<void> {
    for (const finding of findings) {
      await this.addFinding(finding);
    }
  }

  async getAllFindings(): Promise<ResearchFinding[]> {
    if (!this.data) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.data.findings;
  }

  async getFindingsByTopic(topic: string): Promise<ResearchFinding[]> {
    const findings = await this.getAllFindings();
    return findings.filter((f) => f.topic.toLowerCase() === topic.toLowerCase());
  }

  async getMetadata(): Promise<ResearchDatabase['metadata']> {
    if (!this.data) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.data.metadata;
  }

  async clear(): Promise<void> {
    if (!this.data) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    this.data.findings = [];
    this.data.metadata.totalFindings = 0;
    this.data.metadata.sources = 0;
    this.data.metadata.topics = [];

    await this.save();
  }

  getDataFile(): string {
    return this.dataFile;
  }

  getData(): ResearchDatabase | null {
    return this.data;
  }
}
