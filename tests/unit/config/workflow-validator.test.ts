import { describe, it, expect } from 'vitest';
import { validateWorkflowConfig } from '../../../src/config/workflow-validator.js';

describe('workflow-validator', () => {
  it('accepts a minimal valid config', () => {
    const cfg = { stages: [{ name: 'Discovery', agents: [{ name: 'evolution.research-blitz' }] }] };
    const res = validateWorkflowConfig(cfg);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.stages.length).toBe(1);
    }
  });

  it('returns friendly errors for invalid config', () => {
    const cfg = { stages: [{ agents: [] }] };
    const res = validateWorkflowConfig(cfg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some(e => e.includes('$.stages.0.name'))).toBe(true);
    }
  });
});

