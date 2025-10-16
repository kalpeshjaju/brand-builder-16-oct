// Fact Extractor tests

import { describe, it, expect } from 'vitest';
import { FactExtractor } from '../../../src/guardian/fact-extractor.js';

describe('FactExtractor', () => {
  const extractor = new FactExtractor();

  describe('extractFacts', () => {
    it('should extract numeric facts', () => {
      const text = 'The company has $10M in revenue and was founded in 2020.';
      const facts = extractor.extractFacts(text);

      expect(facts.length).toBeGreaterThan(0);
      expect(facts.some(f => f.type === 'numeric')).toBe(true);
    });

    it('should extract categorical facts', () => {
      const text = 'The brand is a premium product that operates in retail.';
      const facts = extractor.extractFacts(text);

      expect(facts.length).toBeGreaterThan(0);
      expect(facts.some(f => f.type === 'categorical')).toBe(true);
    });

    it('should assign confidence scores', () => {
      const text = 'Revenue is $5M';
      const facts = extractor.extractFacts(text);

      facts.forEach(fact => {
        expect(fact.confidence).toBeGreaterThan(0);
        expect(fact.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('getHighConfidenceFacts', () => {
    it('should filter facts by confidence threshold', () => {
      const facts = [
        { subject: 'A', predicate: 'is', value: 'B', confidence: 0.8, sourceText: 'test', type: 'categorical' as const },
        { subject: 'C', predicate: 'is', value: 'D', confidence: 0.5, sourceText: 'test', type: 'categorical' as const },
      ];

      const highConf = extractor.getHighConfidenceFacts(facts, 0.7);

      expect(highConf.length).toBe(1);
      expect(highConf[0]?.confidence).toBe(0.8);
    });
  });

  describe('groupByType', () => {
    it('should group facts by type', () => {
      const facts = [
        { subject: 'A', predicate: 'is', value: '1', confidence: 0.8, sourceText: 'test', type: 'numeric' as const },
        { subject: 'B', predicate: 'is', value: '2', confidence: 0.7, sourceText: 'test', type: 'numeric' as const },
        { subject: 'C', predicate: 'is', value: 'D', confidence: 0.6, sourceText: 'test', type: 'categorical' as const },
      ];

      const grouped = extractor.groupByType(facts);

      expect(grouped['numeric']).toHaveLength(2);
      expect(grouped['categorical']).toHaveLength(1);
    });
  });
});
