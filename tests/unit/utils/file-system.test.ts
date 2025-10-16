// File system utilities tests

import { describe, it, expect } from 'vitest';
import { FileSystemUtils } from '../../../src/utils/file-system.js';

describe('FileSystemUtils', () => {
  describe('calculateHash', () => {
    it('should calculate consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = FileSystemUtils.calculateHash(content);
      const hash2 = FileSystemUtils.calculateHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    it('should produce different hashes for different content', () => {
      const hash1 = FileSystemUtils.calculateHash('content 1');
      const hash2 = FileSystemUtils.calculateHash('content 2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getBrandWorkspacePath', () => {
    it('should sanitize brand name', () => {
      const path = FileSystemUtils.getBrandWorkspacePath('Test Brand Name');

      expect(path).toContain('test-brand-name');
      expect(path).not.toContain(' ');
    });

    it('should create consistent paths', () => {
      const path1 = FileSystemUtils.getBrandWorkspacePath('My Brand');
      const path2 = FileSystemUtils.getBrandWorkspacePath('My Brand');

      expect(path1).toBe(path2);
    });
  });

  describe('resolvePath', () => {
    it('should resolve relative paths', () => {
      const resolved = FileSystemUtils.resolvePath('test', 'path');

      expect(resolved).toContain('test');
      expect(resolved).toContain('path');
    });
  });
});
