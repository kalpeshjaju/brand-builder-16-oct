import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import { RetrievalEngine } from '../../oracle/retrieval-engine.js';
import type { OracleContextOutput, OracleContextItem } from '../../types/oracle-types.js';

export class OracleContextAgent implements IAgent {
  public readonly name = 'oracle.context';
  public readonly metadata = {
    description: 'Retrieve semantic context for key queries using ORACLE (when enabled)',
    version: '1.0.0',
    inputs: [],
    outputs: ['items'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<OracleContextOutput>> {
    try {
      if (!context.useOracle) {
        return { success: true, data: { brandName: context.brandName, generatedAt: new Date().toISOString(), items: [] } };
      }
      const engine = new RetrievalEngine();
      const queries = [
        'brand positioning',
        'pricing and offers',
        'product catalog',
        'about us',
        'customer reviews'
      ];
      const items: OracleContextItem[] = [];
      for (const q of queries) {
        const res = await engine.retrieve(q, 3);
        const snippets = (res || []).map((r: any) => String((r.documents?.[0]?.[0]) ?? '')).filter(Boolean);
        items.push({ query: q, snippets });
      }
      engine.close();
      return { success: true, data: { brandName: context.brandName, generatedAt: new Date().toISOString(), items } };
    } catch (error) {
      // Graceful fallback if ORACLE not available
      return { success: true, data: { brandName: context.brandName, generatedAt: new Date().toISOString(), items: [] } };
    }
  }
}
