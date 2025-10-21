/**
 * Tests for init command
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';
import { initCommand } from '../../../src/cli/commands/init.js';
import { WorkspaceManager } from '../../../src/context/workspace-manager.js';
import { FileSystemUtils } from '../../../src/utils/file-system.js';

// Mock dependencies
vi.mock('../../../src/context/workspace-manager.js');
vi.mock('../../../src/utils/file-system.js');
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}));

describe('Init Command', () => {
  const testBrand = 'TestBrand';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create workspace and configuration files', async () => {
    const mockEnsureBrandWorkspace = vi.fn();
    const mockGetPath = vi.fn((subfolder) => `/test/path/${subfolder}`);
    vi.mocked(WorkspaceManager).mockImplementation(() => ({
      ensureBrandWorkspace: mockEnsureBrandWorkspace,
      getPath: mockGetPath,
      brandRoot: '/test/path',
    } as any));

    const mockWriteJSON = vi.mocked(FileSystemUtils.writeJSON);

    await initCommand({
      brand: testBrand,
      industry: 'Technology',
      category: 'SaaS',
    });

    expect(mockEnsureBrandWorkspace).toHaveBeenCalledOnce();
    expect(mockWriteJSON).toHaveBeenCalledTimes(2);

    // Check brand-config.json call
    expect(mockWriteJSON).toHaveBeenCalledWith(
      expect.stringContaining('brand-config.json'),
      expect.objectContaining({
        brandName: testBrand,
        industry: 'Technology',
      })
    );

    // Check context-state.json call
    expect(mockWriteJSON).toHaveBeenCalledWith(
      expect.stringContaining('context-state.json'),
      expect.objectContaining({
        brandName: testBrand,
        workspace: '/test/path',
      })
    );
  });

  it('should fail if brand name is missing', async () => {
    await expect(
      initCommand({
        brand: '',
      })
    ).rejects.toThrow(ZodError);
  });

  it('should use default values for optional params', async () => {
    const mockWriteJSON = vi.mocked(FileSystemUtils.writeJSON);
    vi.mocked(WorkspaceManager).mockImplementation(() => ({
      ensureBrandWorkspace: vi.fn(),
      getPath: vi.fn(() => '/test/path/db'),
      brandRoot: '/test/path',
    } as any));

    await initCommand({
      brand: testBrand,
    });

    expect(mockWriteJSON).toHaveBeenCalledWith(
      expect.stringContaining('brand-config.json'),
      expect.objectContaining({
        industry: 'Not specified',
        category: 'Not specified',
      })
    );
  });
});
