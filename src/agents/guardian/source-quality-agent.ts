import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchBlitzOutput } from '../../types/evolution-types.js';
import type { SourceQualityOutput } from '../../types/guardian-types.js';

function tierForUrl(url: string): 1|2|3|4 {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.endsWith('.gov') || host.endsWith('.edu')) return 1;
    if (/reuters|bloomberg|wsj|harvard|hbr|gartner|forrester|ieee|acm/.test(host)) return 2;
    if (/medium|substack|wordpress|blogspot/.test(host)) return 3;
    return 4;
  } catch {
    return 4;
  }
}

export class SourceQualityAgent implements IAgent {
  public readonly name = 'guardian.source-quality';
  public readonly metadata = {
    description: 'Assess source quality by tiering URLs: Tier1 (.gov/.edu), Tier2 (reputable news/research), Tier3 (professional), Tier4 (low)',
    version: '1.0.0',
    inputs: ['evolution.research-blitz'],
    outputs: ['tiers', 'tier12Ratio'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<SourceQualityOutput>> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      if (!research) return { success: false, data: null, error: 'Missing dependency: evolution.research-blitz' };

      const sources = (research.sources || []).filter(Boolean);
      let t1=0,t2=0,t3=0,t4=0;
      const samples: Array<{ url: string; tier: 1|2|3|4 }> = [];
      for (const s of sources) {
        const tier = tierForUrl(s);
        if (tier===1) t1++; else if (tier===2) t2++; else if (tier===3) t3++; else t4++;
        if (samples.length < 12) samples.push({ url: s, tier });
      }
      const total = sources.length || 1;
      const tier12Ratio = (t1 + t2) / total;

      const data: SourceQualityOutput = {
        brandName: context.brandName,
        generatedAt: new Date().toISOString(),
        totalSources: sources.length,
        tiers: { tier1: t1, tier2: t2, tier3: t3, tier4: t4 },
        tier12Ratio,
        samples,
      };
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

