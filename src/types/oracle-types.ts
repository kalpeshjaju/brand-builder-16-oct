// ORACLE module types - Semantic search and intelligence

import type { ConfidenceLevel, SourcedClaim } from './common-types.js';

export interface SemanticSearchOptions {
  query: string;
  topK?: number;
  minRelevance?: number;
  strategy?: 'fast' | 'balanced' | 'precision' | 'recall';
  rerank?: boolean;
}

export interface SearchResult {
  content: string;
  source: {
    documentId: string;
    chunkId: string;
    documentTitle: string;
    documentPath: string;
  };
  relevanceScore: number;
  metadata: {
    chunkIndex: number;
    startOffset: number;
    endOffset: number;
    md5Hash: string;
    ingestTime: string;
  };
}

export interface QAResult {
  answer: string;
  confidence: ConfidenceLevel;
  sources: SearchResult[];
  reasoning?: string;
  metadata: {
    promptVersion: string;
    model: string;
    temperature: number;
    tokensUsed: number;
    responseTime: number;
  };
}

export interface DeterministicQAConfig {
  promptVersion: string;
  temperature: number;
  maxTokens: number;
  seed?: number;
  model?: string;
}

export interface ChromaConfig {
  dbPath: string;
  collectionName: string;
  embeddingModel: string;
  embeddingVersion: string;
}

export interface IntelligenceQuery {
  type: 'question' | 'search' | 'analysis' | 'comparison';
  query: string;
  context?: {
    brandName?: string;
    topic?: string;
    timeRange?: {
      start: string;
      end: string;
    };
  };
  options?: SemanticSearchOptions;
}

export interface IntelligenceReport {
  query: IntelligenceQuery;
  result: QAResult;
  insights: SourcedClaim[];
  relatedTopics: string[];
  recommendations: string[];
  timestamp: string;
}

// Python service IPC types

export interface PythonServiceRequest {
  action: 'query' | 'ingest' | 'rerank' | 'metadata';
  payload: unknown;
}

export interface PythonServiceResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    processingTime: number;
    version: string;
  };
}
