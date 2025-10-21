// src/oracle/python-bridge.ts

import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../utils/logger.js';

const logger = new Logger('PythonBridge');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PythonBridge {
  private process: ChildProcess;

  constructor(private scriptPath: string) {
    this.process = this.createProcess();
  }

  private createProcess(): ChildProcess {
    const pythonExecutable = path.resolve(__dirname, '.venv/bin/python3');
    const process = spawn(pythonExecutable, ['-u', this.scriptPath]);

    process.stdout?.on('data', (data) => {
      logger.info(`[PYTHON] ${data.toString().trim()}`);
    });

    process.stderr?.on('data', (data) => {
      logger.error(`[PYTHON] ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      logger.warn(`Python script exited with code ${code}`);
    });

    return process;
  }

  public async sendCommand<T>(command: string, data: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = JSON.stringify({ command, data });
      this.process.stdin?.write(request + '\n');

      const onData = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          this.process.stdout?.removeListener('data', onData);
          if (response.status === 'success') {
            resolve(response as T);
          } else {
            reject(new Error(response.message));
          }
        } catch (error) {
          reject(error);
        }
      };

      this.process.stdout?.on('data', onData);
    });
  }

  public kill(): void {
    this.process.kill();
  }
}
