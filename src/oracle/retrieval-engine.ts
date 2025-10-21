// src/oracle/retrieval-engine.ts

import { OracleClient } from './oracle-client.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('RetrievalEngine');

export class RetrievalEngine {
  private oracle: OracleClient;

  constructor() {
    this.oracle = new OracleClient();
  }

  public async retrieve(query: string, topN = 3): Promise<any[]> {
    logger.info(`Retrieving context for query: "${query}"`);
    try {
      const results = await this.oracle.search<any>({
        query,
        n_results: topN,
      });
      // TODO: Process and format the results before returning them
      return results.results ?? [];
    } catch (error) {
      logger.error('Failed to retrieve context from Oracle', error);
      return [];
    }
  }

  public close(): void {
    this.oracle.close();
  }
}
