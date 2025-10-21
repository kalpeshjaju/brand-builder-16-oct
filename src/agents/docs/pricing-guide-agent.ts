import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { PricingGuide } from '../../types/docs-types.js';

export class PricingGuideAgent implements IAgent {
  public readonly name = 'docs.pricing-guide';
  public readonly metadata = {
    description: 'Generate pricing guide skeleton (categories, sizes, MRP)',
    version: '1.0.0',
    inputs: [],
    outputs: ['entries'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<PricingGuide>> {
    try {
      let entries = [
        {
          category: 'Dates',
          product: 'Medjoul Dates',
          sizes: [
            { size: '250g', mrp: 499, currency: 'INR' },
            { size: '500g', mrp: 899, currency: 'INR' },
          ],
        },
        {
          category: 'Nuts',
          product: 'Macadamia Nuts',
          sizes: [
            { size: '200g', mrp: 699, currency: 'INR' },
            { size: '400g', mrp: 1299, currency: 'INR' },
          ],
        },
      ];
      // Merge with workspace JSON if present
      try {
        const { FileSystemUtils } = await import('../../utils/file-system.js');
        const path = (await import('path')).default;
        const ws = FileSystemUtils.getBrandWorkspacePath(context.brandName);
        const p = path.join(ws, 'data', 'pricing-guide.json');
        const exists = await FileSystemUtils.fileExists(p);
        if (exists) {
          const external = await FileSystemUtils.readJSON<any>(p);
          if (Array.isArray(external?.entries)) entries = external.entries;
        }
      } catch {}

      const data: PricingGuide = {
        brandName: context.brandName,
        generatedAt: new Date().toISOString(),
        entries,
        notes: ['Prices are placeholders; merge with real catalog during ingestion.'],
      };
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
