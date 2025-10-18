// Fix Tracker - Track quality issues and their resolution

import type {
  QualityFix,
  FixStatus,
  FixLogEntry,
  StrategyGap
} from '../types/validation-types.js';
import { FileSystemUtils } from '../utils/index.js';
import path from 'path';

export class FixTracker {
  private brandName: string;
  private fixesPath: string;
  private logPath: string;

  constructor(brandName: string) {
    this.brandName = brandName;
    this.fixesPath = path.join('.brandos', brandName, 'data', 'quality-fixes.json');
    this.logPath = path.join('.brandos', brandName, 'logs', 'fix-log.jsonl');
  }

  /**
   * Load existing fixes
   */
  async loadFixes(): Promise<QualityFix[]> {
    try {
      return await FileSystemUtils.readJSON<QualityFix[]>(this.fixesPath);
    } catch (error) {
      // No fixes file exists yet
      return [];
    }
  }

  /**
   * Save fixes
   */
  async saveFixes(fixes: QualityFix[]): Promise<void> {
    await FileSystemUtils.writeJSON(this.fixesPath, fixes);
  }

  /**
   * Create fixes from gaps
   */
  async createFixesFromGaps(gaps: StrategyGap[]): Promise<QualityFix[]> {
    const existingFixes = await this.loadFixes();
    const newFixes: QualityFix[] = [];

    for (const gap of gaps) {
      // Skip if fix already exists for this gap
      const existingFix = existingFixes.find(f => f.gapId === gap.id);
      if (existingFix) continue;

      const fix: QualityFix = {
        id: `FIX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gapId: gap.id,
        title: gap.title,
        description: gap.description,
        status: 'identified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        effort: gap.effort,
        checkpoints: gap.relatedCheckpoints,
        notes: gap.recommendations
      };

      newFixes.push(fix);
    }

    // Merge with existing fixes
    const allFixes = [...existingFixes, ...newFixes];
    await this.saveFixes(allFixes);

    // Log creation
    for (const fix of newFixes) {
      await this.logAction({
        timestamp: new Date().toISOString(),
        fixId: fix.id,
        action: 'created',
        description: `Fix created from gap: ${fix.gapId}`
      });
    }

    return allFixes;
  }

  /**
   * Update fix status
   */
  async updateFixStatus(fixId: string, status: FixStatus, note?: string): Promise<void> {
    const fixes = await this.loadFixes();
    const fix = fixes.find(f => f.id === fixId);

    if (!fix) {
      throw new Error(`Fix not found: ${fixId}`);
    }

    const oldStatus = fix.status;
    fix.status = status;
    fix.updatedAt = new Date().toISOString();

    if (status === 'resolved' || status === 'verified') {
      fix.resolvedAt = new Date().toISOString();
    }

    if (note) {
      fix.notes.push(note);
      await this.logAction({
        timestamp: new Date().toISOString(),
        fixId,
        action: 'note_added',
        description: note
      });
    }

    await this.saveFixes(fixes);

    await this.logAction({
      timestamp: new Date().toISOString(),
      fixId,
      action: 'status_changed',
      description: `Status changed: ${oldStatus} → ${status}`
    });
  }

  /**
   * Add note to fix
   */
  async addNote(fixId: string, note: string, author?: string): Promise<void> {
    const fixes = await this.loadFixes();
    const fix = fixes.find(f => f.id === fixId);

    if (!fix) {
      throw new Error(`Fix not found: ${fixId}`);
    }

    fix.notes.push(note);
    fix.updatedAt = new Date().toISOString();

    await this.saveFixes(fixes);

    await this.logAction({
      timestamp: new Date().toISOString(),
      fixId,
      action: 'note_added',
      description: note,
      author
    });
  }

  /**
   * Get fixes by status
   */
  async getFixesByStatus(status: FixStatus): Promise<QualityFix[]> {
    const fixes = await this.loadFixes();
    return fixes.filter(f => f.status === status);
  }

  /**
   * Get fixes by checkpoint
   */
  async getFixesByCheckpoint(checkpointId: string): Promise<QualityFix[]> {
    const fixes = await this.loadFixes();
    return fixes.filter(f => f.checkpoints.includes(checkpointId));
  }

  /**
   * Get fix statistics
   */
  async getFixStats() {
    const fixes = await this.loadFixes();

    return {
      total: fixes.length,
      identified: fixes.filter(f => f.status === 'identified').length,
      inProgress: fixes.filter(f => f.status === 'in_progress').length,
      resolved: fixes.filter(f => f.status === 'resolved').length,
      verified: fixes.filter(f => f.status === 'verified').length,
      wontFix: fixes.filter(f => f.status === 'wont_fix').length,
      byEffort: {
        low: fixes.filter(f => f.effort === 'low').length,
        medium: fixes.filter(f => f.effort === 'medium').length,
        high: fixes.filter(f => f.effort === 'high').length
      }
    };
  }

  /**
   * Log action to fix log
   */
  private async logAction(entry: FixLogEntry): Promise<void> {
    try {
      // Append to JSONL log file
      const logLine = JSON.stringify(entry) + '\n';
      const logDir = path.dirname(this.logPath);
      await FileSystemUtils.ensureDir(logDir);

      // Append to file (create if doesn't exist)
      const { appendFile } = await import('fs/promises');
      await appendFile(this.logPath, logLine, 'utf-8');
    } catch (error) {
      // Log errors are non-fatal
      console.warn(`Failed to log fix action: ${(error as Error).message}`);
    }
  }

  /**
   * Read fix log
   */
  async readLog(limit?: number): Promise<FixLogEntry[]> {
    try {
      const content = await FileSystemUtils.readFile(this.logPath);
      const lines = content.trim().split('\n').filter(Boolean);

      const entries = lines.map(line => JSON.parse(line) as FixLogEntry);

      if (limit) {
        return entries.slice(-limit); // Last N entries
      }

      return entries;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate fix report
   */
  async generateFixReport(): Promise<string> {
    const fixes = await this.loadFixes();
    const stats = await this.getFixStats();

    const report: string[] = [];

    report.push(`# Quality Fix Report - ${this.brandName}`);
    report.push('');
    report.push(`**Generated**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    report.push('');
    report.push('## Summary');
    report.push('');
    report.push(`- **Total Fixes**: ${stats.total}`);
    report.push(`- **Identified**: ${stats.identified}`);
    report.push(`- **In Progress**: ${stats.inProgress}`);
    report.push(`- **Resolved**: ${stats.resolved}`);
    report.push(`- **Verified**: ${stats.verified}`);
    report.push(`- **Won't Fix**: ${stats.wontFix}`);
    report.push('');
    report.push('## By Effort');
    report.push('');
    report.push(`- **Low Effort**: ${stats.byEffort.low}`);
    report.push(`- **Medium Effort**: ${stats.byEffort.medium}`);
    report.push(`- **High Effort**: ${stats.byEffort.high}`);
    report.push('');

    // Group by status
    const statusGroups = {
      identified: 'Identified (Not Started)',
      in_progress: 'In Progress',
      resolved: 'Resolved (Pending Verification)',
      verified: 'Verified (Complete)',
      wont_fix: 'Won\'t Fix'
    };

    for (const [status, heading] of Object.entries(statusGroups)) {
      const statusFixes = fixes.filter(f => f.status === status);
      if (statusFixes.length === 0) continue;

      report.push(`## ${heading} (${statusFixes.length})`);
      report.push('');

      for (const fix of statusFixes) {
        report.push(`### ${fix.title}`);
        report.push('');
        report.push(`- **ID**: ${fix.id}`);
        report.push(`- **Gap**: ${fix.gapId}`);
        report.push(`- **Effort**: ${fix.effort}`);
        report.push(`- **Created**: ${new Date(fix.createdAt).toLocaleDateString()}`);
        report.push(`- **Updated**: ${new Date(fix.updatedAt).toLocaleDateString()}`);
        if (fix.resolvedAt) {
          report.push(`- **Resolved**: ${new Date(fix.resolvedAt).toLocaleDateString()}`);
        }
        if (fix.assignee) {
          report.push(`- **Assignee**: ${fix.assignee}`);
        }
        report.push('');
        report.push(`**Description**: ${fix.description}`);
        report.push('');

        if (fix.notes.length > 0) {
          report.push('**Notes**:');
          fix.notes.forEach(note => {
            report.push(`- ${note}`);
          });
          report.push('');
        }
      }
    }

    return report.join('\n');
  }
}
