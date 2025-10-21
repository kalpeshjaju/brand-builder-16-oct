/**
 * Evolution Orchestrator
 *
 * Coordinates the 5-phase Brand Evolution Workshop workflow
 * Manages state, persistence, and phase transitions
import type ora from 'ora';
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { Ora } from 'ora';
import { CommandExecutionError } from '../cli/utils/error-handler.js';
import { Logger } from '../utils/logger.js';
import { ResearchBlitz, type ResearchBlitzConfig } from './research-blitz.js';
import { PatternPresenter } from './pattern-presenter.js';
import { CreativeDirector } from './creative-director.js';
import { ValidationEngine } from './validation-engine.js';
import { BuildOutGenerator } from './build-out-generator.js';
import type {
  EvolutionWorkflowState,
  EvolutionPhase,
  BuildOutOutput
} from '../types/evolution-types.js';
import type { CreativeDirectionConfig } from '../types/evolution-config-types.js';

const logger = new Logger('EvolutionOrchestrator');
const PHASE_ORDER: EvolutionPhase[] = ['research', 'patterns', 'direction', 'validation', 'buildout'];

export interface EvolutionConfig {
  brandName: string;
  brandUrl: string;
  competitorUrls?: string[];
  outputDir?: string;
  resumeFromPhase?: EvolutionPhase;
  creativeDirectionConfig?: CreativeDirectionConfig; // For non-interactive mode
}

export class EvolutionOrchestrator {
  private config: EvolutionConfig;
  private state: EvolutionWorkflowState;
  private outputDir: string;

  constructor(config: EvolutionConfig) {
    this.config = config;
    this.outputDir = config.outputDir || `./outputs/evolution/${this.slugify(config.brandName)}`;

    // Initialize state
    this.state = {
      brandName: config.brandName,
      brandUrl: config.brandUrl,
      currentPhase: config.resumeFromPhase || 'research',
      completedPhases: [],
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      outputs: {},
    };
  }

  /**
   * Run the complete evolution workshop
   */
  async run(): Promise<BuildOutOutput> {
    console.log(chalk.bold.cyan('\n🚀 Brand Evolution Workshop\n'));
    console.log(chalk.gray(`Brand: ${this.config.brandName}`));
    console.log(chalk.gray(`URL: ${this.config.brandUrl}\n`));

    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Phase 1: Research Blitz
      await this.runUntilPhase('buildout');

      const buildout = this.state.outputs.buildout!;

      // Save final state
      await this.saveState();

      console.log(chalk.bold.green('\n✅ Evolution Workshop Complete!\n'));
      console.log(chalk.cyan(`📁 Outputs saved to: ${this.outputDir}\n`));

      return buildout;
    } catch (error) {
      logger.error('Evolution workflow failed', error);
      await this.saveState(); // Save state even on failure

      if (error instanceof CommandExecutionError) {
        throw error;
      }

      const message = `Evolution workflow failed for ${this.config.brandName}`;
      throw new CommandExecutionError(message, { cause: error });
    }
  }

  /**
   * Run sequentially until the requested phase (inclusive)
   * Automatically skips completed phases unless forcing the target
   */
  async runUntilPhase(targetPhase: EvolutionPhase, options?: { forceTarget?: boolean }): Promise<void> {
    const targetIndex = PHASE_ORDER.indexOf(targetPhase);
    if (targetIndex === -1) {
      throw new CommandExecutionError(`Unknown evolution phase: ${targetPhase}`);
    }

    const spinner = ora('Starting evolution...').start();
    try {
      for (let index = 0; index <= targetIndex; index++) {
        const phase = PHASE_ORDER[index];
        const shouldForce = options?.forceTarget && phase === targetPhase;
        if (!this.isPhaseComplete(phase) || shouldForce) {
          await this.executePhase(phase, spinner);
        } else {
          this.logPhaseAlreadyComplete(phase);
        }
      }
      spinner.stop();
    } catch (error) {
      spinner.stop();
      throw error;
    }

    await this.saveState();
  }

  /**
   * Run a specific sequence of phases in order (used by CLI subcommands)
   */
  async runPhaseSequence(phases: EvolutionPhase[], options?: { forceLast?: boolean }): Promise<void> {
    if (phases.length === 0) {
      return;
    }

    const orderedUniquePhases = PHASE_ORDER.filter(phase => phases.includes(phase));
    const lastPhase = orderedUniquePhases[orderedUniquePhases.length - 1];

    for (const phase of orderedUniquePhases) {
      const shouldForce = options?.forceLast && phase === lastPhase;
      if (!this.isPhaseComplete(phase) || shouldForce) {
        await this.executePhase(phase);
      } else {
        this.logPhaseAlreadyComplete(phase);
      }
    }

    await this.saveState();
  }

  /**
   * Execute a single phase by delegating to the underlying implementation
   */
  private async executePhase(phase: EvolutionPhase, spinner?: Ora): Promise<void> {
    switch (phase) {
      case 'research':
        await this.runPhase1(spinner);
        break;
      case 'patterns':
        await this.runPhase2(spinner);
        break;
      case 'direction':
        await this.runPhase3();
        break;
      case 'validation':
        await this.runPhase4(spinner);
        break;
      case 'buildout':
        await this.runPhase5(spinner);
        break;
      default:
        throw new CommandExecutionError(`Unsupported evolution phase requested: ${phase}`);
    }
  }

  /**
   * Log that a phase was already complete (for CLI UX)
   */
  private logPhaseAlreadyComplete(phase: EvolutionPhase): void {
    const phaseName =
      phase === 'research' ? 'Phase 1: Research Blitz' :
      phase === 'patterns' ? 'Phase 2: Pattern Presentation' :
      phase === 'direction' ? 'Phase 3: Creative Direction' :
      phase === 'validation' ? 'Phase 4: Validation' :
      'Phase 5: Build-Out';

    console.log(chalk.green(`✓ ${phaseName} (already complete)\n`));
  }

  /**
   * Phase 1: Research Blitz
   */
  private async runPhase1(spinner?: Ora): Promise<void> {
    const phaseSpinner = spinner || ora('Conducting brand audit...').start();
    phaseSpinner.text = 'Phase 1: Research Blitz - Starting...';

    try {
      const blitzConfig: ResearchBlitzConfig = {
        brandName: this.config.brandName,
        brandUrl: this.config.brandUrl,
        competitorUrls: this.config.competitorUrls,
      };

      const blitz = new ResearchBlitz(blitzConfig);
      const research = await blitz.execute((message) => {
        phaseSpinner.text = `Phase 1: Research Blitz - ${message}`;
      });

      this.state.outputs.research = research;
      this.markPhaseComplete('research');

      phaseSpinner.succeed('Phase 1: Research Blitz complete');

      // Save research output
      await this.saveOutput('01-research-blitz.json', research);

      console.log(chalk.gray(`  • Analyzed ${research.competitors.length} competitors`));
      console.log(chalk.gray(`  • Found ${research.marketGaps.length} market gaps`));
      console.log(chalk.gray(`  • Detected ${research.contradictions.length} contradictions\n`));
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = normalizedError.message;
      phaseSpinner.fail(`Research blitz failed for ${this.config.brandName}: ${errorMessage}`);
      logger.error(`Phase 'research' failed for ${this.config.brandName}`, normalizedError);
      throw new CommandExecutionError(
        `Phase 'research' failed for ${this.config.brandName}`,
        { cause: normalizedError }
      );
    }
  }

  /**
   * Phase 2: Pattern Presentation
   */
  private async runPhase2(spinner?: Ora): Promise<void> {
    const phaseSpinner = spinner || ora('Analyzing patterns...').start();
    phaseSpinner.text = 'Phase 2: Pattern Presentation - Analyzing patterns...';

    try {
      const research = this.state.outputs.research!;
      const presenter = new PatternPresenter();
      const patterns = await presenter.present(research);

      this.state.outputs.patterns = patterns;
      this.markPhaseComplete('patterns');

      phaseSpinner.succeed('Phase 2: Pattern Presentation complete');

      // Save patterns
      await this.saveOutput('02-patterns.json', patterns);

      // Generate and save markdown
      const markdown = presenter.generateMarkdownPresentation(patterns);
      await this.saveOutput('02-patterns.md', markdown, 'text');

      console.log(chalk.gray(`  • ${patterns.contradictions.length} contradictions`));
      console.log(chalk.gray(`  • ${patterns.whiteSpace.length} white space opportunities`));
      console.log(chalk.gray(`  • ${patterns.languageGaps.length} language gaps\n`));
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = normalizedError.message;
      phaseSpinner.fail(`Pattern presentation failed for ${this.config.brandName}: ${errorMessage}`);
      logger.error(`Phase 'patterns' failed for ${this.config.brandName}`, normalizedError);
      throw new CommandExecutionError(
        `Phase 'patterns' failed for ${this.config.brandName}`,
        { cause: normalizedError }
      );
    }
  }

  /**
   * Phase 3: Creative Direction
   */
  private async runPhase3(): Promise<void> {
    console.log(chalk.bold('\n💡 Phase 3: Creative Direction\n'));

    try {
      const patterns = this.state.outputs.patterns!;
      const director = new CreativeDirector();

      // Determine mode based on config availability
      const mode = this.config.creativeDirectionConfig ? 'config' : 'interactive';
      const direction = await director.captureDirection(
        patterns,
        mode,
        this.config.creativeDirectionConfig
      );

      this.state.outputs.direction = direction;
      this.markPhaseComplete('direction');

      // Save direction
      await this.saveOutput('03-creative-direction.json', direction);

      // Generate and save markdown
      const markdown = director.generateMarkdownSummary(direction);
      await this.saveOutput('03-creative-direction.md', markdown, 'text');
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const message = `Creative direction failed for ${this.config.brandName}`;
      logger.error(message, normalizedError);
      throw new CommandExecutionError(message, { cause: normalizedError });
    }
  }

  /**
   * Phase 4: Validation
   */
  private async runPhase4(spinner?: Ora): Promise<void> {
    const phaseSpinner = spinner || ora('Validating creative direction...').start();
    phaseSpinner.text = 'Phase 4: Validation - Validating creative direction...';

    try {
      const research = this.state.outputs.research!;
      const direction = this.state.outputs.direction!;

      const engine = new ValidationEngine();
      const validation = await engine.validate(research, direction);

      this.state.outputs.validation = validation;
      this.markPhaseComplete('validation');

      phaseSpinner.succeed('Phase 4: Validation complete');

      // Save validation
      await this.saveOutput('04-validation.json', validation);

      // Generate and save markdown
      const markdown = engine.generateMarkdownReport(validation);
      await this.saveOutput('04-validation.md', markdown, 'text');

      // Display results
      const emoji = validation.recommendation === 'proceed' ? '✅' : validation.recommendation === 'modify' ? '🔧' : '⚠️';
      console.log(chalk.bold(`\n${emoji} Recommendation: ${validation.recommendation.toUpperCase()}`));
      console.log(chalk.gray(`Confidence: ${(validation.overallConfidence * 10).toFixed(1)}/10\n`));

      if (validation.modifications.length > 0) {
        console.log(chalk.yellow('Suggested modifications:'));
        validation.modifications.forEach(mod => console.log(chalk.yellow(`  • ${mod}`)));
        console.log();
      }
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = normalizedError.message;
      phaseSpinner.fail(`Validation failed for ${this.config.brandName}: ${errorMessage}`);
      logger.error(`Phase 'validation' failed for ${this.config.brandName}`, normalizedError);
      throw new CommandExecutionError(
        `Phase 'validation' failed for ${this.config.brandName}`,
        { cause: normalizedError }
      );
    }
  }

  /**
   * Phase 5: Build-Out
   */
  private async runPhase5(spinner?: Ora): Promise<void> {
    const phaseSpinner = spinner || ora('Generating strategy...').start();
    phaseSpinner.text = 'Phase 5: Build-Out - Generating strategy...';

    try {
      const research = this.state.outputs.research!;
      const direction = this.state.outputs.direction!;
      const validation = this.state.outputs.validation!;

      const generator = new BuildOutGenerator();
      const buildout = await generator.generate(research, direction, validation);

      this.state.outputs.buildout = buildout;
      this.markPhaseComplete('buildout');

      phaseSpinner.succeed('Phase 5: Build-Out complete');

      // Save buildout
      await this.saveOutput('05-buildout.json', buildout);

      // Generate and save markdown strategy
      const markdown = generator.generateMarkdownStrategy(buildout);
      await this.saveOutput('05-brand-evolution-strategy.md', markdown, 'text');

      console.log(chalk.gray(`  • Positioning framework defined`));
      console.log(chalk.gray(`  • Messaging architecture created`));
      console.log(chalk.gray(`  • ${buildout.contentExamples.length} content examples`));
      console.log(chalk.gray(`  • ${buildout.channelStrategy.length} channel strategies`));
      console.log(chalk.gray(`  • ${buildout.implementationRoadmap.length}-phase roadmap\n`));
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = normalizedError.message;
      phaseSpinner.fail(`Build-out failed for ${this.config.brandName}: ${errorMessage}`);
      logger.error(`Phase 'buildout' failed for ${this.config.brandName}`, normalizedError);
      throw new CommandExecutionError(
        `Phase 'buildout' failed for ${this.config.brandName}`,
        { cause: normalizedError }
      );
    }
  }

  /**
   * Check if phase is complete
   */
  private isPhaseComplete(phase: EvolutionPhase): boolean {
    return this.state.completedPhases.includes(phase);
  }

  /**
   * Mark phase as complete
   */
  private markPhaseComplete(phase: EvolutionPhase): void {
    if (!this.state.completedPhases.includes(phase)) {
      this.state.completedPhases.push(phase);
    }
    this.state.currentPhase = this.getNextPhase(phase) || phase;
    this.state.lastUpdated = new Date().toISOString();
  }

  /**
   * Get next phase
   */
  private getNextPhase(current: EvolutionPhase): EvolutionPhase | null {
    const order: EvolutionPhase[] = ['research', 'patterns', 'direction', 'validation', 'buildout'];
    const currentIndex = order.indexOf(current);
    if (currentIndex === -1 || currentIndex === order.length - 1) {
      return null;
    }
    return order[currentIndex + 1] || null;
  }

  /**
   * Save output file
   */
  private async saveOutput(filename: string, data: any, format: 'json' | 'text' = 'json'): Promise<void> {
    const filepath = path.join(this.outputDir, filename);

    try {
      const content = format === 'json' ? JSON.stringify(data, null, 2) : data;
      await fs.writeFile(filepath, content, 'utf-8');
      logger.debug(`Saved output: ${filepath}`);
    } catch (error) {
      logger.error(`Failed to save output ${filename}`, error);
      throw error;
    }
  }

  /**
   * Save workflow state
   */
  private async saveState(): Promise<void> {
    const statePath = path.join(this.outputDir, 'workflow-state.json');
    await fs.writeFile(statePath, JSON.stringify(this.state, null, 2), 'utf-8');
    logger.debug('Workflow state saved');
  }

  /**
   * Load workflow state
   */
  async loadState(): Promise<void> {
    const statePath = path.join(this.outputDir, 'workflow-state.json');

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      this.state = JSON.parse(content);
      logger.info('Workflow state loaded');
    } catch (error) {
      logger.warn('No previous state found, starting fresh');
    }
  }

  /**
   * Slugify brand name for directory
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get current state
   */
  getState(): EvolutionWorkflowState {
    return this.state;
  }
}
