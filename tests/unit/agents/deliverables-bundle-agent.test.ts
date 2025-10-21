import { describe, it, expect } from 'vitest';
import { DeliverablesBundleAgent } from '../../../src/agents/genesis/deliverables-bundle-agent.js';

describe('DeliverablesBundleAgent', () => {
  it('generates a deliverables bundle with total count', async () => {
    const agent = new DeliverablesBundleAgent();
    const res = await agent.execute({
      brandName: 'TestBrand',
      brandUrl: 'https://example.com',
      competitorUrls: [],
      useOracle: false,
      results: {},
    });
    expect(res.success).toBe(true);
    if (res.success && res.data) {
      expect(typeof res.data.total).toBe('number');
      expect(res.data.deliverables).toBeTruthy();
    }
  });
});

