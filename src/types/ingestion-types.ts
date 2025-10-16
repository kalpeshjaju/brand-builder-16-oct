// Smart Ingestion Engine types

import type { FileFormat, FileCategory } from './context-types.js';
import type { FactTriple } from './audit-types.js';
import type { Timestamp } from './common-types.js';

export interface IngestionOptions {
  extractFacts?: boolean;
  createEmbeddings?: boolean;
  performOCR?: boolean; // For images
  extractMetadata?: boolean;
  categorize?: boolean;
}

export interface ExtractedMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  created?: string;
  modified?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  [key: string]: unknown;
}

export interface ProcessedContent {
  raw: string; // Full raw text
  structured: {
    sections?: string[];
    headings?: string[];
    tables?: unknown[];
    lists?: string[][];
  };
  cleaned: string; // Cleaned and normalized
}

export interface IngestionResult {
  fileId: string;
  filePath: string;
  format: FileFormat;
  category: FileCategory;
  content: ProcessedContent;
  metadata: ExtractedMetadata;
  extractedFacts?: FactTriple[];
  embedding?: {
    chunks: string[];
    vectors?: number[][];
    model: string;
    version: string;
  };
  fingerprint: {
    sha256: string;
    size: number;
  };
  timestamps: Timestamp;
  processingTime: number; // milliseconds
  success: boolean;
  errors?: string[];
}

export interface ParserConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  preserveFormatting?: boolean;
  extractImages?: boolean;
  extractTables?: boolean;
}

export interface Parser {
  name: string;
  supportedFormats: FileFormat[];
  parse(filePath: string, config?: ParserConfig): Promise<ProcessedContent>;
}

export interface IngestionPipeline {
  stages: Array<{
    name: string;
    execute(data: unknown): Promise<unknown>;
  }>;
  onProgress?(stage: string, progress: number): void;
  onComplete?(result: IngestionResult): void;
  onError?(error: Error): void;
}
