// Common types used across all modules

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';
export type ConfidenceScore = number; // 0-10 scale

export type Severity = 'critical' | 'warning' | 'info' | 'success';
export type Priority = 'high' | 'medium' | 'low';
export type Status = 'not-started' | 'in-progress' | 'completed' | 'blocked';

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'unknown';

export interface Timestamp {
  created: string;
  updated: string;
}

export interface SourcedClaim {
  claim: string;
  source?: string;
  sourceUrl?: string;
  confidence: ConfidenceLevel;
  dateAccessed?: string;
  verificationNotes?: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  tier?: SourceTier;
  score?: number;
  ageInDays?: number;
  isRecent?: boolean;
  reasoning?: string;
}

export interface VerifiedSource extends ResearchSource {
  tier: SourceTier;
  score: number;
  isRecent: boolean;
  reasoning: string;
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
  seed?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence?: ConfidenceLevel;
}
