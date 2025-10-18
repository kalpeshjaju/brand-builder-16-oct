/**
 * Generic Project Tracker for Brand Builder Pro
 * Tracks 64 deliverables across 5 phases for ANY brand
 *
 * FROM: Horizon Brand Builder
 * ADAPTED FOR: brand-builder-16-oct structure (.brandos/<brand>/)
 */

import { FileSystemUtils } from '../utils/file-system.js';
import type {
  BrandConfiguration,
  ProjectStatus,
  Deliverable,
  Phase,
} from '../types/index.js';
import {
  customizeDeliverables,
  GENERIC_PROJECT_TIMELINE,
} from './config/deliverables-framework.js';
import {
  generateDashboard,
  exportDeliverablesList,
} from './project-tracker-dashboard.js';
export class ProjectTracker {
  private dataFile: string;
  private data: ProjectStatus | null;
  private brandConfig: BrandConfiguration;

  constructor(brandConfig: BrandConfiguration) {
    this.brandConfig = brandConfig;
    this.data = null;

    // Store in .brandos/<brand>/data/project-status.json
    this.dataFile = FileSystemUtils.getBrandDataPath(
      brandConfig.brandName,
      'project-status.json'
    );
  }

  /**
   * Initialize project tracker
   */
  async initialize(): Promise<void> {
    try {
      const dataDir = FileSystemUtils.getBrandDataPath(this.brandConfig.brandName);
      await FileSystemUtils.ensureDir(dataDir);

      // Try to load existing data
      try {
        this.data = await FileSystemUtils.readJSON<ProjectStatus>(this.dataFile);
      } catch {
        // Initialize new project
        this.data = this.createInitialStructure();
        await this.save();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to initialize project tracker at ${this.dataFile}\n` +
          `Reason: ${errorMessage}\n` +
          `Fix: Ensure you have write permissions for the directory and sufficient disk space.`
      );
    }
  }

  /**
   * Create initial project structure
   */
  private createInitialStructure(): ProjectStatus {
    const deliverables = customizeDeliverables(this.brandConfig);

    const structure: ProjectStatus = {
      project: {
        name: `${this.brandConfig.brandName} Brand Transformation`,
        brandName: this.brandConfig.brandName,
        startDate: new Date().toISOString(),
        totalDuration: GENERIC_PROJECT_TIMELINE.totalDuration,
        currentPhase: 'phase1',
        overallStatus: 'in-progress',
      },
      phases: {},
      metrics: {
        timeline: {
          plannedStartDate: new Date().toISOString(),
          actualStartDate: new Date().toISOString(),
          plannedEndDate: null,
          actualEndDate: null,
          daysElapsed: 0,
        },
        deliverables: {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          completionRate: 0,
        },
        phases: {
          total: GENERIC_PROJECT_TIMELINE.phases.length,
          completed: 0,
          inProgress: 1,
          notStarted: GENERIC_PROJECT_TIMELINE.phases.length - 1,
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    // Initialize phases with deliverables
    GENERIC_PROJECT_TIMELINE.phases.forEach((phase) => {
      const phaseKey = `phase${phase.phase}`;
      const phaseDeliverables = deliverables[phaseKey] || [];

      structure.phases[phaseKey] = {
        number: phase.phase,
        name: phase.name,
        duration: phase.duration,
        status: phase.phase === 1 ? 'in-progress' : 'not-started',
        startDate: phase.phase === 1 ? new Date().toISOString() : null,
        endDate: null,
        deliverables: phaseDeliverables.map((d) => ({
          name: d,
          status: 'not-started',
          assignee: undefined,
          dueDate: undefined,
          completedDate: undefined,
          notes: [],
          dependencies: [],
        })),
        milestones: [],
        risks: [],
        progress: 0,
      };

      structure.metrics.deliverables.total += phaseDeliverables.length;
      structure.metrics.deliverables.notStarted += phaseDeliverables.length;
    });

    return structure;
  }

  /**
   * Save project data to disk
   */
  async save(): Promise<void> {
    if (!this.data) {
      throw new Error('No project data to save. Call initialize() first.');
    }

    this.data.lastUpdated = new Date().toISOString();
    await FileSystemUtils.writeJSON(this.dataFile, this.data);
  }

  /**
   * Update deliverable status and details
   */
  async updateDeliverable(
    phase: string,
    deliverableName: string,
    updates: Partial<Deliverable>
  ): Promise<Deliverable> {
    if (!this.data) {
      throw new Error('Project tracker not initialized. Call initialize() first.');
    }

    const phaseData = this.data.phases[phase];
    if (!phaseData) {
      throw new Error(`Phase ${phase} not found`);
    }

    const deliverable = phaseData.deliverables.find((d) => d.name === deliverableName);
    if (!deliverable) {
      throw new Error(`Deliverable "${deliverableName}" not found in ${phase}`);
    }

    const oldStatus = deliverable.status;

    Object.assign(deliverable, updates);

    if (updates.status && updates.status !== oldStatus) {
      if (updates.status === 'completed') {
        deliverable.completedDate = new Date().toISOString();
      }
      this.recalculateMetrics();
    }

    await this.save();
    return deliverable;
  }

  /**
   * Add milestone to phase
   */
  async addMilestone(
    phase: string,
    milestone: { name: string; description?: string; targetDate: string }
  ): Promise<void> {
    if (!this.data) {
      throw new Error('Project tracker not initialized. Call initialize() first.');
    }

    const phaseData = this.data.phases[phase];
    if (!phaseData) {
      throw new Error(`Phase ${phase} not found`);
    }

    phaseData.milestones.push(milestone.name);

    await this.save();
  }

  /**
   * Add risk to phase
   */
  async addRisk(
    phase: string,
    risk: { title: string; description: string; severity?: string; mitigation?: string }
  ): Promise<void> {
    if (!this.data) {
      throw new Error('Project tracker not initialized. Call initialize() first.');
    }

    const phaseData = this.data.phases[phase];
    if (!phaseData) {
      throw new Error(`Phase ${phase} not found`);
    }

    phaseData.risks.push(`${risk.title}: ${risk.description}`);

    await this.save();
  }

  /**
   * Update phase status
   */
  async updatePhase(
    phase: string,
    updates: Partial<Pick<Phase, 'status' | 'startDate' | 'endDate'>>
  ): Promise<void> {
    if (!this.data) {
      throw new Error('Project tracker not initialized. Call initialize() first.');
    }

    const phaseData = this.data.phases[phase];
    if (!phaseData) {
      throw new Error(`Phase ${phase} not found`);
    }

    Object.assign(phaseData, updates);

    if (updates.status === 'completed') {
      phaseData.endDate = new Date().toISOString();
    }

    this.recalculateMetrics();
    await this.save();
  }

  /**
   * Recalculate project metrics
   */
  private recalculateMetrics(): void {
    if (!this.data) return;

    let totalDeliverables = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    let phasesCompleted = 0;
    let phasesInProgress = 0;
    let phasesNotStarted = 0;

    for (const phase of Object.values(this.data.phases)) {
      // Count deliverables
      phase.deliverables.forEach((d) => {
        totalDeliverables++;
        if (d.status === 'completed') completed++;
        else if (d.status === 'in-progress') inProgress++;
        else notStarted++;
      });

      // Calculate phase progress
      const phaseCompleted = phase.deliverables.filter((d) => d.status === 'completed').length;
      phase.progress = Math.round((phaseCompleted / phase.deliverables.length) * 100);

      // Count phase status
      if (phase.status === 'completed') phasesCompleted++;
      else if (phase.status === 'in-progress') phasesInProgress++;
      else phasesNotStarted++;
    }

    this.data.metrics.deliverables = {
      total: totalDeliverables,
      completed,
      inProgress,
      notStarted,
      completionRate: totalDeliverables > 0 ? Math.round((completed / totalDeliverables) * 100) : 0,
    };

    this.data.metrics.phases = {
      total: Object.keys(this.data.phases).length,
      completed: phasesCompleted,
      inProgress: phasesInProgress,
      notStarted: phasesNotStarted,
    };

    // Calculate days elapsed
    const startDate = new Date(this.data.project.startDate);
    const now = new Date();
    this.data.metrics.timeline.daysElapsed = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Generate dashboard markdown
   */
  async generateDashboard(): Promise<string> {
    if (!this.data) {
      throw new Error('Project tracker not initialized. Call initialize() first.');
    }
    return generateDashboard(this.data, this.brandConfig.brandName);
  }

  /**
   * Export deliverables list to CSV
   */
  async exportDeliverablesList(): Promise<string> {
    if (!this.data) {
      throw new Error('Project tracker not initialized. Call initialize() first.');
    }
    return exportDeliverablesList(this.data, this.brandConfig.brandName);
  }

  /**
   * Get current project status
   */
  getStatus(): ProjectStatus | null {
    return this.data;
  }

  /**
   * Get specific phase data
   */
  getPhase(phaseKey: string): Phase | null {
    if (!this.data) return null;
    return this.data.phases[phaseKey] || null;
  }

  /**
   * Get all deliverables for a phase
   */
  getPhaseDeliverables(phaseKey: string): Deliverable[] {
    const phase = this.getPhase(phaseKey);
    return phase ? phase.deliverables : [];
  }

  /**
   * Find deliverable by name across all phases
   */
  findDeliverable(name: string): { phase: string; deliverable: Deliverable } | null {
    if (!this.data) return null;

    for (const [phaseKey, phase] of Object.entries(this.data.phases)) {
      const deliverable = phase.deliverables.find((d) => d.name === name);
      if (deliverable) {
        return { phase: phaseKey, deliverable };
      }
    }

    return null;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.data) return null;

    return {
      project: {
        name: this.data.project.name,
        brand: this.data.project.brandName,
        startDate: this.data.project.startDate,
        currentPhase: this.data.project.currentPhase,
        status: this.data.project.overallStatus,
        daysElapsed: this.data.metrics.timeline.daysElapsed,
      },
      deliverables: this.data.metrics.deliverables,
      phases: this.data.metrics.phases,
      completionRate: this.data.metrics.deliverables.completionRate,
    };
  }
}

export default ProjectTracker;
