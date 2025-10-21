import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchTopicsFramework } from '../../types/genesis-types.js';
import { customizeResearchTopics as customize } from '../../genesis/config/research-topics.js';

export class ResearchTopicsAgent implements IAgent {
  public readonly name = 'genesis.research-topics';
  public readonly metadata = {
    description: 'Generate customized 77-subtopic research framework (Horizon)',
    version: '1.0.0',
    inputs: [],
    outputs: ['phase1', 'phase2', 'phase3', 'phase4'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<ResearchTopicsFramework>> {
    try {
      const brandConfig = {
        brandName: context.brandName,
        industry: 'General',
        category: 'General',
        companyProfile: { channels: ['web', 'retail'] },
        projectObjectives: { primary: 'Brand evolution', goals: ['Research', 'Strategy'] },
      } as any;

      const fw = customize(brandConfig) as ResearchTopicsFramework;
      return { success: true, data: fw };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
