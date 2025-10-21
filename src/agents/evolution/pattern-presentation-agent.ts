import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import { PatternPresenter } from '../../evolution/pattern-presenter.js';
import type { ResearchBlitzOutput, PatternPresentationOutput } from '../../types/evolution-types.js';

export class PatternPresentationAgent implements IAgent {
  public readonly name = 'evolution.pattern-presentation';
  public readonly metadata = {
    description: 'Phase 2: Transform research into patterns (contradictions, white space, language gaps, positioning map, inflection points)',
    version: '1.0.0',
    inputs: ['evolution.research-blitz'],
    outputs: ['contradictions', 'whiteSpace', 'languageGaps', 'positioningMap', 'inflectionPoints'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<PatternPresentationOutput>> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      if (!research) {
        return { success: false, data: null, error: 'Missing dependency: evolution.research-blitz' };
      }

      const presenter = new PatternPresenter();
      const data = await presenter.present(research);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
