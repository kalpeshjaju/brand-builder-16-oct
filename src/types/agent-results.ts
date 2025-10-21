import type {
  ResearchBlitzOutput,
  PatternPresentationOutput,
  CreativeDirectionOutput,
  ValidationOutput,
  BuildOutOutput,
} from './evolution-types.js';
import type { NarrativePackage, TeardownSWOT, ProductCatalog, PricingGuide, CorporateCatalog, TrainingGuide, AssetMap } from './docs-types.js';
import type { OracleContextOutput } from './oracle-types.js';

export type AgentName =
  | 'evolution.research-blitz'
  | 'evolution.pattern-presentation'
  | 'evolution.creative-direction'
  | 'evolution.validation'
  | 'evolution.build-out'
  | 'docs.narrative'
  | 'docs.teardown'
  | 'docs.product-catalog'
  | 'docs.pricing-guide'
  | 'docs.corporate-catalog'
  | 'docs.training-guide'
  | 'docs.asset-map'
  | 'guardian.gates'
  | 'guardian.source-quality'
  | 'guardian.recency'
  | 'guardian.readiness'
  | 'oracle.context';

export type AgentResultMap = {
  'evolution.research-blitz': ResearchBlitzOutput;
  'evolution.pattern-presentation': PatternPresentationOutput;
  'evolution.creative-direction': CreativeDirectionOutput;
  'evolution.validation': ValidationOutput;
  'evolution.build-out': BuildOutOutput;
  'docs.narrative': NarrativePackage;
  'docs.teardown': TeardownSWOT;
  'docs.product-catalog': ProductCatalog;
  'docs.pricing-guide': PricingGuide;
  'docs.corporate-catalog': CorporateCatalog;
  'docs.training-guide': TrainingGuide;
  'docs.asset-map': AssetMap;
  'guardian.gates': any;
  'guardian.source-quality': any;
  'guardian.recency': any;
  'guardian.readiness': any;
  'oracle.context': OracleContextOutput;
};
