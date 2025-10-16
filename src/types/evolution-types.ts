/**
 * Evolution Module Types
 *
 * Type definitions for the Brand Evolution Workshop workflow
 * Enables human-AI collaboration for brand evolution strategy
 */

// Phase 1: Research Blitz Types

export interface BrandAudit {
  positioning: string;
  visualIdentity: {
    colors: string[];
    typography: string[];
    imagery: string[];
  };
  messaging: {
    tagline: string;
    keyMessages: string[];
    tone: string;
  };
  uxFindings: string[];
  currentState: string;
}

export interface CompetitorAnalysis {
  name: string;
  url: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
  pricing: string;
  channels: string[];
}

export interface MarketGap {
  gap: string;
  description: string;
  evidence: string[];
  opportunitySize: 'small' | 'medium' | 'large';
  confidence: number;
}

export interface Contradiction {
  what: string;
  evidence: string;
  implication: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CustomerLanguage {
  patterns: Array<{
    phrase: string;
    frequency: number;
    context: string;
  }>;
  sentiment: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  painPoints: string[];
  desires: string[];
}

export interface CulturalContext {
  trend: string;
  description: string;
  relevance: string;
  source: string;
  date: string;
}

export interface ResearchBlitzOutput {
  brandName: string;
  brandUrl: string;
  generatedAt: string;
  brandAudit: BrandAudit;
  competitors: CompetitorAnalysis[];
  marketGaps: MarketGap[];
  contradictions: Contradiction[];
  customerLanguage: CustomerLanguage;
  culturalContext: CulturalContext[];
  confidence: number;
  sources: string[];
}

// Phase 2: Pattern Presentation Types

export interface ContradictionPattern {
  id: string;
  brandSays: string;
  evidenceShows: string;
  implication: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WhiteSpace {
  id: string;
  description: string;
  competitorFocus: string;
  untappedOpportunity: string;
  evidence: string[];
}

export interface LanguageGap {
  customersSay: string;
  brandSays: string;
  gap: string;
  examples: string[];
}

export interface PositioningMap {
  axis1: { name: string; low: string; high: string };
  axis2: { name: string; low: string; high: string };
  brands: Array<{
    name: string;
    position: { x: number; y: number };
  }>;
}

export interface InflectionPoint {
  type: 'market_shift' | 'trend' | 'technology' | 'consumer_behavior';
  description: string;
  timing: 'current' | 'emerging' | 'future';
  impact: 'low' | 'medium' | 'high';
  evidence: string[];
}

export interface PatternPresentationOutput {
  brandName: string;
  generatedAt: string;
  contradictions: ContradictionPattern[];
  whiteSpace: WhiteSpace[];
  languageGaps: LanguageGap[];
  positioningMap: PositioningMap;
  inflectionPoints: InflectionPoint[];
}

// Phase 3: Creative Direction Types

export type DirectionDecision = 'pursue' | 'explore' | 'skip' | 'note';

export interface SelectedContradiction {
  patternId: string;
  pattern: string;
  direction: string;
  reasoning: string;
}

export interface WhiteSpaceDecision {
  gapId: string;
  gap: string;
  decision: DirectionDecision;
  reasoning: string;
}

export interface CreativeLeap {
  idea: string;
  rationale: string;
  relatedPatterns: string[];
}

export interface Intuition {
  observation: string;
  context: string;
  confidence: number;
}

export interface CreativeDirectionOutput {
  brandName: string;
  generatedAt: string;
  selectedContradictions: SelectedContradiction[];
  whiteSpaceDecisions: WhiteSpaceDecision[];
  creativeLeaps: CreativeLeap[];
  intuitions: Intuition[];
  primaryDirection: string;
  keyThemes: string[];
}

// Phase 4: Validation Engine Types

export interface AlignmentCheck {
  score: number;
  evidence: string[];
  concerns: string[];
  brandDnaFactors: string[];
}

export interface EvidenceAssessment {
  supportingEvidence: Array<{
    source: string;
    finding: string;
    confidence: number;
  }>;
  contradictingEvidence: Array<{
    source: string;
    finding: string;
    confidence: number;
  }>;
  netConfidence: number;
}

export interface Risk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
  impact: string;
}

export interface FeasibilityCheck {
  canDeliver: boolean;
  requirements: string[];
  gaps: string[];
  timeline: string;
  resources: string[];
}

export interface MarketViability {
  score: number;
  targetSegment: string;
  segmentSize: string;
  resonanceFactors: string[];
  barriers: string[];
}

export interface ValidationOutput {
  brandName: string;
  direction: string;
  generatedAt: string;
  alignmentCheck: AlignmentCheck;
  evidenceAssessment: EvidenceAssessment;
  riskAnalysis: Risk[];
  feasibilityCheck: FeasibilityCheck;
  marketViability: MarketViability;
  differentiationScore: number;
  overallConfidence: number;
  recommendation: 'proceed' | 'modify' | 'reconsider';
  modifications: string[];
}

// Phase 5: Build-Out Types

export interface PositioningFramework {
  statement: string;
  targetAudience: string;
  categoryFrame: string;
  pointOfDifference: string;
  reasonToBelieve: string[];
}

export interface MessagingArchitecture {
  brandEssence: string;
  tagline: string;
  keyMessages: string[];
  proofPoints: Array<{
    claim: string;
    evidence: string;
  }>;
  toneOfVoice: string[];
}

export interface ContentExample {
  type: string;
  title: string;
  content: string;
  context: string;
}

export interface VisualDirection {
  colorPalette: string[];
  typography: string[];
  imagery: string[];
  designPrinciples: string[];
}

export interface ChannelStrategy {
  channel: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  tactics: string[];
  kpis: string[];
}

export interface ImplementationPhase {
  phase: string;
  duration: string;
  deliverables: string[];
  dependencies: string[];
}

export interface SuccessMetric {
  metric: string;
  baseline: string;
  target: string;
  timeline: string;
  measurement: string;
}

export interface BuildOutOutput {
  brandName: string;
  generatedAt: string;
  executiveSummary: string;
  positioningFramework: PositioningFramework;
  messagingArchitecture: MessagingArchitecture;
  contentExamples: ContentExample[];
  visualDirection: VisualDirection;
  channelStrategy: ChannelStrategy[];
  implementationRoadmap: ImplementationPhase[];
  successMetrics: SuccessMetric[];
  evidenceTrail: string[];
}

// Workflow State Management

export type EvolutionPhase = 'research' | 'patterns' | 'direction' | 'validation' | 'buildout';

export interface EvolutionWorkflowState {
  brandName: string;
  brandUrl: string;
  currentPhase: EvolutionPhase;
  completedPhases: EvolutionPhase[];
  startedAt: string;
  lastUpdated: string;
  outputs: {
    research?: ResearchBlitzOutput;
    patterns?: PatternPresentationOutput;
    direction?: CreativeDirectionOutput;
    validation?: ValidationOutput;
    buildout?: BuildOutOutput;
  };
}

// CLI Interaction Types

export interface InteractivePrompt {
  type: 'select' | 'text' | 'confirm' | 'multiselect';
  message: string;
  choices?: Array<{ name: string; value: string }>;
  default?: string | boolean;
}

export interface PhaseProgress {
  phase: EvolutionPhase;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}
