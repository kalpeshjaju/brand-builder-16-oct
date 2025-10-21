import { describe, it, expect } from 'vitest';
import { AgentFactory } from '../../../src/orchestrator/AgentFactory.js';

describe('AgentFactory', () => {
  it('lists registered agent names', () => {
    const names = AgentFactory.listNames();
    expect(names).toContain('evolution.research-blitz');
    expect(names).toContain('evolution.pattern-presentation');
  });

  it('provides metadata for known agents', () => {
    const meta = AgentFactory.getMetadata('evolution.research-blitz');
    expect(meta?.name).toBe('evolution.research-blitz');
    expect(meta?.metadata?.description).toBeTruthy();
  });
});

