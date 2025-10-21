import { describe, it, expect } from 'vitest';
import { NarrativeAgent } from '../../../src/agents/docs/narrative-agent.js';

describe('NarrativeAgent', () => {
  it('generates a narrative package with toc and sections', async () => {
    const agent = new NarrativeAgent();
    const res = await agent.execute({
      brandName: 'TestBrand',
      brandUrl: 'https://example.com',
      competitorUrls: [],
      useOracle: false,
      results: {},
    });
    expect(res.success).toBe(true);
    if (res.success && res.data) {
      expect(Array.isArray(res.data.toc)).toBe(true);
      expect(Array.isArray(res.data.sections)).toBe(true);
    }
  });
});

