/**
 * Genesis Module Type Definitions
 * Types from Horizon Brand Builder for strategy generation
 */

/**
 * Brand configuration for initializing the genesis system
 */
export interface BrandConfiguration {
  brandName: string;
  industry: string;
  category: string;
  companyProfile?: {
    founded?: number;
    currentRevenue?: string;
    channels?: string[];
    employees?: number;
    locations?: string[];
    mission?: string;
    vision?: string;
  };
  projectObjectives?: {
    primary: string;
    goals: string[];
    timeline?: string;
    budget?: string;
  };
  competitors?: Competitor[];
  customDeliverables?: Record<string, string[]>;
  customResearchTopics?: any;
}

/**
 * Competitor information
 */
export interface Competitor {
  name: string;
  type: 'direct' | 'indirect' | 'aspirational';
  website?: string;
  strengths?: string[];
  weaknesses?: string[];
  positioning?: string;
}

/**
 * Research topic structure
 */
export interface ResearchTopic {
  id: string;
  name: string;
  subtopics: string[];
}

/**
 * Research phase structure
 */
export interface ResearchPhase {
  name: string;
  topics: ResearchTopic[];
}

/**
 * Complete research topics framework
 */
export interface ResearchTopicsFramework {
  phase1: ResearchPhase;
  phase2: ResearchPhase;
  phase3: ResearchPhase;
  phase4: ResearchPhase;
}

/**
 * Project timeline structure
 */
export interface ProjectTimeline {
  totalDuration: string;
  phases: Array<{
    phase: number;
    name: string;
    duration: string;
  }>;
}

/**
 * Deliverable status
 */
export interface DeliverableStatus {
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  completedDate?: string;
  notes?: string;
}

/**
 * Phase status
 */
export interface PhaseStatus {
  phase: number;
  name: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startDate?: string;
  endDate?: string;
  deliverables: Record<string, DeliverableStatus>;
  milestones?: Milestone[];
  risks?: Risk[];
}

/**
 * Project milestone
 */
export interface Milestone {
  name: string;
  targetDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
}

/**
 * Project risk
 */
export interface Risk {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
  status: 'open' | 'mitigated' | 'closed';
}

/**
 * Complete project status
 */
export interface ProjectStatus {
  brandName: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  currentPhase: number;
  overallProgress: number;
  phases: Record<string, PhaseStatus>;
  timeline: ProjectTimeline;
  team?: TeamMember[];
}

/**
 * Team member information
 */
export interface TeamMember {
  name: string;
  role: string;
  email?: string;
  responsibilities?: string[];
}

/**
 * Research finding from database
 */
export interface ResearchFinding {
  id: string;
  topic: string;
  subtopic?: string;
  finding: string;
  source?: ResearchSource;
  confidence: number; // 0-10
  verificationStatus?: 'unverified' | 'partial' | 'verified' | 'disputed';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Research source information
 */
export interface ResearchSource {
  name: string;
  url?: string;
  type: 'primary' | 'secondary' | 'tertiary';
  credibilityTier: 1 | 2 | 3 | 4; // 1 = highest (academic), 4 = lowest (blogs)
  publicationDate?: string;
  author?: string;
}

/**
 * Research database statistics
 */
export interface ResearchStats {
  totalFindings: number;
  byTopic: Record<string, number>;
  byConfidence: Record<number, number>;
  bySource: Record<string, number>;
  averageConfidence: number;
  verifiedCount: number;
  lastUpdated: string;
}