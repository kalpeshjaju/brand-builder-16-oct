import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ValidationOutput } from '../../types/evolution-types.js';

export interface CrossVerifyOutput {
  brandName: string;
  generatedAt: string;
  supportingCount: number;
  contradictingCount: number;
  supportRatio: number; // supporting/(supporting+contradicting)
}

export class CrossVerifyAgent implements IAgent {
  public readonly name = 'guardian.cross-verify';
  public readonly metadata = {
    description: 'Cross-verify support vs contradiction counts from validation evidence',
    version: '1.0.0',
    inputs: ['evolution.validation'],
    outputs: ['supportRatio'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<CrossVerifyOutput>> {
    try {
      const validation = context.results['evolution.validation'] as ValidationOutput | undefined;
      if (!validation) return { success: false, data: null, error: 'Missing dependency: evolution.validation' };

      const supportingCount = (validation.evidenceAssessment?.supportingEvidence || []).length;
      const contradictingCount = (validation.evidenceAssessment?.contradictingEvidence || []).length;
      const denom = supportingCount + contradictingCount || 1;
      const supportRatio = supportingCount / denom;

      return {
        success: true,
        data: {
          brandName: context.brandName,
          generatedAt: new Date().toISOString(),
          supportingCount,
          contradictingCount,
          supportRatio,
        },
      };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

