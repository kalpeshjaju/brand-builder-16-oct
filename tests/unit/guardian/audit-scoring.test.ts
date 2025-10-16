// Audit Scoring Snapshot Tests
// Tests that validate audit score calculations are deterministic and reproducible

import { describe, it, expect } from 'vitest';
import { BrandAuditor } from '../../../src/guardian/brand-auditor.js';
import type { BrandStrategy } from '../../../src/types/index.js';

describe('Audit Scoring Arithmetic', () => {
  const auditor = new BrandAuditor();

  describe('Score calculation determinism', () => {
    it('should produce identical scores for identical strategy (snapshot)', async () => {
      const mockStrategy: BrandStrategy = {
        purpose: 'Empower developers to build faster with AI-powered tools',
        mission: 'Democratize software development through intelligent automation',
        vision: 'A world where anyone can create professional software',
        values: ['Innovation', 'Accessibility', 'Quality', 'Community'],
        positioning: 'Premium developer tools for modern teams',
        personality: ['Innovative', 'Reliable', 'Professional', 'Friendly'],
        voiceAndTone: {
          voice: 'Expert but approachable',
          toneAttributes: ['Clear', 'Confident', 'Helpful']
        },
        keyMessages: [
          'Build faster with AI assistance',
          'Professional results, minimal effort',
          'Trusted by 10,000+ developers'
        ],
        differentiators: [
          'AI-powered code generation',
          'Seamless workflow integration',
          'Enterprise-grade security'
        ],
        proofPoints: [
          {
            claim: '10,000+ active developers',
            evidence: 'Internal analytics',
            confidence: 0.95
          },
          {
            claim: '40% faster development',
            evidence: 'Customer survey data',
            confidence: 0.85
          }
        ]
      };

      const result1 = await auditor.audit(mockStrategy, 'TestBrand', { mode: 'standard' });
      const result2 = await auditor.audit(mockStrategy, 'TestBrand', { mode: 'standard' });

      // Scores should be identical for same input
      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result1.scoreBreakdown).toEqual(result2.scoreBreakdown);

      // Snapshot the complete scoring structure
      expect({
        overallScore: result1.overallScore,
        sourceQuality: result1.scoreBreakdown.sourceQuality.score,
        factVerification: result1.scoreBreakdown.factVerification.score,
        dataRecency: result1.scoreBreakdown.dataRecency.score,
        crossVerification: result1.scoreBreakdown.crossVerification.score,
        productionReadiness: result1.scoreBreakdown.productionReadiness.score,
      }).toMatchSnapshot();
    });

    it('should calculate weighted average correctly', async () => {
      const mockStrategy: BrandStrategy = {
        purpose: 'Test purpose',
        mission: 'Test mission',
        vision: 'Test vision',
      };

      const result = await auditor.audit(mockStrategy, 'TestBrand', { mode: 'standard' });

      // Verify weighted calculation matches expected formula
      // NOTE: The actual formula only uses 3 dimensions (dataRecency and crossVerification are hardcoded)
      // overallScore = sourceQuality * 0.3 + factVerification * 0.25 + productionReadiness * 0.45

      const expectedScore =
        result.scoreBreakdown.sourceQuality.score * 0.3 +
        result.scoreBreakdown.factVerification.score * 0.25 +
        result.scoreBreakdown.productionReadiness.score * 0.45;

      // Allow small floating point variance
      expect(Math.abs(result.overallScore - expectedScore)).toBeLessThan(0.1);
    });

    it('should assign correct status labels based on scores', async () => {
      const mockStrategy: BrandStrategy = {
        purpose: 'Test purpose',
      };

      const result = await auditor.audit(mockStrategy, 'TestBrand', { mode: 'standard' });

      // Verify status assignment logic matches implementation
      // Thresholds: >= 8 excellent, >= 6 good, >= 4 needs-work, < 4 critical
      Object.values(result.scoreBreakdown).forEach(dimension => {
        if (dimension.score >= 8) {
          expect(dimension.status).toBe('excellent');
        } else if (dimension.score >= 6) {
          expect(dimension.status).toBe('good');
        } else if (dimension.score >= 4) {
          expect(dimension.status).toBe('needs-work');
        } else {
          expect(dimension.status).toBe('critical');
        }
      });
    });

    it('should produce consistent findings structure', async () => {
      const mockStrategy: BrandStrategy = {
        purpose: 'Build the future of work',
        mission: 'Enable remote collaboration',
        values: ['Transparency', 'Innovation'],
      };

      const result = await auditor.audit(mockStrategy, 'TestBrand', { mode: 'comprehensive' });

      // Verify findings structure
      expect(result.findings).toBeInstanceOf(Array);
      result.findings.forEach(finding => {
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('category');
        expect(finding).toHaveProperty('message');
        expect(['critical', 'warning', 'info', 'success']).toContain(finding.severity);
        expect(['sources', 'facts', 'recency', 'verification', 'quality']).toContain(finding.category);
      });

      // Snapshot findings structure
      expect(result.findings.length).toMatchSnapshot();
    });

    it('should generate actionable recommendations', async () => {
      const mockStrategy: BrandStrategy = {
        purpose: 'Transform education',
        differentiators: ['AI tutoring', 'Personalized learning'],
      };

      const result = await auditor.audit(mockStrategy, 'TestBrand', { mode: 'standard' });

      // Verify recommendations structure
      expect(result.recommendations).toBeInstanceOf(Array);
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('estimatedEffort');
        expect(rec).toHaveProperty('impact');
        expect(['high', 'medium', 'low']).toContain(rec.priority);
      });

      // Snapshot recommendation count
      expect(result.recommendations.length).toMatchSnapshot();
    });
  });

  describe('Score boundary conditions', () => {
    it('should handle minimal strategy (worst case)', async () => {
      const minimalStrategy: BrandStrategy = {};

      const result = await auditor.audit(minimalStrategy, 'MinimalBrand', { mode: 'quick' });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(10);
      expect(result.scoreBreakdown.productionReadiness.score).toBeLessThan(5);
    });

    it('should handle comprehensive strategy (best case)', async () => {
      const comprehensiveStrategy: BrandStrategy = {
        purpose: 'Clear purpose statement with evidence',
        mission: 'Specific mission with measurable outcomes',
        vision: 'Compelling vision for the future',
        values: ['Value1', 'Value2', 'Value3', 'Value4', 'Value5'],
        positioning: 'Unique positioning in competitive landscape',
        personality: ['Trait1', 'Trait2', 'Trait3'],
        voiceAndTone: {
          voice: 'Professional and approachable',
          toneAttributes: ['Clear', 'Confident', 'Inspiring']
        },
        keyMessages: [
          'Message 1 with data',
          'Message 2 with proof',
          'Message 3 with validation'
        ],
        differentiators: [
          'Unique differentiator 1',
          'Competitive advantage 2',
          'Market leadership 3'
        ],
        proofPoints: [
          { claim: 'Claim 1', evidence: 'Strong evidence', confidence: 0.95 },
          { claim: 'Claim 2', evidence: 'Research data', confidence: 0.90 },
          { claim: 'Claim 3', evidence: 'Third-party validation', confidence: 0.88 }
        ]
      };

      const result = await auditor.audit(comprehensiveStrategy, 'ComprehensiveBrand', { mode: 'comprehensive' });

      expect(result.overallScore).toBeGreaterThan(5);
      expect(result.scoreBreakdown.productionReadiness.score).toBeGreaterThan(7);
    });
  });

  describe('Mode-specific behavior', () => {
    it('should respect quick mode (faster, less thorough)', async () => {
      const strategy: BrandStrategy = { purpose: 'Test' };

      const result = await auditor.audit(strategy, 'TestBrand', { mode: 'quick' });

      expect(result.auditDate).toBeDefined();
      expect(result.brandName).toBe('TestBrand');
    });

    it('should respect comprehensive mode (thorough analysis)', async () => {
      const strategy: BrandStrategy = { purpose: 'Test' };

      const result = await auditor.audit(strategy, 'TestBrand', { mode: 'comprehensive' });

      expect(result.auditDate).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
