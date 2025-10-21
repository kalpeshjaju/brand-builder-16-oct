import { describe, it, expect } from 'vitest';
import { NumericVarianceAgent } from '../../../src/agents/guardian/numeric-variance-agent.js';

describe('NumericVarianceAgent', () => {
  it('flags extreme variance', async () => {
    const agent = new NumericVarianceAgent();
    const res = await agent.execute({
      brandName: 'TestBrand',
      brandUrl: 'https://example.com',
      results: {
        'evolution.build-out': {
          brandName: 'TestBrand',
          generatedAt: new Date().toISOString(),
          executiveSummary: '',
          positioningFramework: { statement: '', targetAudience: '', categoryFrame: '', pointOfDifference: '', reasonToBelieve: [] },
          messagingArchitecture: { brandEssence: '', tagline: '', keyMessages: [], proofPoints: [], toneOfVoice: [] },
          contentExamples: [], visualDirection: { colorPalette: [], typography: [], imagery: [], designPrinciples: [] },
          channelStrategy: [], implementationRoadmap: [], successMetrics: [
            { metric: 'Revenue', baseline: '100', target: '1000', timeline: '', measurement: ''}
          ],
          evidenceTrail: []
        } as any
      },
      useOracle: false,
      competitorUrls: []
    });
    expect(res.success).toBe(true);
    if (res.success && res.data) {
      expect(res.data.flagged.length).toBeGreaterThanOrEqual(1);
    }
  });
});

