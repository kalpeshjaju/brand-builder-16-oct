// File system utilities

import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { dirname, resolve, join } from 'path';
import { createHash } from 'crypto';

export class FileSystemUtils {
  /**
   * Ensure directory exists, create if it doesn't
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw new Error(
          `Failed to create directory at ${dirPath}\n` +
          `Reason: ${(error as Error).message}\n` +
          `Fix: Check permissions and path validity.`
        );
      }
    }
  }

  /**
   * Write JSON file with proper formatting
   */
  static async writeJSON(filePath: string, data: unknown): Promise<void> {
    const dir = dirname(filePath);
    await this.ensureDir(dir);

    try {
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to write JSON file at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the directory exists and you have write permissions.`
      );
    }
  }

  /**
   * Read JSON file and parse
   */
  static async readJSON<T = unknown>(filePath: string): Promise<T> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `File not found at ${filePath}\n` +
          `Fix: Ensure the file exists at the specified path.`
        );
      }
      throw new Error(
        `Failed to read JSON file at ${filePath}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure the file is valid JSON and you have read permissions.`
      );
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolve path relative to workspace
   */
  static resolvePath(...paths: string[]): string {
    return resolve(process.cwd(), ...paths);
  }

  /**
   * Get brand workspace path
   */
  static getBrandWorkspacePath(brandName: string): string {
    const sanitized = brandName.toLowerCase().replace(/\s+/g, '-');
    return this.resolvePath('.brandos', sanitized);
  }

  /**
   * Get data directory for brand
   */
  static getBrandDataPath(brandName: string, ...subpaths: string[]): string {
    return join(this.getBrandWorkspacePath(brandName), 'data', ...subpaths);
  }

  /**
   * Calculate SHA-256 hash of file content
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath);
      return createHash('sha256').update(content).digest('hex');
    } catch (error) {
      throw new Error(
        `Failed to calculate hash for ${filePath}\n` +
        `Reason: ${(error as Error).message}`
      );
    }
  }

  /**
   * Calculate SHA-256 hash of string content
   */
  static calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
