import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { PatternPresentationOutput } from '../../types/evolution-types.js';
import type { CreativeDirectionConfig } from '../../types/evolution-config-types.js';
import { CreativeDirector } from '../../evolution/creative-director.js';

export class CreativeDirectionAgent implements IAgent {
  public readonly name = 'evolution.creative-direction';
  public readonly metadata = {
    description: 'Phase 3: Capture creative direction (config mode) based on patterns',
    version: '1.0.0',
    inputs: ['evolution.pattern-presentation'],
    outputs: ['primaryDirection', 'keyThemes', 'creativeLeaps'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult> {
    try {
      const patterns = context.results['evolution.pattern-presentation'] as PatternPresentationOutput | undefined;
      if (!patterns) {
        return { success: false, data: null, error: 'Missing dependency: evolution.pattern-presentation' };
      }

      const config = this.deriveConfig(patterns);
      const director = new CreativeDirector();
      const data = await director.captureDirection(patterns, 'config', config);
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private deriveConfig(patterns: PatternPresentationOutput): CreativeDirectionConfig {
    const contradictions = patterns.contradictions.map(c => ({ patternId: c.id, action: 'note' as const }));
    const ws = patterns.whiteSpace.slice(0, 3);
    const whiteSpace = ws.map(w => ({ gapId: w.id, decision: 'explore' as const, reasoning: 'Derived from pattern analysis' }));
    const creativeLeaps = ws.slice(0, 2).map(w => ({ idea: `Explore: ${w.untappedOpportunity || w.description}`, rationale: 'From white space opportunity' }));
    const intuitions: CreativeDirectionConfig['intuitions'] = [];
    const axis1 = patterns.positioningMap.axis1?.name || 'Premium';
    const axis2 = patterns.positioningMap.axis2?.name || 'Innovation';
    const primaryDirection = `Position on ${axis1} × ${axis2} informed by whitespace`;
    const keyThemes = [axis1, axis2].filter(Boolean);

    return {
      brandName: patterns.brandName,
      contradictions,
      whiteSpace,
      creativeLeaps,
      intuitions,
      primaryDirection,
      keyThemes,
    };
  }
}

