// Evolution workflow configuration types (for non-interactive mode)

import type { DirectionDecision } from './evolution-types.js';

/**
 * Configuration for non-interactive creative direction capture
 * Replaces inquirer prompts with pre-defined inputs
 */
export interface CreativeDirectionConfig {
  brandName: string;

  // Part 1: Contradictions
  contradictions: Array<{
    patternId: string;
    action: 'explore' | 'note' | 'skip';
    direction?: string; // Required if action === 'explore'
  }>;

  // Part 2: White Space
  whiteSpace: Array<{
    gapId: string;
    decision: DirectionDecision;
    reasoning: string;
  }>;

  // Part 3: Creative Leaps
  creativeLeaps: Array<{
    idea: string;
    rationale: string;
  }>;

  // Part 4: Intuitions
  intuitions: Array<{
    observation: string;
    context: string;
    confidence: number; // 0.3, 0.5, 0.7, 0.9
  }>;

  // Part 5: Primary Direction
  primaryDirection: string;
  keyThemes: string[];
}

/**
 * Mode for creative director
 */
export type CreativeDirectorMode = 'interactive' | 'config';
