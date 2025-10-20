// ORACLE Client - TypeScript bridge to Python semantic search service

import axios, { AxiosInstance, AxiosError } from 'axios';
import pRetry from 'p-retry';
import { Logger } from '../utils/index.js';

const logger = new Logger('OracleClient');

export interface OracleChunkMetadata {
  source?: string;
  source_type?: string;
  url?: string;
  brand?: string;
  [key: string]: unknown;
}

export interface OracleSearchResult {
  text: string;
  score: number;
  metadata: OracleChunkMetadata;
  chunk_id: string;
  rank: number;
  rerank_score?: number;
}

export interface OracleContextSource {
  chunk_id: string;
  score: number;
  rank: number;
  metadata: OracleChunkMetadata;
}

export interface OracleContextResult {
  context: string;
  sources: OracleContextSource[];
  total_chars: number;
  num_sources: number;
}

export interface OracleStats {
  collection_name: string;
  brand: string;
  total_chunks: number;
  sample_doc_count: number;
  embedding_dimension: number;
}

export interface OracleServiceInfo {
  service: string;
  version: string;
  embedding_model: {
    name: string;
    dimension: number;
    max_seq_length: number;
  };
  reranker_model: {
    name: string;
    type: string;
  } | null;
  config: {
    chunk_size: number;
    chunk_overlap: number;
    default_top_k: number;
    use_reranker: boolean;
  };
}

export class OracleClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private retryAttempts: number = 3;

  constructor(baseUrl: string = 'http://127.0.0.1:8765') {
    this.baseUrl = baseUrl;

    this.client = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    logger.info('Oracle client initialized', { baseUrl });
  }

  /**
   * Check if ORACLE service is running
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service information
   */
  async getServiceInfo(): Promise<OracleServiceInfo> {
    try {
      const response = await this.client.get('/info');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get service info');
    }
  }

  /**
   * Index a document for semantic search
   */
  async indexDocument(
    brand: string,
    docId: string,
    text: string,
    metadata?: OracleChunkMetadata
  ): Promise<{
    success: boolean;
    indexed: number;
    failed: number;
    doc_id: string;
    chunk_stats: {
      count: number;
      avg_length: number;
      min_length: number;
      max_length: number;
      total_chars: number;
    };
  }> {
    const payloadMetadata: OracleChunkMetadata = metadata ?? {};

    const operation = () =>
      this.client.post('/index', {
        brand,
        doc_id: docId,
        text,
        metadata: payloadMetadata
      });

    try {
      const response = await pRetry(operation, {
        retries: this.retryAttempts,
        onFailedAttempt: error => {
          logger.warn('Index attempt failed, retrying...', {
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft
          });
        }
      });

      logger.info('Document indexed', { docId, chunks: response.data.indexed });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to index document: ${docId}`);
    }
  }

  /**
   * Semantic search in indexed documents
   */
  async search(
    brand: string,
    query: string,
    options?: {
      topK?: number;
      useReranking?: boolean;
    }
  ): Promise<OracleSearchResult[]> {
    const operation = () =>
      this.client.post('/search', {
        brand,
        query,
        top_k: options?.topK,
        use_reranking: options?.useReranking ?? true
      });

    try {
      const response = await pRetry(operation, {
        retries: this.retryAttempts,
        onFailedAttempt: error => {
          logger.warn('Search attempt failed, retrying...', {
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft
          });
        }
      });

      logger.debug('Search completed', {
        query,
        numResults: response.data.num_results
      });

      return response.data.results;
    } catch (error) {
      throw this.handleError(error, `Search failed for query: ${query}`);
    }
  }

  /**
   * Get relevant context for RAG (Retrieval-Augmented Generation)
   */
  async getContext(
    brand: string,
    query: string,
    maxTokens: number = 2000
  ): Promise<OracleContextResult> {
    const operation = () =>
      this.client.post('/context', {
        brand,
        query,
        max_tokens: maxTokens
      });

    try {
      const response = await pRetry(operation, {
        retries: this.retryAttempts,
        onFailedAttempt: error => {
          logger.warn('Context retrieval attempt failed, retrying...', {
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft
          });
        }
      });

      logger.debug('Context retrieved', {
        query,
        numSources: response.data.num_sources,
        totalChars: response.data.total_chars
      });

      return {
        context: response.data.context,
        sources: response.data.sources,
        total_chars: response.data.total_chars,
        num_sources: response.data.num_sources
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get context for query: ${query}`);
    }
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(brand: string, docId: string): Promise<{
    success: boolean;
    deleted: number;
    doc_id: string;
  }> {
    try {
      const response = await this.client.post('/delete', {
        brand,
        doc_id: docId
      });

      logger.info('Document deleted', { docId, chunks: response.data.deleted });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete document: ${docId}`);
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(brand: string): Promise<OracleStats> {
    try {
      const response = await this.client.post('/stats', { brand });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get stats');
    }
  }

  /**
   * Clear all documents for a brand
   */
  async clearAll(brand: string): Promise<{
    success: boolean;
    deleted: number;
    collection: string;
  }> {
    try {
      const response = await this.client.post('/clear', { brand });

      logger.info('Collection cleared', {
        brand,
        deleted: response.data.deleted
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to clear collection');
    }
  }

  /**
   * Handle axios errors
   */
  private handleError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        logger.error('ORACLE service not reachable', { baseUrl: this.baseUrl });
        return new Error(
          `${context}\n` +
          `Reason: ORACLE service is not running\n` +
          `Fix: Start the service with: cd oracle-service && python main.py`
        );
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const detail = this.extractErrorDetail(axiosError.response.data) || 'Unknown error';

        logger.error('ORACLE service error', { status, detail });

        return new Error(
          `${context}\n` +
          `HTTP ${status}: ${detail}\n` +
          `Fix: Check ORACLE service logs for details`
        );
      }

      if (axiosError.request) {
        logger.error('No response from ORACLE service', { error: axiosError.message });
        return new Error(
          `${context}\n` +
          `Reason: No response from ORACLE service\n` +
          `Fix: Check if service is running and network is accessible`
        );
      }
    }

    logger.error('Unexpected error', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Error(`${context}: ${message}`);
  }

  private extractErrorDetail(payload: unknown): string | undefined {
    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload === 'object' && payload !== null) {
      const record = payload as Record<string, unknown>;
      const candidates = ['detail', 'message', 'error'];

      for (const field of candidates) {
        const value = record[field];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value;
        }
      }
    }

    return undefined;
  }

  /**
   * Set retry attempts for operations
   */
  setRetryAttempts(attempts: number): void {
    this.retryAttempts = attempts;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
