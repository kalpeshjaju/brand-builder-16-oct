import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { BuildOutOutput } from '../../types/evolution-types.js';

export interface NumericVarianceItem {
  metric: string;
  baseline?: number;
  target?: number;
  variance?: number; // abs(target - baseline) / baseline
}

export interface NumericVarianceOutput {
  brandName: string;
  generatedAt: string;
  threshold: number; // allowed relative variance for sanity (e.g., 5x changes flagged)
  items: NumericVarianceItem[];
  flagged: NumericVarianceItem[];
}

export class NumericVarianceAgent implements IAgent {
  public readonly name = 'guardian.numeric-variance';
  public readonly metadata = {
    description: 'Check numeric variance in success metrics for sanity (flags extreme jumps)',
    version: '1.0.0',
    inputs: ['evolution.build-out'],
    outputs: ['flagged'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<NumericVarianceOutput>> {
    try {
      const buildout = context.results['evolution.build-out'] as BuildOutOutput | undefined;
      if (!buildout) return { success: false, data: null, error: 'Missing dependency: evolution.build-out' };

      const threshold = 4.0; // flag if target ≥ baseline*5 (variance ≥ 4.0)
      const items: NumericVarianceItem[] = [];
      const flagged: NumericVarianceItem[] = [];

      for (const m of buildout.successMetrics || []) {
        const baseNum = this.parseNumber(m.baseline);
        const targetNum = this.parseNumber(m.target);
        if (baseNum !== undefined && targetNum !== undefined && baseNum > 0) {
          const variance = Math.abs(targetNum - baseNum) / baseNum;
          const item: NumericVarianceItem = { metric: m.metric, baseline: baseNum, target: targetNum, variance };
          items.push(item);
          if (variance >= threshold) flagged.push(item);
        }
      }

      return {
        success: true,
        data: {
          brandName: context.brandName,
          generatedAt: new Date().toISOString(),
          threshold,
          items,
          flagged,
        },
      };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private parseNumber(text?: string): number | undefined {
    if (!text) return undefined;
    const m = String(text).match(/\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : undefined;
  }
}

