import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchBlitzOutput, CreativeDirectionOutput, ValidationOutput } from '../../types/evolution-types.js';
import { BuildOutGenerator } from '../../evolution/build-out-generator.js';

export class BuildOutAgent implements IAgent {
  public readonly name = 'evolution.build-out';
  public readonly metadata = {
    description: 'Phase 5: Generate complete brand evolution strategy (build-out)',
    version: '1.0.0',
    inputs: ['evolution.research-blitz', 'evolution.creative-direction', 'evolution.validation'],
    outputs: ['executiveSummary', 'positioningFramework', 'messagingArchitecture'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      const direction = context.results['evolution.creative-direction'] as CreativeDirectionOutput | undefined;
      const validation = context.results['evolution.validation'] as ValidationOutput | undefined;
      if (!research || !direction || !validation) {
        return { success: false, data: null, error: 'Missing dependencies: research, direction, or validation' };
        }

      const gen = new BuildOutGenerator();
      const data = await gen.generate(research, direction, validation);
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

