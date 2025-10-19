/**
 * Evolve Command
 *
 * CLI command for Brand Evolution Workshop
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { EvolutionOrchestrator, type EvolutionConfig } from '../../evolution/evolution-orchestrator.js';
import type { CreativeDirectionConfig } from '../../types/evolution-config-types.js';
import { FileSystemUtils, Logger } from '../../utils/index.js';

const logger = new Logger('EvolveCommand');

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
          throw new Error(
            `Failed to load config file: ${options.config}\n` +
            `Reason: ${(error as Error).message}`
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

      process.exit(0);
    } catch (error) {
      logger.error('Evolution workshop failed', error);
      console.error(chalk.red('\n❌ Evolution workshop failed:'));
      console.error(chalk.red((error as Error).message));
      console.error(chalk.gray('\nSee logs for details.\n'));
      process.exit(1);
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
  .action(async (_options) => {
    // TODO: Implementation for standalone research phase
    console.log(chalk.yellow('Running Phase 1: Research Blitz only\n'));
    console.log(chalk.gray('Note: Standalone phase commands coming soon. Use full workflow for now.'));
  });

evolveCommand
  .command('present')
  .description('Run only Phase 2: Pattern Presentation')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .action(async (_options) => {
    console.log(chalk.yellow('Running Phase 2: Pattern Presentation only\n'));
    console.log(chalk.gray('Note: Standalone phase commands coming soon. Use full workflow for now.'));
  });

evolveCommand
  .command('direct')
  .description('Run only Phase 3: Creative Direction')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .action(async (_options) => {
    console.log(chalk.yellow('Running Phase 3: Creative Direction only\n'));
    console.log(chalk.gray('Note: Standalone phase commands coming soon. Use full workflow for now.'));
  });

evolveCommand
  .command('validate')
  .description('Run only Phase 4: Validation')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .action(async (_options) => {
    console.log(chalk.yellow('Running Phase 4: Validation only\n'));
    console.log(chalk.gray('Note: Standalone phase commands coming soon. Use full workflow for now.'));
  });

evolveCommand
  .command('build')
  .description('Run only Phase 5: Build-Out')
  .requiredOption('--brand <name>', 'Brand name')
  .option('--output <dir>', 'Output directory')
  .action(async (_options) => {
    console.log(chalk.yellow('Running Phase 5: Build-Out only\n'));
    console.log(chalk.gray('Note: Standalone phase commands coming soon. Use full workflow for now.'));
  });
