// Presentation module types - HTML generation and formatting

export interface HTMLGenerationOptions {
  title?: string;
  theme?: 'light' | 'dark' | 'professional';
  includeTOC?: boolean;
  includeMetadata?: boolean;
  customCSS?: string;
}

export interface HTMLDocument {
  html: string;
  metadata: {
    generatedAt: string;
    brandName: string;
    format: 'html';
    theme: string;
  };
}

export interface NarrativeAct {
  actNumber: number;
  title: string;
  description: string;
  documents: NarrativeDocument[];
}

export interface NarrativeDocument {
  id: string;
  title: string;
  section: string;
  content: string;
  order: number;
}

export interface NarrativeStructure {
  brandName: string;
  title: string;
  subtitle?: string;
  acts: NarrativeAct[];
  metadata: {
    totalDocuments: number;
    totalWords: number;
    generatedAt: string;
  };
}

export interface AgencyBrief {
  brandName: string;
  brandIdentity: {
    purpose: string;
    mission: string;
    vision: string;
    values: string[];
  };
  visualIdentity: {
    personalityTraits: string[];
    voiceAndTone: {
      voice: string;
      toneAttributes: string[];
    };
    colorDirection?: string;
    typographyDirection?: string;
    imageryDirection?: string;
  };
  brandRequirements: {
    logoRequirements?: string[];
    packagingRequirements?: string[];
    websiteRequirements?: string[];
    marketingMaterialRequirements?: string[];
  };
  messaging: {
    positioning: string;
    keyMessages: string[];
    differentiators: string[];
  };
  targetAudience?: string;
}
