/**
 * Tests for init command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { initCommand } from '../../../src/cli/commands/init.js';

// Mock dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    green: vi.fn((text) => text),
    cyan: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    red: vi.fn((text) => text),
    bold: vi.fn((text) => text),
    dim: vi.fn((text) => text),
  },
}));

describe('Init Command', () => {
  const testBrand = 'TestBrand';
  const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || process.cwd();
  const testWorkspace = path.join(homeDir, '.brandos', testBrand.toLowerCase());

  beforeEach(() => {
    // Clean up test workspace before each test
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test workspace after each test
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  it('should create workspace directory', async () => {
    await initCommand({
      brand: testBrand,
      industry: 'Technology',
      category: 'SaaS',
    });

    expect(fs.existsSync(testWorkspace)).toBe(true);
  });

  it('should create required subdirectories', async () => {
    await initCommand({
      brand: testBrand,
      industry: 'Technology',
      category: 'SaaS',
    });

    const expectedDirs = ['inputs', 'resources', 'documents', 'outputs', 'state'];
    for (const dir of expectedDirs) {
      const dirPath = path.join(testWorkspace, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    }
  });

  it('should create brand configuration file', async () => {
    await initCommand({
      brand: testBrand,
      industry: 'Technology',
      category: 'SaaS',
    });

    const configPath = path.join(testWorkspace, 'brand-config.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.brandName).toBe(testBrand);
    expect(config.industry).toBe('Technology');
    expect(config.category).toBe('SaaS');
  });

  it('should fail if brand name is missing', async () => {
    await expect(
      initCommand({
        brand: '',
        industry: 'Technology',
        category: 'SaaS',
      })
    ).rejects.toThrow();
  });

  it('should handle workspace that already exists', async () => {
    // Create workspace first time
    await initCommand({
      brand: testBrand,
      industry: 'Technology',
      category: 'SaaS',
    });

    // Try to create again - should not throw
    await expect(
      initCommand({
        brand: testBrand,
        industry: 'Technology',
        category: 'SaaS',
      })
    ).resolves.not.toThrow();
  });

  it('should use default values when optional params are missing', async () => {
    await initCommand({
      brand: testBrand,
    });

    const configPath = path.join(testWorkspace, 'brand-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    expect(config.brandName).toBe(testBrand);
    expect(config).toHaveProperty('industry');
    expect(config).toHaveProperty('category');
  });
});
