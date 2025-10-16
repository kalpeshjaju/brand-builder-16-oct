// Source Quality Assessor tests

import { describe, it, expect } from 'vitest';
import { SourceQualityAssessor } from '../../../src/guardian/source-quality-assessor.js';

describe('SourceQualityAssessor', () => {
  const assessor = new SourceQualityAssessor();

  describe('assessSource', () => {
    it('should assign tier1 to government sources', () => {
      const result = assessor.assessSource('https://www.census.gov/data');

      expect(result.tier).toBe('tier1');
      expect(result.score).toBeGreaterThan(0.9);
    });

    it('should assign tier1 to educational sources', () => {
      const result = assessor.assessSource('https://harvard.edu/research');

      expect(result.tier).toBe('tier1');
    });

    it('should assign tier2 to reputable news', () => {
      const result = assessor.assessSource('https://www.wsj.com/article');

      expect(result.tier).toBe('tier2');
      expect(result.score).toBeGreaterThan(0.7);
      expect(result.score).toBeLessThan(0.9);
    });

    it('should assign tier3 to blogs', () => {
      const result = assessor.assessSource('https://medium.com/blog-post');

      expect(result.tier).toBe('tier3');
      expect(result.score).toBeGreaterThan(0.4);
      expect(result.score).toBeLessThan(0.7);
    });

    it('should assign tier4 to unknown sources', () => {
      const result = assessor.assessSource('https://unknown-site.com');

      expect(result.tier).toBe('tier4');
      expect(result.score).toBeLessThan(0.4);
    });

    it('should include reasoning', () => {
      const result = assessor.assessSource('https://www.gov/data');

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('assessMultipleSources', () => {
    it('should assess multiple sources', () => {
      const sources = [
        { url: 'https://www.gov/data', title: 'Gov Data' },
        { url: 'https://wsj.com/article', title: 'WSJ Article' },
      ];

      const results = assessor.assessMultipleSources(sources);

      expect(results).toHaveLength(2);
      expect(results[0]?.tier).toBe('tier1');
      expect(results[1]?.tier).toBe('tier2');
    });
  });

  describe('getAverageTier', () => {
    it('should calculate average tier', () => {
      const sources = [
        { url: 'test1', title: 'Test 1', tier: 'tier1' as const, score: 0.95, isRecent: true, reasoning: 'test' },
        { url: 'test2', title: 'Test 2', tier: 'tier3' as const, score: 0.50, isRecent: true, reasoning: 'test' },
      ];

      const avg = assessor.getAverageTier(sources);

      expect(avg).toBe(2); // (1 + 3) / 2 = 2
    });

    it('should return 4 for empty array', () => {
      const avg = assessor.getAverageTier([]);

      expect(avg).toBe(4);
    });
  });
});
