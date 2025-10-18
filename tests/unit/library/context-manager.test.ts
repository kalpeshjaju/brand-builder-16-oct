// Context Manager tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContextManager } from '../../../src/library/context-manager.js';
import { FileSystemUtils } from '../../../src/utils/index.js';
import { rm } from 'fs/promises';

describe('ContextManager', () => {
  const testBrand = 'test-brand-' + Date.now();
  let manager: ContextManager;
  let workspacePath: string;

  beforeEach(async () => {
    manager = new ContextManager(testBrand);
    workspacePath = FileSystemUtils.getBrandWorkspacePath(testBrand);
    await manager.initialize();
  });

  afterEach(async () => {
    // Clean up entire test workspace directory
    try {
      await rm(workspacePath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('should create initial context state', async () => {
      const state = await manager.getState();

      expect(state.brandName).toBe(testBrand);
      expect(state.files).toEqual([]);
      expect(state.knowledge).toEqual([]);
      expect(state.stats.totalFiles).toBe(0);
    });
  });

  describe('addFile', () => {
    it('should add a tracked file', async () => {
      await manager.addFile({
        path: '/test/file.txt',
        category: 'document',
        subtype: 'strategy',
        format: 'txt',
        fingerprint: {
          sha256: 'test-hash',
          size: 1024,
          mtime: new Date().toISOString(),
        },
        metadata: {},
        indexed: false,
      });

      const state = await manager.getState();

      expect(state.files).toHaveLength(1);
      expect(state.files[0]?.path).toBe('/test/file.txt');
      expect(state.stats.totalFiles).toBe(1);
      expect(state.stats.pendingFiles).toBe(1);
    });
  });

  describe('addKnowledge', () => {
    it('should add a knowledge entry', async () => {
      await manager.addKnowledge({
        sourceFileId: 'file-123',
        content: 'Test knowledge content',
        confidence: 0.8,
      });

      const state = await manager.getState();

      expect(state.knowledge).toHaveLength(1);
      expect(state.knowledge[0]?.content).toBe('Test knowledge content');
      expect(state.stats.totalKnowledge).toBe(1);
    });
  });

  describe('searchKnowledge', () => {
    it('should search knowledge by query', async () => {
      await manager.addKnowledge({
        sourceFileId: 'file-1',
        content: 'Brand positioning statement',
        confidence: 0.9,
      });

      await manager.addKnowledge({
        sourceFileId: 'file-2',
        content: 'Marketing strategy overview',
        confidence: 0.8,
      });

      const results = await manager.searchKnowledge('brand');

      expect(results).toHaveLength(1);
      expect(results[0]?.content).toContain('Brand');
    });

    it('should return empty array when no matches', async () => {
      const results = await manager.searchKnowledge('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return current stats', async () => {
      await manager.addFile({
        path: '/test/file.txt',
        category: 'document',
        subtype: 'strategy',
        format: 'txt',
        fingerprint: {
          sha256: 'hash',
          size: 100,
          mtime: new Date().toISOString(),
        },
        metadata: {},
        indexed: true,
      });

      const stats = await manager.getStats();

      expect(stats.totalFiles).toBe(1);
      expect(stats.processedFiles).toBe(1);
    });
  });

  describe('clear', () => {
    it('should reset context state', async () => {
      await manager.addFile({
        path: '/test/file.txt',
        category: 'document',
        subtype: 'strategy',
        format: 'txt',
        fingerprint: {
          sha256: 'hash',
          size: 100,
          mtime: new Date().toISOString(),
        },
        metadata: {},
        indexed: true,
      });

      await manager.clear();

      const state = await manager.getState();

      expect(state.files).toEqual([]);
      expect(state.stats.totalFiles).toBe(0);
    });
  });
});
