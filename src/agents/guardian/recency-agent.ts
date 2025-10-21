import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchBlitzOutput } from '../../types/evolution-types.js';
import type { RecencyOutput } from '../../types/guardian-types.js';

function parseYear(text: string): number | undefined {
  const m = text.match(/\b(20\d{2}|19\d{2})\b/);
  if (m) return Number(m[1]);
  return undefined;
}

export class RecencyAgent implements IAgent {
  public readonly name = 'guardian.recency';
  public readonly metadata = {
    description: 'Check recency of sources (heuristic year extraction) and compute recent ratio',
    version: '1.0.0',
    inputs: ['evolution.research-blitz'],
    outputs: ['recentRatio'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<RecencyOutput>> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      if (!research) return { success: false, data: null, error: 'Missing dependency: evolution.research-blitz' };

      const sources = (research.sources || []) as string[];
      const currentYear = new Date().getFullYear();
      const threshold = currentYear - 3;
      const items = sources.slice(0, 50).map(s => {
        const y = parseYear(s);
        return { source: s, year: y, isRecent: y ? y >= threshold : undefined };
      });

      const withYear = items.filter(i => typeof i.year === 'number');
      const recent = withYear.filter(i => i.isRecent);
      const denom = withYear.length || 1;
      const recentRatio = recent.length / denom;

      return {
        success: true,
        data: {
          brandName: context.brandName,
          generatedAt: new Date().toISOString(),
          items,
          recentRatio,
          thresholdYear: threshold,
        },
      };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

