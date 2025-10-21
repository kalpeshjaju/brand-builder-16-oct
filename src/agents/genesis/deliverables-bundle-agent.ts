import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import { customizeDeliverables, countDeliverables, getDeliverablesByPhase } from '../../genesis/config/deliverables-framework.js';
import type { BrandConfiguration } from '../../types/brand-types.js';

export class DeliverablesBundleAgent implements IAgent {
  public readonly name = 'genesis.deliverables-bundle';
  public readonly metadata = {
    description: 'Generate 64-deliverable framework customized for the brand',
    version: '1.0.0',
    inputs: [],
    outputs: ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<{ deliverables: Record<string, string[]>; total: number }>> {
    try {
      const cfg: BrandConfiguration = {
        brandName: context.brandName,
        industry: 'General',
        category: 'General',
        projectObjectives: { primary: 'Brand evolution', goals: ['Deliverables Bundle'] },
      } as any;

      const deliverables = customizeDeliverables(cfg);
      const total = countDeliverables();
      return { success: true, data: { deliverables, total } };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

