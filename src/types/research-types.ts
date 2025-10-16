// Research and findings types

import type { ConfidenceLevel, SourcedClaim, ResearchSource } from './common-types.js';
import type { Competitor, AudienceProfile, BrandDNA } from './brand-types.js';

export interface ResearchFinding {
  topic: string;
  content: string;
  sources: ResearchSource[];
  confidence?: number; // 0-10 scale
  timestamp?: string;
}

export interface IndustryTrend {
  trend: string;
  description: string;
  evidence: string[];
  sources: SourcedClaim[];
  confidence: ConfidenceLevel;
}

export interface MarketStatistic {
  statistic: string;
  value: string | number;
  source: SourcedClaim;
  context: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface IndustryResearchData {
  industry: string;
  marketSize?: MarketStatistic;
  growthRate?: MarketStatistic;
  trends: IndustryTrend[];
  keyPlayers: string[];
  sources: string[];
  researchDate: string;
}

export interface CompetitorAnalysisV2 {
  name: string;
  website: string;
  positioning: SourcedClaim;
  strengths: SourcedClaim[];
  weaknesses: SourcedClaim[];
  differentiationOpportunity: string;
  lastUpdated: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

export interface FactCheckResult {
  claim: string;
  isVerified: boolean;
  confidence: ConfidenceLevel;
  sources: SourcedClaim[];
  contradictions?: string[];
  recommendedAction: 'accept' | 'verify' | 'reject' | 'needs_review';
  notes: string;
}

export interface ResearchReport {
  marketInsights: {
    industryData: IndustryResearchData;
    competitorLandscape: CompetitorAnalysisV2[];
    marketOpportunities: SourcedClaim[];
    keyFindings: SourcedClaim[];
  };
  audienceProfile: AudienceProfile;
  brandDNA: BrandDNA;
  metadata: {
    researchDate: string;
    webResearchUsed: boolean;
    userDataProvided: boolean;
    overallConfidence: ConfidenceLevel;
    sources: string[];
  };
  synthesisNotes: string;
}

// Research Database types

export interface ResearchDatabase {
  brandName: string;
  findings: ResearchFinding[];
  metadata: {
    totalFindings: number;
    createdAt: string;
    lastUpdated: string;
  };
  index: {
    byTopic: Record<string, number[]>;
    bySource: Record<string, number[]>;
    byConfidence: Record<string, number[]>;
  };
}

export interface SearchOptions {
  keyword?: string;
  topic?: string;
  minConfidence?: number;
  limit?: number;
}
