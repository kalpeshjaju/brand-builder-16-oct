import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import { ResearchBlitz } from '../../evolution/research-blitz.js';
import type { OracleContextOutput } from '../../types/oracle-types.js';

export class ResearchBlitzAgent implements IAgent {
  public readonly name = 'evolution.research-blitz';
  public readonly metadata = {
    description: 'Phase 1: Fetch and analyze brand + competitors to produce research findings',
    version: '1.0.0',
    inputs: [],
    outputs: ['brandAudit', 'competitors', 'marketGaps', 'contradictions', 'customerLanguage', 'culturalContext'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult> {
    try {
      let oracleSnippets: string[] | undefined;
      const oc = context.results['oracle.context'] as OracleContextOutput | undefined;
      if (oc?.items?.length) {
        oracleSnippets = oc.items.flatMap(i => i.snippets).filter(Boolean).slice(0, 5);
      }

      const blitz = new ResearchBlitz({
        brandName: context.brandName,
        brandUrl: context.brandUrl,
        competitorUrls: context.competitorUrls ?? [],
        oracleSnippets,
      });

      const data = await blitz.execute();
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
