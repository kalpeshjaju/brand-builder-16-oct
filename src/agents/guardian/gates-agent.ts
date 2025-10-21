import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ResearchBlitzOutput, ValidationOutput } from '../../types/evolution-types.js';

export interface GateResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  reason: string;
}

export interface GuardianGatesOutput {
  brandName: string;
  generatedAt: string;
  overall: 'pass' | 'fail';
  score: number; // 0-100
  gates: GateResult[];
  recommendations: string[];
}

export class GuardianGatesAgent implements IAgent {
  public readonly name = 'guardian.gates';
  public readonly metadata = {
    description: 'Apply quality gates (confidence, contradictions, sources, readiness) to block low-quality outputs',
    version: '1.0.0',
    inputs: ['evolution.research-blitz', 'evolution.validation'],
    outputs: ['overall', 'gates', 'score'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<GuardianGatesOutput>> {
    try {
      const research = context.results['evolution.research-blitz'] as ResearchBlitzOutput | undefined;
      const validation = context.results['evolution.validation'] as ValidationOutput | undefined;
      if (!research || !validation) {
        return { success: false, data: null, error: 'Missing dependencies: research or validation' };
      }

      // Thresholds (can move to config/constants if needed)
      const minConfidence = 0.65; // overall confidence
      const maxContradictions = 8; // too many contradictions may indicate instability
      const minTier12Ratio = 0.4; // heuristic based on URL domains

      // Gate 1: Confidence threshold
      const g1: GateResult = validation.overallConfidence >= minConfidence
        ? { name: 'ConfidenceThreshold', status: 'pass', reason: `Confidence ${(validation.overallConfidence*10).toFixed(1)}/10 ≥ ${(minConfidence*10).toFixed(1)}/10` }
        : { name: 'ConfidenceThreshold', status: 'fail', reason: `Confidence ${(validation.overallConfidence*10).toFixed(1)}/10 < ${(minConfidence*10).toFixed(1)}/10` };

      // Gate 2: Contradiction sanity
      const contradictionsCount = (research.contradictions || []).length;
      const g2: GateResult = contradictionsCount <= maxContradictions
        ? { name: 'ContradictionSanity', status: contradictionsCount <= maxContradictions/2 ? 'pass' : 'warn', reason: `${contradictionsCount} contradictions (threshold ${maxContradictions})` }
        : { name: 'ContradictionSanity', status: 'fail', reason: `${contradictionsCount} contradictions > threshold ${maxContradictions}` };

      // Gate 3: Source quality heuristic based on domain tiering
      const sources = (research.sources || []) as string[];
      const tier1 = sources.filter(u => /\.(gov|edu)(\/|$)/i.test(u)).length;
      const tier2 = sources.filter(u => /(reuters|bloomberg|wsj|hbr|harvard|gartner|forrester)/i.test(u)).length;
      const total = sources.length || 1;
      const tier12ratio = (tier1 + tier2) / total;
      const g3: GateResult = tier12ratio >= minTier12Ratio
        ? { name: 'SourceQuality', status: tier12ratio >= (minTier12Ratio*1.5) ? 'pass' : 'warn', reason: `Tier1/2 ratio ${(tier12ratio*100).toFixed(0)}%` }
        : { name: 'SourceQuality', status: 'fail', reason: `Tier1/2 ratio ${(tier12ratio*100).toFixed(0)}% < ${(minTier12Ratio*100).toFixed(0)}%` };

      // Gate 4: Readiness check (presence of key sections)
      const hasPositioning = !!validation && typeof validation.differentiationScore === 'number';
      const hasMessaging = true; // will be refined when messaging is required earlier
      const ready = hasPositioning && hasMessaging;
      const g4: GateResult = ready
        ? { name: 'Readiness', status: 'pass', reason: 'Required sections present' }
        : { name: 'Readiness', status: 'fail', reason: 'Missing required sections' };

      const gates = [g1, g2, g3, g4];
      const numeric = gates.map(g => g.status === 'pass' ? 1 : g.status === 'warn' ? 0.7 : 0).reduce((a,b)=>a+b,0) / gates.length;
      const score = Math.round(numeric * 100);
      const overall: 'pass' | 'fail' = gates.some(g => g.status === 'fail') ? 'fail' : 'pass';

      const recommendations: string[] = [];
      if (g1.status === 'fail') recommendations.push('Improve overall confidence via validation or refine direction.');
      if (g2.status !== 'pass') recommendations.push('Address key contradictions in direction/build-out before proceeding.');
      if (g3.status !== 'pass') recommendations.push('Add Tier1/2 sources or cite stronger evidence.');
      if (g4.status === 'fail') recommendations.push('Ensure positioning/messaging sections are present and complete.');

      const output: GuardianGatesOutput = {
        brandName: context.brandName,
        generatedAt: new Date().toISOString(),
        overall,
        score,
        gates,
        recommendations,
      };

      return { success: true, data: output };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

