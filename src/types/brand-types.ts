// Brand configuration and strategy types

import type { SourcedClaim } from './common-types.js';

export interface CompanyProfile {
  founded: number;
  currentRevenue?: string;
  targetRevenue?: string;
  teamSize?: number;
  channels: string[];
  stores?: number;
  website?: string;
  employees?: number;
  headquarters?: string;
  geographicPresence?: string[];
  description?: string;
}

export interface ProjectObjectives {
  primary: string;
  goals: string[];
  timeline?: string;
  budget?: string;
  successMetrics?: string[];
}

export interface Competitor {
  name: string;
  category: string;
  positioning: string;
  website?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface BrandConfiguration {
  // Basic info (required)
  brandName: string;
  industry: string;
  category: string;

  // Company details (optional)
  companyProfile?: CompanyProfile;

  // Project details (required)
  projectObjectives: ProjectObjectives;

  // Research customization (optional)
  competitors?: Competitor[];
  targetAudience?: string[];
  marketSegments?: string[];
  brandChallenges?: string[];
  brandOpportunities?: string[];

  // Deliverables customization (optional)
  customDeliverables?: Record<string, string[]>;

  // Research topics customization (optional)
  customResearchTopics?: Record<string, string[]>;

  // Additional context
  additionalContext?: string;
}

export interface BrandStrategy {
  brandName?: string;
  purpose?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  positioning?: string;
  personality?: string[];
  voiceAndTone?: {
    voice: string;
    toneAttributes: string[];
  };
  keyMessages?: string[];
  differentiators?: string[];
  proofPoints?: ProofPoint[];
  [key: string]: unknown;
}

export interface ProofPoint {
  claim: string;
  evidence?: string | string[];
  source?: string;
  sourceUrl?: string;
  confidence?: number;
}

export interface BrandDNA {
  uniqueValueProposition: string;
  brandStory: string;
  coreStrengths: string[];
  brandHeritage?: string;
  founderStory?: string;
}

export interface AudienceProfile {
  personas: AudiencePersona[];
  painPoints: SourcedClaim[];
  desires: SourcedClaim[];
  decisionFactors: SourcedClaim[];
}

export interface AudiencePersona {
  name: string;
  description: string;
  demographics: {
    ageRange: string;
    incomeLevel: string;
    location: string[];
  };
  psychographics: {
    values: string[];
    interests: string[];
    lifestyle: string[];
  };
  painPoints: string[];
  goals: string[];
  buyingBehavior: string[];
}
