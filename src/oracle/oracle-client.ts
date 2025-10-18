// ORACLE Client - TypeScript client for ORACLE semantic search service

import { logger } from '../utils/index.js';

/**
 * ORACLE Service Configuration
 */
export interface OracleConfig {
  host?: string;
  port?: number;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Index request
 */
export interface IndexRequest {
  brand: string;
  docId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Search request
 */
export interface SearchRequest {
  brand: string;
  query: string;
  topK?: number;
  useReranking?: boolean;
}

/**
 * Context request (RAG)
 */
export interface ContextRequest {
  brand: string;
  query: string;
  maxTokens?: number;
}

/**
 * Delete request
 */
export interface DeleteRequest {
  brand: string;
  docId: string;
}

/**
 * Stats request
 */
export interface StatsRequest {
  brand: string;
}

/**
 * Search result
 */
export interface SearchResult {
  chunkId: string;
  docId: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Index response
 */
export interface IndexResponse {
  success: boolean;
  indexed: number;
  failed: number;
  docId: string;
  chunkStats: {
    totalChunks: number;
    avgChunkSize: number;
    maxChunkSize: number;
    minChunkSize: number;
  };
}

/**
 * Search response
 */
export interface SearchResponse {
  success: boolean;
  query: string;
  numResults: number;
  results: SearchResult[];
}

/**
 * Context response
 */
export interface ContextResponse {
  success: boolean;
  query: string;
  context: string;
  sources: Array<{
    docId: string;
    text: string;
    score: number;
  }>;
  tokenCount: number;
}

/**
 * Delete response
 */
export interface DeleteResponse {
  success: boolean;
  deleted: number;
  docId: string;
}

/**
 * Stats response
 */
export interface StatsResponse {
  success: boolean;
  totalDocuments: number;
  totalChunks: number;
  collectionName: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

/**
 * Service info response
 */
export interface ServiceInfoResponse {
  service: string;
  version: string;
  embeddingModel: {
    name: string;
    dimension: number;
  };
  rerankerModel?: {
    name: string;
  };
  config: {
    chunkSize: number;
    chunkOverlap: number;
    defaultTopK: number;
    useReranker: boolean;
  };
}

/**
 * ORACLE Client
 * TypeScript client for communicating with ORACLE Python service
 */
export class OracleClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: OracleConfig = {}) {
    const host = config.host || '127.0.0.1';
    const port = config.port || 8765;
    this.baseUrl = config.baseUrl || `http://${host}:${port}`;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Make HTTP request to ORACLE service
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText })) as { detail?: string };
        throw new Error(
          `ORACLE request failed (${response.status}): ${error.detail || response.statusText}`
        );
      }

      return await response.json() as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(
          `ORACLE request timed out after ${this.timeout}ms\n` +
          `Fix: Increase timeout or check if ORACLE service is running.`
        );
      }

      throw new Error(
        `ORACLE request failed: ${(error as Error).message}\n` +
        `Fix: Ensure ORACLE service is running at ${this.baseUrl}\n` +
        `Start service: cd oracle-service && python main.py`
      );
    }
  }

  /**
   * Health check
   */
  async health(): Promise<HealthResponse> {
    logger.debug('ORACLE health check');
    return this.request<HealthResponse>('GET', '/api/v1/health');
  }

  /**
   * Get service info
   */
  async info(): Promise<ServiceInfoResponse> {
    logger.debug('ORACLE service info');
    return this.request<ServiceInfoResponse>('GET', '/api/v1/info');
  }

  /**
   * Index a document
   */
  async index(request: IndexRequest): Promise<IndexResponse> {
    logger.info('ORACLE indexing document', {
      brand: request.brand,
      docId: request.docId,
      textLength: request.text.length,
    });

    const body = {
      brand: request.brand,
      doc_id: request.docId,
      text: request.text,
      metadata: request.metadata,
    };

    const response = await this.request<IndexResponse>('POST', '/api/v1/index', body);

    logger.info('ORACLE indexed document', {
      docId: request.docId,
      indexed: response.indexed,
      failed: response.failed,
    });

    return response;
  }

  /**
   * Search documents
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    logger.debug('ORACLE searching', {
      brand: request.brand,
      query: request.query,
      topK: request.topK,
    });

    const body = {
      brand: request.brand,
      query: request.query,
      top_k: request.topK,
      use_reranking: request.useReranking,
    };

    const response = await this.request<SearchResponse>('POST', '/api/v1/search', body);

    logger.debug('ORACLE search complete', {
      numResults: response.numResults,
    });

    return response;
  }

  /**
   * Get context for RAG (Retrieval-Augmented Generation)
   */
  async getContext(request: ContextRequest): Promise<ContextResponse> {
    logger.debug('ORACLE getting context', {
      brand: request.brand,
      query: request.query,
      maxTokens: request.maxTokens,
    });

    const body = {
      brand: request.brand,
      query: request.query,
      max_tokens: request.maxTokens,
    };

    const response = await this.request<ContextResponse>('POST', '/api/v1/context', body);

    logger.debug('ORACLE context retrieved', {
      tokenCount: response.tokenCount,
      sources: response.sources.length,
    });

    return response;
  }

  /**
   * Delete a document
   */
  async delete(request: DeleteRequest): Promise<DeleteResponse> {
    logger.info('ORACLE deleting document', {
      brand: request.brand,
      docId: request.docId,
    });

    const body = {
      brand: request.brand,
      doc_id: request.docId,
    };

    const response = await this.request<DeleteResponse>('POST', '/api/v1/delete', body);

    logger.info('ORACLE deleted document', {
      docId: request.docId,
      deleted: response.deleted,
    });

    return response;
  }

  /**
   * Get statistics
   */
  async stats(request: StatsRequest): Promise<StatsResponse> {
    logger.debug('ORACLE getting stats', { brand: request.brand });

    const body = {
      brand: request.brand,
    };

    return this.request<StatsResponse>('POST', '/api/v1/stats', body);
  }

  /**
   * Clear all documents for a brand
   */
  async clear(brand: string): Promise<DeleteResponse> {
    logger.warn('ORACLE clearing all documents', { brand });

    const body = {
      brand,
    };

    return this.request<DeleteResponse>('POST', '/api/v1/clear', body);
  }

  /**
   * Check if ORACLE service is running
   */
  async isRunning(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for ORACLE service to be ready
   */
  async waitForReady(timeoutMs = 30000, intervalMs = 1000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (await this.isRunning()) {
        logger.info('ORACLE service is ready');
        return;
      }

      logger.debug('Waiting for ORACLE service...', {
        elapsed: Date.now() - startTime,
      });

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(
      `ORACLE service did not start within ${timeoutMs}ms\n` +
      `Fix: Check logs and ensure service is configured correctly`
    );
  }
}

/**
 * Create ORACLE client with default configuration
 */
export function createOracleClient(config?: OracleConfig): OracleClient {
  return new OracleClient(config);
}
