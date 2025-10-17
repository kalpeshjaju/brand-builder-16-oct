/**
 * Tests for WebFetcher utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebFetcher } from '../../../src/utils/web-fetcher.js';

// Mock axios
vi.mock('axios');

describe('WebFetcher', () => {
  let fetcher: WebFetcher;

  beforeEach(async () => {
    // Use a test-specific cache directory
    fetcher = new WebFetcher({ cacheDir: './.cache/web-fetcher-test' });
    // Clear cache before each test to avoid interference
    await fetcher.clearAllCache();
    vi.clearAllMocks();
  });

  describe('URL validation', () => {
    it('should accept valid HTTP URLs', () => {
      expect(() => new URL('http://example.com')).not.toThrow();
    });

    it('should accept valid HTTPS URLs', () => {
      expect(() => new URL('https://example.com')).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      expect(() => new URL('not-a-url')).toThrow();
    });
  });


  describe('fetch result structure', () => {
    it('should return proper result structure on success', async () => {
      const { default: axios } = await import('axios');
      const mockResponse = {
        data: '<html><head><title>Test Page</title></head><body><p>Content</p></body></html>',
        status: 200,
        statusText: 'OK',
      };

      vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

      const result = await fetcher.fetch('https://example.com');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('headings');
      expect(result).toHaveProperty('links');
      expect(result).toHaveProperty('fetchedAt');
      expect(result).toHaveProperty('cached');
    });

    it('should extract basic HTML elements', async () => {
      const { default: axios } = await import('axios');
      const mockResponse = {
        data: '<html><head><title>Test Title</title></head><body><h1>Header</h1><p>Content</p></body></html>',
        status: 200,
      };

      vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

      const result = await fetcher.fetch('https://example.com');

      expect(result.title).toBe('Test Title');
      expect(result.headings).toContain('Header');
    });
  });

  describe('Caching behavior', () => {
    it('should cache results and reuse them', async () => {
      const { default: axios } = await import('axios');
      const mockResponse = {
        data: '<html><head><title>Test</title></head><body>Content</body></html>',
        status: 200,
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result1 = await fetcher.fetch('https://example.com/test');
      const result2 = await fetcher.fetch('https://example.com/test');

      expect(result1.cached).toBe(false); // First call not cached
      expect(result2.cached).toBe(true); // Second call should be cached
    });
  });

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      const { default: axios } = await import('axios');
      vi.mocked(axios.get).mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(fetcher.fetch('https://example.com')).rejects.toThrow();
    });

    it('should handle DNS resolution failures', async () => {
      const { default: axios } = await import('axios');
      vi.mocked(axios.get).mockRejectedValueOnce({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND example.com',
      });

      await expect(fetcher.fetch('https://invalid-domain-12345.com')).rejects.toThrow();
    });

    it('should handle 404 responses', async () => {
      const { default: axios } = await import('axios');
      vi.mocked(axios.get).mockRejectedValueOnce({
        response: { status: 404, statusText: 'Not Found' },
      });

      await expect(fetcher.fetch('https://example.com/notfound')).rejects.toThrow();
    });

    it('should handle 500 server errors', async () => {
      const { default: axios } = await import('axios');
      vi.mocked(axios.get).mockRejectedValueOnce({
        response: { status: 500, statusText: 'Internal Server Error' },
      });

      await expect(fetcher.fetch('https://example.com/error')).rejects.toThrow();
    });
  });

});
