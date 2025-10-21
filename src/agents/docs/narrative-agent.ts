import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { PatternPresentationOutput } from '../../types/evolution-types.js';
import type { NarrativePackage } from '../../types/docs-types.js';

export class NarrativeAgent implements IAgent {
  public readonly name = 'docs.narrative';
  public readonly metadata = {
    description: 'Generate ACT 1–6 narrative package (brand foundation to transformation)',
    version: '1.0.0',
    inputs: ['evolution.pattern-presentation', 'evolution.creative-direction', 'evolution.build-out'],
    outputs: ['toc', 'sections'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<NarrativePackage>> {
    try {
      const patterns = context.results['evolution.pattern-presentation'] as PatternPresentationOutput | undefined;
      const direction = context.results['evolution.creative-direction'] as any | undefined;
      const buildout = context.results['evolution.build-out'] as any | undefined;

      const now = new Date().toISOString();
      const toc = [
        { id: 'act1-who-we-are', title: 'ACT 1: Who We Are' },
        { id: 'act2-where-we-are', title: 'ACT 2: Where We Are Today' },
        { id: 'act3-what-we-discovered', title: 'ACT 3: What We Discovered' },
        { id: 'act4-where-we-should-go', title: 'ACT 4: Where We Should Go' },
        { id: 'act5-how-we-get-there', title: 'ACT 5: How We Get There' },
        { id: 'act6-what-we-need', title: 'ACT 6: What We Need' },
      ];

      const sections = [
        {
          id: 'act1-who-we-are',
          title: 'Who We Are',
          content: `Brand foundation overview for ${context.brandName}.`,
        },
        {
          id: 'act2-where-we-are',
          title: 'Where We Are Today',
          content: `Summary of current state derived from research.`,
        },
        {
          id: 'act3-what-we-discovered',
          title: 'What We Discovered',
          content: patterns ? `Contradictions: ${patterns.contradictions.length}, White Space: ${patterns.whiteSpace.length}` : 'Patterns not available',
        },
        {
          id: 'act4-where-we-should-go',
          title: 'Where We Should Go',
          content: direction ? `Primary Direction: ${direction.primaryDirection}` : 'Direction not available',
        },
        {
          id: 'act5-how-we-get-there',
          title: 'How We Get There',
          content: buildout ? `Key Steps: ${buildout.implementationRoadmap?.length || 0}` : 'Build-out not available',
        },
        {
          id: 'act6-what-we-need',
          title: 'What We Need',
          content: buildout ? `Resources: ${(buildout.implementationRoadmap?.[0]?.dependencies || []).join(', ')}` : 'Pending requirements',
        },
      ];

      const pkg: NarrativePackage = {
        brandName: context.brandName,
        generatedAt: now,
        toc,
        sections,
      };

      return { success: true, data: pkg };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

