import type { IAgent, IAgentContext, IAgentResult } from '../IAgent.js';
import type { ProductCatalog, ProductCatalogItem } from '../../types/docs-types.js';

export class ProductCatalogAgent implements IAgent {
  public readonly name = 'docs.product-catalog';
  public readonly metadata = {
    description: 'Generate product catalog skeleton (SKUs/specs) for refinement or ingestion merge',
    version: '1.0.0',
    inputs: [],
    outputs: ['items'],
  } as const;

  async execute(context: IAgentContext): Promise<IAgentResult<ProductCatalog>> {
    try {
      // Merge with workspace JSON if present
      const items: ProductCatalogItem[] = [
        {
          sku: 'CAT-001',
          name: 'Medjoul Dates',
          category: 'Dates',
          specs: { origin: 'Saudi', grade: 'Premium' } as Record<string, string>,
          nutrition: { energy: '277 kcal/100g' } as Record<string, string>,
          priceRange: '₹499–₹1299',
        },
        {
          sku: 'NUT-101',
          name: 'Macadamia Nuts',
          category: 'Nuts',
          specs: { origin: 'Australia', roast: 'Light' } as Record<string, string>,
          nutrition: { fat: '76 g/100g' } as Record<string, string>,
          priceRange: '₹699–₹1599',
        },
      ];
      let merged = items;
      try {
        const { FileSystemUtils } = await import('../../utils/file-system.js');
        const path = (await import('path')).default;
        const ws = FileSystemUtils.getBrandWorkspacePath(context.brandName);
        const p = path.join(ws, 'data', 'product-catalog.json');
        const exists = await FileSystemUtils.fileExists(p);
        if (exists) {
          const external = await FileSystemUtils.readJSON<any>(p);
          if (Array.isArray(external?.items)) merged = external.items;
        }
      } catch {}

      const data: ProductCatalog = {
        brandName: context.brandName,
        generatedAt: new Date().toISOString(),
        items: merged,
      };
      return { success: true, data };
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
