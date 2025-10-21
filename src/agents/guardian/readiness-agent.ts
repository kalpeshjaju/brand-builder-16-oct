import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ValidationOutput, BuildOutOutput } from '../../types/evolution-types.js';
import type { ReadinessOutput } from '../../types/guardian-types.js';

export class ReadinessAgent implements IAgent {
  public readonly name = 'guardian.readiness';
  public readonly metadata = {
    description: 'Check presence of required sections before packaging (positioning, messaging, roadmap)',
    version: '1.0.0',
    inputs: ['evolution.validation', 'evolution.build-out'],
    outputs: ['ready'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<ReadinessOutput>> {
    try {
      const validation = context.results['evolution.validation'] as ValidationOutput | undefined;
      const buildout = context.results['evolution.build-out'] as BuildOutOutput | undefined;
      const sections = [] as Array<{ name: string; present: boolean; details?: string }>;

      const hasPositioning = !!buildout?.positioningFramework?.statement;
      sections.push({ name: 'Positioning', present: hasPositioning, details: buildout?.positioningFramework?.statement });
      const hasMessaging = (buildout?.messagingArchitecture?.keyMessages || []).length > 0;
      sections.push({ name: 'Messaging', present: hasMessaging, details: (buildout?.messagingArchitecture?.tagline || '') });
      const hasRoadmap = (buildout?.implementationRoadmap || []).length > 0;
      sections.push({ name: 'Implementation Roadmap', present: hasRoadmap, details: String((buildout?.implementationRoadmap || []).length) });
      const hasConfidence = typeof validation?.overallConfidence === 'number';
      sections.push({ name: 'Validation Confidence', present: hasConfidence, details: hasConfidence ? String((validation!.overallConfidence*10).toFixed(1)) : '' });

      const ready = sections.every(s => s.present);

      return {
        success: true,
        data: {
          brandName: context.brandName,
          generatedAt: new Date().toISOString(),
          sections,
          ready,
        },
      };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

