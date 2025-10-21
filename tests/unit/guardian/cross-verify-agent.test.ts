import { describe, it, expect } from 'vitest';
import { CrossVerifyAgent } from '../../../src/agents/guardian/cross-verify-agent.js';

describe('CrossVerifyAgent', () => {
  it('computes support ratio', async () => {
    const agent = new CrossVerifyAgent();
    const res = await agent.execute({
      brandName: 'Test', brandUrl: 'https://example.com', competitorUrls: [], useOracle: false,
      results: {
        'evolution.validation': {
          brandName: 'Test', direction: '', generatedAt: new Date().toISOString(),
          alignmentCheck: { score: 7, evidence: [], concerns: [], brandDnaFactors: [] },
          evidenceAssessment: {
            supportingEvidence: [{ source: 'a', finding: 'x', confidence: 0.9 }],
            contradictingEvidence: [{ source: 'b', finding: 'y', confidence: 0.5 }],
            netConfidence: 0.7
          },
          riskAnalysis: [], feasibilityCheck: { canDeliver: true, requirements: [], gaps: [], timeline: '', resources: [] },
          marketViability: { score: 7, targetSegment: '', segmentSize: '', resonanceFactors: [], barriers: [] },
          differentiationScore: 0.7, overallConfidence: 0.7, recommendation: 'proceed', modifications: []
        } as any
      }
    });
    expect(res.success).toBe(true);
    if (res.success && res.data) {
      expect(res.data.supportRatio).toBeGreaterThan(0);
    }
  });
});

