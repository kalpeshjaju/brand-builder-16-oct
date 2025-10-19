// Context Manager - Track system knowledge and state

import type { ContextState, TrackedFile, KnowledgeEntry } from '../types/index.js';
import type { BrandConfiguration } from '../types/brand-types.js';
import { FileSystemUtils, Logger } from '../utils/index.js';
import { ResearchDatabase } from '../genesis/research-database/index.js';

const logger = new Logger('ContextManager');

export class ContextManager {
  private brandName: string;
  private workspacePath: string;
  private contextPath: string;
  private researchDB: ResearchDatabase | null;

  constructor(brandName: string, brandConfig?: BrandConfiguration) {
    this.brandName = brandName;
    this.workspacePath = FileSystemUtils.getBrandWorkspacePath(brandName);
    this.contextPath = `${this.workspacePath}/data/context-state.json`;
    this.researchDB = brandConfig ? new ResearchDatabase(brandConfig) : null;
  }

  /**
   * Initialize context for a brand
   */
  async initialize(): Promise<void> {
    logger.info('Initializing context manager', { brand: this.brandName });

    const initialState: ContextState = {
      brandName: this.brandName,
      workspace: this.workspacePath,
      files: [],
      knowledge: [],
      version: 1,
      lastSync: new Date().toISOString(),
      stats: {
        totalFiles: 0,
        processedFiles: 0,
        pendingFiles: 0,
        totalKnowledge: 0,
      },
    };

    await FileSystemUtils.ensureDir(`${this.workspacePath}/data`);
    await FileSystemUtils.writeJSON(this.contextPath, initialState);
  }

  /**
   * Get current context state
   */
  async getState(): Promise<ContextState> {
    if (!(await FileSystemUtils.fileExists(this.contextPath))) {
      await this.initialize();
    }

    return await FileSystemUtils.readJSON<ContextState>(this.contextPath);
  }

  /**
   * Add tracked file
   */
  async addFile(file: Omit<TrackedFile, 'id' | 'timestamps'>): Promise<void> {
    const state = await this.getState();

    const trackedFile: TrackedFile = {
      ...file,
      id: FileSystemUtils.calculateHash(file.path + Date.now()),
      timestamps: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    state.files.push(trackedFile);
    state.stats.totalFiles += 1;

    if (trackedFile.indexed) {
      state.stats.processedFiles += 1;
    } else {
      state.stats.pendingFiles += 1;
    }

    state.lastSync = new Date().toISOString();

    await FileSystemUtils.writeJSON(this.contextPath, state);
    logger.info('File added to context', { path: file.path });
  }

  /**
   * Add knowledge entry
   */
  async addKnowledge(knowledge: Omit<KnowledgeEntry, 'id' | 'timestamps'>): Promise<void> {
    const state = await this.getState();

    const entry: KnowledgeEntry = {
      ...knowledge,
      id: FileSystemUtils.calculateHash(knowledge.content + Date.now()),
      timestamps: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    state.knowledge.push(entry);
    state.stats.totalKnowledge += 1;
    state.lastSync = new Date().toISOString();

    await FileSystemUtils.writeJSON(this.contextPath, state);
    logger.info('Knowledge added to context', { sourceFile: knowledge.sourceFileId });
  }

  /**
   * Get stats
   */
  async getStats() {
    const state = await this.getState();
    return state.stats;
  }

  /**
   * Search knowledge
   */
  async searchKnowledge(query: string, limit: number = 10): Promise<KnowledgeEntry[]> {
    const state = await this.getState();
    const queryLower = query.toLowerCase();

    return state.knowledge
      .filter((entry) => entry.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Get research findings for context building
   */
  async getResearchFindings(options?: {
    query?: string;
    minConfidence?: number;
    maxResults?: number;
  }): Promise<string> {
    if (!this.researchDB) {
      return '';
    }

    try {
      await this.researchDB.initialize();

      let findings;
      if (options?.query) {
        findings = await this.researchDB.searchFindings({
          query: options.query,
          minConfidence: options.minConfidence,
          maxResults: options.maxResults,
        });
      } else {
        findings = await this.researchDB.getHighConfidenceFindings();
        if (options?.maxResults) {
          findings = findings.slice(0, options.maxResults);
        }
      }

      // Format findings as context string
      if (findings.length === 0) {
        return '';
      }

      let context = '## Research Findings\n\n';
      findings.forEach((finding, index) => {
        context += `### ${index + 1}. ${finding.topic}\n\n`;
        context += `${finding.content}\n\n`;
        context += `**Sources**: ${finding.sources.map(s => s.title).join(', ')}\n`;
        context += `**Confidence**: ${finding.confidence}/10\n\n`;
      });

      return context;
    } catch (error) {
      logger.error('Failed to get research findings', {
        error: (error as Error).message,
      });
      return '';
    }
  }

  /**
   * Clear context
   */
  async clear(): Promise<void> {
    await this.initialize();
    logger.info('Context cleared', { brand: this.brandName });
  }
}
