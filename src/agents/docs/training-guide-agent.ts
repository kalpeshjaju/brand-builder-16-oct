import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { TrainingGuide } from '../../types/docs-types.js';

export class TrainingGuideAgent implements IAgent {
  public readonly name = 'docs.training-guide';
  public readonly metadata = {
    description: 'Generate staff training guide skeleton (topics/points)',
    version: '1.0.0',
    inputs: [],
    outputs: ['topics'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<TrainingGuide>> {
    try {
      const topics = [
        { topic: 'Product Knowledge', points: ['Origins', 'Specs', 'Key benefits'] },
        { topic: 'Customer Conversation', points: ['Discovery questions', 'Objection handling', 'Upsell opportunities'] },
      ];
      const data: TrainingGuide = {
        brandName: context.brandName,
        generatedAt: new Date().toISOString(),
        topics,
      };
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

