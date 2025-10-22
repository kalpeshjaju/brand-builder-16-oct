// Context Manager types - Track what the system "knows"

import type { Timestamp } from './common-types.js';

export type InputType = 'ask' | 'objective' | 'constraint';
export type ResourceType = 'industry' | 'competitor' | 'research' | 'framework';
export type DocumentType = 'strategy' | 'guideline' | 'asset' | 'report';

export type FileCategory = 'input' | 'resource' | 'document' | 'output';
export type FileFormat = 'pdf' | 'docx' | 'md' | 'html' | 'xlsx' | 'json' | 'txt' | 'csv' | 'unknown';

export interface FileFingerprint {
  sha256: string;
  size: number;
  mtime: string; // modification time
}

export interface TrackedFile {
  id: string;
  path: string;
  category: FileCategory;
  subtype: InputType | ResourceType | DocumentType | 'unknown';
  format: FileFormat;
  fingerprint: FileFingerprint;
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    author?: string;
    created?: string;
  };
  timestamps: Timestamp;
  processedAt?: string;
  indexed: boolean;
  embedding?: {
    version: string;
    model: string;
    createdAt: string;
  };
}

export interface KnowledgeEntry {
  id: string;
  sourceFileId: string;
  content: string;
  extractedFacts?: string[];
  relationships?: string[];
  confidence: number;
  timestamps: Timestamp;
}

export interface ContextState {
  brandName: string;
  workspace: string;
  files: TrackedFile[];
  knowledge: KnowledgeEntry[];
  version: number;
  lastSync: string;
  stats: {
    totalFiles: number;
    processedFiles: number;
    pendingFiles: number;
    totalKnowledge: number;
  };
}

export interface FileWatchEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  category: FileCategory;
  timestamp: string;
}

export interface ContextQuery {
  query: string;
  filters?: {
    category?: FileCategory;
    subtype?: string;
    format?: FileFormat;
    minConfidence?: number;
  };
  limit?: number;
}

export interface ContextQueryResult {
  entries: KnowledgeEntry[];
  sources: TrackedFile[];
  relevanceScores: number[];
  totalFound: number;
}
