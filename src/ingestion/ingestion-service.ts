// Ingestion Service - Combines parsers + ORACLE for document processing

import { getParser } from './parsers/index.js';
import { createOracleClient, type OracleClient } from '../oracle/index.js';
import type { ProcessedContent, IngestionResult } from '../types/ingestion-types.js';
import type { FileFormat } from '../types/context-types.js';
import { logger, FileSystemUtils } from '../utils/index.js';

export interface IngestionOptions {
  brand: string;
  fileFormat?: FileFormat;
  indexInOracle?: boolean;
  extractTables?: boolean;
  preserveFormatting?: boolean;
}

export interface IngestionServiceConfig {
  oracleClient?: OracleClient;
}

/**
 * Ingestion Service
 * Orchestrates document parsing and indexing in ORACLE
 */
export class IngestionService {
  private oracle: OracleClient;

  constructor(config: IngestionServiceConfig = {}) {
    this.oracle = config.oracleClient || createOracleClient();
  }

  /**
   * Ingest a document file
   * Parses the file and optionally indexes in ORACLE
   */
  async ingestFile(
    filePath: string,
    options: IngestionOptions
  ): Promise<IngestionResult> {
    const startTime = Date.now();

    try {
      logger.info('Ingesting file', { filePath, brand: options.brand });

      // Detect format or use provided
      const format = options.fileFormat || this.detectFormat(filePath);

      // Get appropriate parser
      const parser = getParser(format);
      if (!parser) {
        throw new Error(
          `No parser available for format: ${format}\n` +
          `Supported formats: pdf, docx`
        );
      }

      // Parse document
      logger.info('Parsing document', { format, parser: parser.name });
      const processed = await parser.parse(filePath, {
        extractTables: options.extractTables,
        preserveFormatting: options.preserveFormatting,
      });

      // Calculate fingerprint
      const sha256 = await FileSystemUtils.calculateFileHash(filePath);
      const stats = await FileSystemUtils.getFileStats(filePath);

      // Build result
      const result: IngestionResult = {
        fileId: this.generateFileId(filePath),
        filePath,
        format,
        category: 'document',
        content: processed,
        metadata: {
          title: this.extractTitle(filePath, processed),
          wordCount: this.countWords(processed.raw),
          pageCount: processed.structured.sections?.length,
        },
        fingerprint: {
          sha256,
          size: stats.size,
        },
        timestamps: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        processingTime: Date.now() - startTime,
        success: true,
      };

      // Index in ORACLE if requested
      if (options.indexInOracle) {
        await this.indexInOracle(result, options.brand);
      }

      logger.info('Ingestion complete', {
        fileId: result.fileId,
        format: result.format,
        wordCount: result.metadata.wordCount,
        processingTime: result.processingTime,
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Ingestion failed', {
        filePath,
        error: (error as Error).message,
      });

      return {
        fileId: this.generateFileId(filePath),
        filePath,
        format: (options.fileFormat || 'unknown') as FileFormat,
        category: 'document',
        content: {
          raw: '',
          structured: {},
          cleaned: '',
        },
        metadata: {},
        fingerprint: {
          sha256: '',
          size: 0,
        },
        timestamps: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        processingTime,
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Index processed document in ORACLE
   */
  private async indexInOracle(result: IngestionResult, brand: string): Promise<void> {
    try {
      logger.info('Indexing in ORACLE', {
        fileId: result.fileId,
        brand,
      });

      // Check if ORACLE is available
      const isRunning = await this.oracle.isRunning();
      if (!isRunning) {
        logger.warn('ORACLE service not running, skipping indexing');
        return;
      }

      // Index the cleaned content
      const response = await this.oracle.index({
        brand,
        docId: result.fileId,
        text: result.content.cleaned,
        metadata: {
          filePath: result.filePath,
          format: result.format,
          title: result.metadata.title,
          wordCount: result.metadata.wordCount,
          sha256: result.fingerprint.sha256,
        },
      });

      logger.info('Indexed in ORACLE', {
        fileId: result.fileId,
        indexed: response.indexed,
        chunks: response.chunkStats.totalChunks,
      });
    } catch (error) {
      logger.error('ORACLE indexing failed', {
        fileId: result.fileId,
        error: (error as Error).message,
      });
      // Don't throw - indexing failure shouldn't fail the ingestion
    }
  }

  /**
   * Detect file format from extension
   */
  private detectFormat(filePath: string): FileFormat {
    const ext = filePath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'doc':
        return 'docx';
      case 'txt':
        return 'txt';
      case 'md':
      case 'markdown':
        return 'md';
      default:
        throw new Error(
          `Unknown file format: ${ext}\n` +
          `Supported formats: pdf, docx, txt, md`
        );
    }
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(filePath: string): string {
    const fileName = filePath.split('/').pop() || 'unknown';
    const timestamp = Date.now();
    return `${fileName.replace(/\.[^.]+$/, '')}-${timestamp}`;
  }

  /**
   * Extract title from filename or content
   */
  private extractTitle(filePath: string, content: ProcessedContent): string | undefined {
    // Try to get first heading from structured content
    if (content.structured.headings && content.structured.headings.length > 0) {
      return content.structured.headings[0];
    }

    // Fall back to filename
    const fileName = filePath.split('/').pop();
    if (!fileName) return undefined;

    return fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Search for relevant context using ORACLE
   */
  async searchContext(brand: string, query: string, maxTokens = 2000): Promise<string> {
    try {
      const isRunning = await this.oracle.isRunning();
      if (!isRunning) {
        logger.warn('ORACLE service not running, returning empty context');
        return '';
      }

      const response = await this.oracle.getContext({
        brand,
        query,
        maxTokens,
      });

      logger.info('Retrieved context from ORACLE', {
        brand,
        query: query.substring(0, 50),
        tokenCount: response.tokenCount,
        sources: response.sources.length,
      });

      return response.context;
    } catch (error) {
      logger.error('Context retrieval failed', {
        brand,
        error: (error as Error).message,
      });
      return '';
    }
  }
}

/**
 * Create ingestion service
 */
export function createIngestionService(config?: IngestionServiceConfig): IngestionService {
  return new IngestionService(config);
}
