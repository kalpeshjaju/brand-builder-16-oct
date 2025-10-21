// src/oracle/oracle-client.ts

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

  public close(): void {
    this.bridge.kill();
  }
}