import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchBlitzOutput, CreativeDirectionOutput } from '../../types/evolution-types.js';
import { ValidationEngine } from '../../evolution/validation-engine.js';
import type { OracleContextOutput } from '../../types/oracle-types.js';

export class ValidationAgent implements IAgent {
  public readonly name = 'evolution.validation';
  public readonly metadata = {
    description: 'Phase 4: Validate creative direction against research evidence',
    version: '1.0.0',
    inputs: ['evolution.research-blitz', 'evolution.creative-direction'],
    outputs: ['overallConfidence', 'recommendation', 'differentiationScore'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      const direction = context.results['evolution.creative-direction'] as CreativeDirectionOutput | undefined;
      if (!research || !direction) {
        return { success: false, data: null, error: 'Missing dependencies: research or direction' };
      }

      let oracleSnippets: string[] | undefined;
      const oc = context.results['oracle.context'] as OracleContextOutput | undefined;
      if (oc?.items?.length) {
        oracleSnippets = oc.items.flatMap(i => i.snippets).filter(Boolean).slice(0, 5);
      }

      const engine = new ValidationEngine({ oracleSnippets });
      const data = await engine.validate(research, direction);
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
