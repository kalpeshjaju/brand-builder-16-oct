// Enhanced Quality Validation Types

import type { BrandStrategy } from './brand-types.js';

/**
 * Checkpoint severity levels
 */
export type CheckpointSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Checkpoint status
 */
export type CheckpointStatus = 'pass' | 'fail' | 'warning' | 'skipped';

/**
 * Fix tracking status
 */
export type FixStatus = 'identified' | 'in_progress' | 'resolved' | 'verified' | 'wont_fix';

/**
 * Single quality checkpoint
 */
export interface QualityCheckpoint {
  id: string;
  category: string;
  name: string;
  description: string;
  severity: CheckpointSeverity;
  validator: (strategy: BrandStrategy, context?: ValidationContext) => CheckpointResult;
}

/**
 * Checkpoint validation result
 */
export interface CheckpointResult {
  checkpointId: string;
  status: CheckpointStatus;
  score: number; // 0-100
  message: string;
  details?: string;
  suggestions?: string[];
  evidence?: string[];
}

/**
 * Validation context with additional data
 */
export interface ValidationContext {
  evolutionOutputs?: unknown;
  auditResults?: unknown;
  brandConfig?: unknown;
  sources?: Array<{ url: string; tier: number }>;
}

/**
 * Gap in strategy requiring attention
 */
export interface StrategyGap {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: CheckpointSeverity;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10, higher = more urgent
  relatedCheckpoints: string[];
  recommendations: string[];
}

/**
 * Quality fix to track
 */
export interface QualityFix {
  id: string;
  gapId: string;
  title: string;
  description: string;
  status: FixStatus;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  effort: 'low' | 'medium' | 'high';
  checkpoints: string[];
  notes: string[];
}

/**
 * Complete validation report
 */
export interface ValidationReport {
  brandName: string;
  validatedAt: string;
  overallScore: number; // 0-100
  checkpointResults: CheckpointResult[];
  gaps: StrategyGap[];
  fixes: QualityFix[];
  summary: {
    totalCheckpoints: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    criticalIssues: number;
    highPriorityIssues: number;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Checkpoint category definition
 */
export interface CheckpointCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // Importance weight for overall score
  checkpoints: QualityCheckpoint[];
}

/**
 * Fix log entry
 */
export interface FixLogEntry {
  timestamp: string;
  fixId: string;
  action: 'created' | 'updated' | 'status_changed' | 'note_added' | 'resolved' | 'verified';
  description: string;
  author?: string;
  metadata?: Record<string, unknown>;
}
