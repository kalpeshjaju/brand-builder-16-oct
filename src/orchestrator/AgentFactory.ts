import type { IAgent } from '../agents/IAgent.js';
import { ResearchBlitzAgent } from '../agents/evolution/research-blitz-agent.js';
import { PatternPresentationAgent } from '../agents/evolution/pattern-presentation-agent.js';
import { CreativeDirectionAgent } from '../agents/evolution/creative-direction-agent.js';
import { ValidationAgent } from '../agents/evolution/validation-agent.js';
import { BuildOutAgent } from '../agents/evolution/build-out-agent.js';
import { NarrativeAgent } from '../agents/docs/narrative-agent.js';
import { TeardownAgent } from '../agents/docs/teardown-agent.js';
import { ResearchTopicsAgent } from '../agents/genesis/research-topics-agent.js';
import { DeliverablesBundleAgent } from '../agents/genesis/deliverables-bundle-agent.js';
import { GuardianGatesAgent } from '../agents/guardian/gates-agent.js';
import { SourceQualityAgent } from '../agents/guardian/source-quality-agent.js';
import { RecencyAgent } from '../agents/guardian/recency-agent.js';
import { ReadinessAgent } from '../agents/guardian/readiness-agent.js';
import { NumericVarianceAgent } from '../agents/guardian/numeric-variance-agent.js';
import { CrossVerifyAgent } from '../agents/guardian/cross-verify-agent.js';
import { ProductCatalogAgent } from '../agents/docs/product-catalog-agent.js';
import { PricingGuideAgent } from '../agents/docs/pricing-guide-agent.js';
import { CorporateCatalogAgent } from '../agents/docs/corporate-catalog-agent.js';
import { TrainingGuideAgent } from '../agents/docs/training-guide-agent.js';
import { AssetMapAgent } from '../agents/docs/asset-map-agent.js';
import { OracleContextAgent } from '../agents/oracle/context-agent.js';

const REGISTRY: Record<string, () => IAgent> = {
  'evolution.research-blitz': () => new ResearchBlitzAgent(),
  'evolution.pattern-presentation': () => new PatternPresentationAgent(),
  'evolution.creative-direction': () => new CreativeDirectionAgent(),
  'evolution.validation': () => new ValidationAgent(),
  'evolution.build-out': () => new BuildOutAgent(),
  'docs.narrative': () => new NarrativeAgent(),
  'docs.teardown': () => new TeardownAgent(),
  'genesis.research-topics': () => new ResearchTopicsAgent(),
  'genesis.deliverables-bundle': () => new DeliverablesBundleAgent(),
  'guardian.gates': () => new GuardianGatesAgent(),
  'guardian.source-quality': () => new SourceQualityAgent(),
  'guardian.recency': () => new RecencyAgent(),
  'guardian.readiness': () => new ReadinessAgent(),
  'guardian.numeric-variance': () => new NumericVarianceAgent(),
  'guardian.cross-verify': () => new CrossVerifyAgent(),
  'docs.product-catalog': () => new ProductCatalogAgent(),
  'docs.pricing-guide': () => new PricingGuideAgent(),
  'docs.corporate-catalog': () => new CorporateCatalogAgent(),
  'docs.training-guide': () => new TrainingGuideAgent(),
  'docs.asset-map': () => new AssetMapAgent(),
  'oracle.context': () => new OracleContextAgent(),
};

export class AgentFactory {
  static create(name: string): IAgent | null {
    const ctor = REGISTRY[name];
    return ctor ? ctor() : null;
  }

  static listNames(): string[] {
    return Object.keys(REGISTRY);
  }

  static getMetadata(name: string): { name: string; metadata?: IAgent['metadata'] } | null {
    const agent = this.create(name);
    if (!agent) return null;
    return { name: agent.name, metadata: agent.metadata };
  }
}
