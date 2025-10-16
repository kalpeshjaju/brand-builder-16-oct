// Project tracking and management types

import type { Status } from './common-types.js';

export interface Deliverable {
  name: string;
  status: Status;
  assignee?: string;
  dueDate?: string;
  completedDate?: string;
  notes: string[];
  dependencies: string[];
  progress?: number;
}

export interface Phase {
  number: number;
  name: string;
  duration: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  deliverables: Deliverable[];
  milestones: string[];
  risks: string[];
  progress: number;
}

export interface ProjectStatus {
  project: {
    name: string;
    brandName: string;
    startDate: string;
    totalDuration: string;
    currentPhase: string;
    overallStatus: Status;
  };
  phases: Record<string, Phase>;
  metrics: {
    timeline: {
      plannedStartDate: string;
      actualStartDate: string;
      plannedEndDate: string | null;
      actualEndDate: string | null;
      daysElapsed: number;
    };
    deliverables: {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      completionRate: number;
    };
    phases: {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
    };
  };
  lastUpdated: string;
}

export interface ProjectTimeline {
  totalDuration: string;
  phases: Array<{
    phase: number;
    name: string;
    duration: string;
  }>;
}
