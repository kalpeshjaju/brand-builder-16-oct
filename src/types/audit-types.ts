// Quality audit and validation types

import type { BrandStrategy } from './brand-types.js';
import type { Severity, Priority, SourceTier, VerifiedSource } from './common-types.js';

export interface AuditOptions {
  mode?: 'quick' | 'standard' | 'comprehensive';
  enableWebSearch?: boolean;
  minSourceQuality?: SourceTier;
  minSources?: number;
  checkRecency?: boolean;
  maxDataAge?: number; // days
  outputFormat?: 'json' | 'markdown' | 'html' | 'pdf' | 'both';
}

export interface ScoreDimension {
  score: number; // 0-10
  weight: number; // 0-1
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  details: string;
}

export interface AuditFinding {
  severity: Severity;
  category: 'sources' | 'facts' | 'recency' | 'verification' | 'quality';
  message: string;
  location?: string;
  details?: string;
}

export interface Recommendation {
  priority: Priority;
  action: string;
  estimatedEffort: string;
  impact: string;
}

export interface ImprovementPlan {
  currentScore: number;
  targetScore: number;
  steps: {
    step: number;
    action: string;
    expectedImprovement: number;
    estimatedTime: string;
  }[];
  totalEffort: string;
  requiredExpertise: string;
}

export interface AuditResult {
  brandName: string;
  auditDate: string;
  overallScore: number;
  scoreBreakdown: {
    sourceQuality: ScoreDimension;
    factVerification: ScoreDimension;
    dataRecency: ScoreDimension;
    crossVerification: ScoreDimension;
    productionReadiness: ScoreDimension;
  };
  findings: AuditFinding[];
  recommendations: Recommendation[];
  qualityImprovement: ImprovementPlan;
}

export interface SourceVerification {
  claim: string;
  verified: boolean;
  sources: VerifiedSource[];
  confidence: number;
  issues?: string[];
}

// Enhanced audit types

export interface FactTriple {
  subject: string;
  predicate: string;
  value: string | number;
  confidence: number;
  sourceText: string;
  type: 'numeric' | 'categorical' | 'comparative' | 'temporal';
  evidence?: import('./common-types.js').EvidencePointer;
}

export interface EnhancedAuditResult extends AuditResult {
  factAnalysis?: {
    extractedTriples: FactTriple[];
    extractionRate: number;
    highPriorityFacts: FactTriple[];
  };
  varianceAnalysis?: {
    totalClaims: number;
    flaggedClaims: number;
    averageVariance: number;
  };
  sourceAnalysis?: {
    averageTier: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
  };
}

export type { BrandStrategy };
