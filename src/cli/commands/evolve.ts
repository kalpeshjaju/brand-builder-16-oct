/**
 * Evolve Command
 *
 * CLI command for Brand Evolution Workshop
 */

import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { EvolutionOrchestrator, type EvolutionConfig } from '../../evolution/evolution-orchestrator.js';
import type { CreativeDirectionConfig } from '../../types/evolution-config-types.js';
import type { EvolutionPhase, EvolutionWorkflowState } from '../../types/evolution-types.js';
import { FileSystemUtils, Logger } from '../../utils/index.js';
import { CommandExecutionError, handleCommandError } from '../utils/error-handler.js';

const logger = new Logger('EvolveCommand');
const PHASE_LABELS: Record<EvolutionPhase, string> = {
  research: 'Phase 1: Research Blitz',
  patterns: 'Phase 2: Pattern Presentation',
  direction: 'Phase 3: Creative Direction',
  validation: 'Phase 4: Validation',
  buildout: 'Phase 5: Build-Out',
};

function slugifyBrandName(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveOutputDirectory(brand: string, customDir?: string): string {
  if (customDir) {
    return path.isAbsolute(customDir) ? customDir : path.resolve(process.cwd(), customDir);
  }
  return path.resolve(process.cwd(), 'outputs', 'evolution', slugifyBrandName(brand));
}

async function loadExistingState(
  brand: string,
  outputDir?: string
): Promise<EvolutionWorkflowState | null> {
  const resolvedDir = resolveOutputDirectory(brand, outputDir);
  const statePath = path.join(resolvedDir, 'workflow-state.json');

  if (!(await FileSystemUtils.fileExists(statePath))) {
    return null;
  }

  try {
    return await FileSystemUtils.readJSON<EvolutionWorkflowState>(statePath);
  } catch (error) {
    logger.warn('Failed to read existing workflow state', { brand, error: (error as Error).message });
    return null;
  }
}

async function resolveBrandUrl(
  brand: string,
  providedUrl: string | undefined,
  existingState: EvolutionWorkflowState | null
): Promise<string> {
  if (providedUrl) {
    return providedUrl;
  }

  if (existingState?.brandUrl) {
    return existingState.brandUrl;
  }

  const guidance =
    'Provide --url explicitly or run `brandos evolve --brand "<name>" --url "<https://...>"` first.';
  throw new CommandExecutionError(
    `Brand URL required to run this phase for ${brand}. ${guidance}`
  );
}

async function loadCreativeConfig(configPath?: string): Promise<CreativeDirectionConfig | undefined> {
  if (!configPath) {
    return undefined;
  }

  try {
    const config = await FileSystemUtils.readJSON<CreativeDirectionConfig>(configPath);
    console.log(chalk.green(`✓ Loaded creative direction config from ${configPath}\n`));
    return config;
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    throw new CommandExecutionError(`Failed to load creative direction config: ${configPath}`, {
      cause: normalized,
    });
  }
}

function deriveCompetitorUrls(
  provided: string[] | undefined,
  existingState: EvolutionWorkflowState | null
): string[] | undefined {
  if (provided && provided.length > 0) {
    return provided.slice(0, 5);
  }

  const previous = existingState?.outputs.research?.competitors ?? [];
  if (previous.length === 0) {
    return undefined;
  }

  return previous.map(c => c.url).slice(0, 5);
}

function logPhaseSummary(
  phase: EvolutionPhase,
  state: EvolutionWorkflowState,
  outputDir: string
): void {
  const { outputs } = state;
  console.log(chalk.cyan(`\n📁 Output directory: ${outputDir}`));

  switch (phase) {
    case 'research': {
      const research = outputs.research;
      if (!research) {
        console.log(chalk.yellow('Research output not found.'));
        break;
      }

      console.log(chalk.cyan('\n📊 Research Blitz Summary'));
      console.log(chalk.gray(`  • Competitors analyzed: ${research.competitors.length}`));
      console.log(chalk.gray(`  • Market gaps identified: ${research.marketGaps.length}`));
      console.log(chalk.gray(`  • Contradictions detected: ${research.contradictions.length}`));
      break;
    }

    case 'patterns': {
      const patterns = outputs.patterns;
      if (!patterns) {
        console.log(chalk.yellow('Pattern presentation output not found.'));
        break;
      }

      console.log(chalk.cyan('\n🔍 Pattern Presentation Summary'));
      console.log(chalk.gray(`  • Contradictions: ${patterns.contradictions.length}`));
      console.log(chalk.gray(`  • White space opportunities: ${patterns.whiteSpace.length}`));
      console.log(chalk.gray(`  • Language gaps: ${patterns.languageGaps.length}`));
      break;
    }

    case 'direction': {
      const direction = outputs.direction;
      if (!direction) {
        console.log(chalk.yellow('Creative direction output not found.'));
        break;
      }

      console.log(chalk.cyan('\n💡 Creative Direction Summary'));
      console.log(chalk.gray(`  • Primary direction: ${direction.primaryDirection}`));
      console.log(chalk.gray(`  • Key themes: ${direction.keyThemes.join(', ')}`));
      console.log(chalk.gray(`  • Creative leaps captured: ${direction.creativeLeaps.length}`));
      break;
    }

    case 'validation': {
      const validation = outputs.validation;
      if (!validation) {
        console.log(chalk.yellow('Validation output not found.'));
        break;
      }

      const recEmoji =
        validation.recommendation === 'proceed'
          ? '✅'
          : validation.recommendation === 'modify'
            ? '🔧'
            : '⚠️';
      console.log(chalk.cyan('\n✅ Validation Summary'));
      console.log(chalk.gray(`  • Recommendation: ${recEmoji} ${validation.recommendation.toUpperCase()}`));
      console.log(chalk.gray(`  • Confidence: ${(validation.overallConfidence * 10).toFixed(1)}/10`));
      console.log(chalk.gray(`  • Risks identified: ${validation.riskAnalysis.length}`));
      break;
    }

    case 'buildout': {
      const buildout = outputs.buildout;
      if (!buildout) {
        console.log(chalk.yellow('Build-out output not found.'));
        break;
      }

      console.log(chalk.cyan('\n🏗️  Build-Out Summary'));
      console.log(chalk.gray(`  • Positioning statement: ${buildout.positioningFramework.statement}`));
      console.log(chalk.gray(`  • Messaging pillars: ${buildout.messagingArchitecture.keyMessages.length}`));
      console.log(chalk.gray(`  • Content examples: ${buildout.contentExamples.length}`));
      console.log(chalk.gray(`  • Channel strategies: ${buildout.channelStrategy.length}`));
      console.log(chalk.gray(`  • Roadmap phases: ${buildout.implementationRoadmap.length}`));
      break;
    }

    default:
      break;
  }
}

async function runPhaseCommand(phase: EvolutionPhase, options: {
  brand: string;
  url?: string;
  competitors?: string[];
  output?: string;
  configPath?: string;
  force?: boolean;
}): Promise<void> {
  const phaseLabel = PHASE_LABELS[phase];
  const spinner = ora(`Running ${phaseLabel}...`).start();

  try {
    const resolvedOutputDir = options.output ? resolveOutputDirectory(options.brand, options.output) : undefined;
    const existingState = await loadExistingState(options.brand, resolvedOutputDir);
    const brandUrl = await resolveBrandUrl(options.brand, options.url, options.output, existingState);
    const creativeDirectionConfig = await loadCreativeConfig(options.configPath);
    const competitorUrls = deriveCompetitorUrls(options.competitors, existingState);

    const config: EvolutionConfig = {
      brandName: options.brand,
      brandUrl,
      competitorUrls,
      outputDir: resolvedOutputDir,
      creativeDirectionConfig,
    };

    const orchestrator = new EvolutionOrchestrator(config);
    await orchestrator.loadState();

    await orchestrator.runUntilPhase(phase, { forceTarget: options.force });

    spinner.succeed(`${phaseLabel} completed`);

    const state = orchestrator.getState();
    const outputDir = resolveOutputDirectory(options.brand, config.outputDir);
    logPhaseSummary(phase, state, outputDir);
  } catch (error) {
    spinner.fail(`${phaseLabel} failed`);
    throw error;
  }
}

export const evolveCommand = new Command('evolve')
  .description('Brand Evolution Workshop - Human-AI collaborative strategy development')
  .requiredOption('--brand <name>', 'Brand name')
  .requiredOption('--url <url>', 'Brand website URL')
  .option('--competitors <urls...>', 'Competitor URLs (up to 5)')
  .option('--output <dir>', 'Output directory (default: ./outputs/evolution/<brand>)')
  .option('--resume <phase>', 'Resume from phase (research|patterns|direction|validation|buildout)')
  .option('--config <path>', 'Creative direction config file (enables non-interactive mode)')
  .action(async (options) => {
    try {
      console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║     BRAND EVOLUTION WORKSHOP                          ║'));
      console.log(chalk.bold.cyan('║     Human-AI Collaborative Strategy Development       ║'));
      console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════╝\n'));

      // Load creative direction config if provided
      let creativeConfig: CreativeDirectionConfig | undefined;
      if (options.config) {
        console.log(chalk.gray(`Loading config from: ${options.config}\n`));
        try {
          creativeConfig = await FileSystemUtils.readJSON<CreativeDirectionConfig>(options.config);
          console.log(chalk.green('✓ Config loaded successfully (non-interactive mode)\n'));
        } catch (error) {
          const normalized = error instanceof Error ? error : new Error(String(error));
          throw new CommandExecutionError(
            `Failed to load config file: ${options.config}`,
            { cause: normalized }
          );
        }
      }

      const config: EvolutionConfig = {
        brandName: options.brand,
        brandUrl: options.url,
        competitorUrls: options.competitors || [],
        outputDir: options.output,
        resumeFromPhase: options.resume,
        creativeDirectionConfig: creativeConfig, // Pass config to orchestrator
      };

      logger.info('Starting evolution workshop', config);

      const orchestrator = new EvolutionOrchestrator(config);

      // Load previous state if resuming
      if (options.resume) {
        await orchestrator.loadState();
        console.log(chalk.yellow(`Resuming from phase: ${options.resume}\n`));
      }

      // Run the workshop
      const result = await orchestrator.run();

      console.log(chalk.bold.green('\n🎉 Brand Evolution Strategy Complete!\n'));
      console.log(chalk.cyan('Key Outputs:'));
      console.log(chalk.gray(`  • Positioning: ${result.positioningFramework.statement}`));
      console.log(chalk.gray(`  • Tagline: "${result.messagingArchitecture.tagline}"`));
      console.log(chalk.gray(`  • Themes: ${result.messagingArchitecture.brandEssence}`));

      console.log(chalk.cyan('\n📂 Files generated:'));
      console.log(chalk.gray('  • 01-research-blitz.json'));
      console.log(chalk.gray('  • 02-patterns.md'));
      console.log(chalk.gray('  • 03-creative-direction.md'));
      console.log(chalk.gray('  • 04-validation.md'));
      console.log(chalk.gray('  • 05-brand-evolution-strategy.md (main deliverable)'));

      console.log(chalk.cyan('\n💡 Next Steps:'));
      console.log(chalk.gray('  1. Review the brand evolution strategy document'));
      console.log(chalk.gray('  2. Share with stakeholders for feedback'));
      console.log(chalk.gray('  3. Begin implementation based on roadmap'));
      console.log(chalk.gray('  4. Track success metrics defined in the strategy\n'));

      return;
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Evolution workshop failed for ${options.brand}`, normalizedError);
      handleCommandError('evolve', normalizedError);
    }
  });

// Subcommands for running individual phases

evolveCommand
  .command('research')
  .description('Run only Phase 1: Research Blitz')
  .requiredOption('--brand <name>', 'Brand name')
  .requiredOption('--url <url>', 'Brand website URL')
  .option('--competitors <urls...>', 'Competitor URLs')
  .option('--output <dir>', 'Output directory')
  .option('--force', 'Re-run the phase even if already complete')
  .action(async (options) => {
    try {
      await runPhaseCommand('research', {
        brand: options.brand,
        url: options.url,
        competitors: options.competitors,
        output: options.output,
        force: options.force,
      });
    } catch (error) {
      handleCommandError('evolve research', error);
    }
  });

evolveCommand
  .command('present')
  .description('Run only Phase 2: Pattern Presentation')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .option('--url <url>', 'Brand website URL (required if Phase 1 not previously completed)')
  .option('--competitors <urls...>', 'Competitor URLs')
  .option('--force', 'Re-run the phase even if already complete')
  .action(async (options) => {
    try {
      await runPhaseCommand('patterns', {
        brand: options.brand,
        url: options.url,
        competitors: options.competitors,
        output: options.output,
        force: options.force,
      });
    } catch (error) {
      handleCommandError('evolve present', error);
    }
  });

evolveCommand
  .command('direct')
  .description('Run only Phase 3: Creative Direction')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .option('--url <url>', 'Brand website URL (required if earlier phases not completed)')
  .option('--competitors <urls...>', 'Competitor URLs')
  .option('--config <path>', 'Creative direction config file (enables non-interactive mode)')
  .option('--force', 'Re-run the phase even if already complete')
  .action(async (options) => {
    try {
      await runPhaseCommand('direction', {
        brand: options.brand,
        url: options.url,
        competitors: options.competitors,
        output: options.output,
        configPath: options.config,
        force: options.force,
      });
    } catch (error) {
      handleCommandError('evolve direct', error);
    }
  });

evolveCommand
  .command('validate')
  .description('Run only Phase 4: Validation')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .option('--url <url>', 'Brand website URL (required if earlier phases not completed)')
  .option('--competitors <urls...>', 'Competitor URLs')
  .option('--config <path>', 'Creative direction config file (used if creative direction needs to be captured non-interactively)')
  .option('--force', 'Re-run the phase even if already complete')
  .action(async (options) => {
    try {
      await runPhaseCommand('validation', {
        brand: options.brand,
        url: options.url,
        competitors: options.competitors,
        output: options.output,
        configPath: options.config,
        force: options.force,
      });
    } catch (error) {
      handleCommandError('evolve validate', error);
    }
  });

evolveCommand
  .command('build')
  .description('Run only Phase 5: Build-Out')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .option('--url <url>', 'Brand website URL (required if earlier phases not completed)')
  .option('--competitors <urls...>', 'Competitor URLs')
  .option('--config <path>', 'Creative direction config file (used if creative direction needs to be captured non-interactively)')
  .option('--force', 'Re-run the phase even if already complete')
  .action(async (options) => {
    try {
      await runPhaseCommand('buildout', {
        brand: options.brand,
        url: options.url,
        competitors: options.competitors,
        output: options.output,
        configPath: options.config,
        force: options.force,
      });
    } catch (error) {
      handleCommandError('evolve build', error);
    }
  });
