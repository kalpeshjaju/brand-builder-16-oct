// src/oracle/oracle-client.ts
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import path from 'path';
import { PythonBridge } from './python-bridge.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('OracleClient');

interface AddDocumentArgs {
  id: string;
  document: string;
  metadata: Record<string, unknown>;
}

interface SearchArgs {
  query: string;
  n_results?: number;
}

export class OracleClient {
  private bridge: PythonBridge;

  constructor() {
    const scriptPath = path.resolve(__dirname, 'oracle_bridge.py');
    this.bridge = new PythonBridge(scriptPath);
    logger.info('OracleClient initialized');
  }

  public async addDocument(args: AddDocumentArgs): Promise<{ status: string; id: string }> {
    return this.bridge.sendCommand('add', args);
  }

  public async search<T>(args: SearchArgs): Promise<T> {
    return this.bridge.sendCommand('search', args);
  }

  public async isRunning(): Promise<boolean> {
    try {
      await this.bridge.sendCommand('ping', {});
      return true;
    } catch {
      return false;
    }
  }

  public async index(args: {
    brand: string;
    docId: string;
    text: string;
    metadata: Record<string, unknown>;
  }): Promise<{ status: string; id: string }> {
    return this.addDocument({
      id: args.docId,
      document: args.text,
      metadata: { ...args.metadata, brand: args.brand },
    });
  }

  public async getContext(args: {
    brand: string;
    query: string;
    maxTokens?: number;
  }): Promise<string> {
    const results = await this.search<{ documents?: string[][] }>({
      query: args.query,
      n_results: 3,
    });
    
    if (results?.documents && Array.isArray(results.documents[0])) {
      return results.documents[0].slice(0, args.maxTokens ? 1 : 3).join('\n\n');
    }
    
    return '';
  }

  public close(): void {
    this.bridge.kill();
  }
}