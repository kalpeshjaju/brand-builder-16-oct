import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchBlitzOutput, ValidationOutput } from '../../types/evolution-types.js';
import type { TeardownSWOT } from '../../types/docs-types.js';

export class TeardownAgent implements IAgent {
  public readonly name = 'docs.teardown';
  public readonly metadata = {
    description: 'Generate brand teardown & SWOT using research + validation artifacts',
    version: '1.0.0',
    inputs: ['evolution.research-blitz', 'evolution.validation'],
    outputs: ['strengths', 'weaknesses', 'opportunities', 'threats', 'score'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<TeardownSWOT>> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      const validation = context.results['evolution.validation'] as ValidationOutput | undefined;
      if (!research || !validation) {
        return { success: false, data: null, error: 'Missing dependencies: research or validation' };
      }

      const strengths = [
        `Customer praised aspects: ${(research.customerLanguage?.sentiment?.positive || []).slice(0,3).join(', ') || 'Quality perception'}`,
        `Positioning clarity: ${research.brandAudit?.positioning || 'TBD'}`,
      ];
      const weaknesses = [
        `Contradictions count: ${research.contradictions?.length || 0}`,
        ...(validation.alignmentCheck?.concerns || []).slice(0,3),
      ].filter(Boolean);
      const opportunities = research.marketGaps.slice(0,3).map(g => g.gap);
      const threats = research.competitors.slice(0,3).map(c => `${c.name}: ${c.positioning || 'Unknown'}`);
      const score = Math.round(((validation.overallConfidence || 0.6) * 10 + (validation.differentiationScore || 0.6) * 10) / 2);

      const pkg: TeardownSWOT = {
        brandName: context.brandName,
        generatedAt: new Date().toISOString(),
        strengths,
        weaknesses,
        opportunities,
        threats,
        score,
        summary: `Overall readiness score ${score}/10 with ${opportunities.length} opportunities identified`,
      };
      return { success: true, data: pkg };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

