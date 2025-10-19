/**
 * Phase 3: Creative Direction Capture
 *
 * Supports both interactive (inquirer prompts) and non-interactive (config-driven) modes
 * Based on patterns presented in Phase 2
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import type {
  PatternPresentationOutput,
  CreativeDirectionOutput,
  SelectedContradiction,
  WhiteSpaceDecision,
  CreativeLeap,
  Intuition,
  DirectionDecision
} from '../types/evolution-types.js';
import type { CreativeDirectionConfig, CreativeDirectorMode } from '../types/evolution-config-types.js';

const logger = new Logger('CreativeDirector');

export class CreativeDirector {
  /**
   * Capture creative direction (supports interactive and config modes)
   */
  async captureDirection(
    patterns: PatternPresentationOutput,
    mode: CreativeDirectorMode = 'interactive',
    config?: CreativeDirectionConfig
  ): Promise<CreativeDirectionOutput> {
    logger.info('Starting creative direction session', {
      brand: patterns.brandName,
      mode,
    });

    if (mode === 'config') {
      return await this.captureFromConfig(patterns, config!);
    }

    return await this.captureInteractive(patterns);
  }

  /**
   * Capture direction from pre-defined configuration (non-interactive)
   */
  private async captureFromConfig(
    patterns: PatternPresentationOutput,
    config: CreativeDirectionConfig
  ): Promise<CreativeDirectionOutput> {
    logger.info('Using config-driven mode', { brand: patterns.brandName });

    console.log(chalk.bold.cyan('\n🎨 Creative Direction (Config Mode)\n'));
    console.log(chalk.gray(`Brand: ${patterns.brandName}`));
    console.log(chalk.gray(`Loading configuration...\n`));

    // Process contradictions from config
    const selectedContradictions: SelectedContradiction[] = [];
    config.contradictions.forEach((item) => {
      const contradiction = patterns.contradictions.find((c) => c.id === item.patternId);
      if (contradiction && item.action !== 'skip') {
        selectedContradictions.push({
          patternId: item.patternId,
          pattern: `${contradiction.brandSays} vs ${contradiction.evidenceShows}`,
          direction: item.direction || 'Keep in consideration',
          reasoning: contradiction.implication,
        });
      }
    });

    // Process white space from config
    const whiteSpaceDecisions: WhiteSpaceDecision[] = [];
    config.whiteSpace.forEach((item) => {
      const ws = patterns.whiteSpace.find((w) => w.id === item.gapId);
      if (ws) {
        whiteSpaceDecisions.push({
          gapId: item.gapId,
          gap: ws.description,
          decision: item.decision,
          reasoning: item.reasoning,
        });
      }
    });

    // Process creative leaps from config
    const creativeLeaps: CreativeLeap[] = config.creativeLeaps.map((leap) => ({
      idea: leap.idea,
      rationale: leap.rationale,
      relatedPatterns: [], // Auto-detect not implemented in config mode
    }));

    // Process intuitions from config
    const intuitions: Intuition[] = config.intuitions;

    const output: CreativeDirectionOutput = {
      brandName: patterns.brandName,
      generatedAt: new Date().toISOString(),
      selectedContradictions,
      whiteSpaceDecisions,
      creativeLeaps,
      intuitions,
      primaryDirection: config.primaryDirection,
      keyThemes: config.keyThemes,
    };

    console.log(chalk.bold.green('\n✅ Creative direction loaded from config!\n'));
    this.printSummary(output);

    return output;
  }

  /**
   * Capture direction interactively (original behavior)
   */
  private async captureInteractive(patterns: PatternPresentationOutput): Promise<CreativeDirectionOutput> {
    logger.info('Using interactive mode', { brand: patterns.brandName });

    console.log(chalk.bold.cyan('\n🎨 Creative Direction Session\n'));
    console.log(chalk.gray(`Brand: ${patterns.brandName}\n`));
    console.log(chalk.yellow('Your role: Make creative leaps based on the patterns shown.\n'));
    console.log(chalk.gray('Claude will validate and build out your direction.\n'));

    const selectedContradictions: SelectedContradiction[] = [];
    const whiteSpaceDecisions: WhiteSpaceDecision[] = [];
    const creativeLeaps: CreativeLeap[] = [];
    const intuitions: Intuition[] = [];

    try {
      // Part 1: Review Contradictions
      if (patterns.contradictions.length > 0) {
        console.log(chalk.bold('\n📋 Part 1: Contradictions Review\n'));
        const contradictionSelections = await this.reviewContradictions(patterns.contradictions);
        selectedContradictions.push(...contradictionSelections);
      }

      // Part 2: Review White Space
      if (patterns.whiteSpace.length > 0) {
        console.log(chalk.bold('\n📋 Part 2: Market White Space\n'));
        const whiteSpaceSelections = await this.reviewWhiteSpace(patterns.whiteSpace);
        whiteSpaceDecisions.push(...whiteSpaceSelections);
      }

      // Part 3: Capture Creative Leaps
      console.log(chalk.bold('\n💡 Part 3: Creative Leaps\n'));
      const leaps = await this.captureCreativeLeaps(selectedContradictions, whiteSpaceDecisions);
      creativeLeaps.push(...leaps);

      // Part 4: Capture Intuitions
      console.log(chalk.bold('\n🔮 Part 4: Your Intuitions\n'));
      const captured = await this.captureIntuitions();
      intuitions.push(...captured);

      // Part 5: Define Primary Direction
      console.log(chalk.bold('\n🎯 Part 5: Primary Direction\n'));
      const { primaryDirection, keyThemes } = await this.definePrimaryDirection(creativeLeaps);

      const output: CreativeDirectionOutput = {
        brandName: patterns.brandName,
        generatedAt: new Date().toISOString(),
        selectedContradictions,
        whiteSpaceDecisions,
        creativeLeaps,
        intuitions,
        primaryDirection,
        keyThemes,
      };

      console.log(chalk.bold.green('\n✅ Creative direction captured!\n'));
      this.printSummary(output);

      return output;
    } catch (error) {
      logger.error('Direction capture failed', error);
      throw new Error(
        `Failed to capture creative direction\n` +
        `Reason: ${(error as Error).message}`
      );
    }
  }

  /**
   * Review contradictions interactively
   */
  private async reviewContradictions(
    contradictions: PatternPresentationOutput['contradictions']
  ): Promise<SelectedContradiction[]> {
    const selections: SelectedContradiction[] = [];

    for (const [index, contradiction] of contradictions.entries()) {
      console.log(chalk.cyan(`\n${index + 1}/${contradictions.length}`));
      console.log(chalk.bold(`Contradiction: ${contradiction.id}`));
      console.log(chalk.yellow(`Brand Says: ${contradiction.brandSays}`));
      console.log(chalk.yellow(`Evidence Shows: ${contradiction.evidenceShows}`));
      console.log(chalk.gray(`Implication: ${contradiction.implication}`));
      console.log(chalk.gray(`Severity: ${contradiction.severity}`));

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'How should we treat this contradiction?',
          choices: [
            { name: '✅ Explore - This is interesting', value: 'explore' },
            { name: '⏭️  Skip - Not relevant', value: 'skip' },
            { name: '📝 Note - Keep in mind', value: 'note' },
          ],
        },
      ]);

      if (action !== 'skip') {
        const { direction } = await inquirer.prompt([
          {
            type: 'input',
            name: 'direction',
            message: 'Your creative direction for this contradiction:',
            when: action === 'explore',
          },
        ]);

        if (action === 'explore' && direction) {
          selections.push({
            patternId: contradiction.id,
            pattern: `${contradiction.brandSays} vs ${contradiction.evidenceShows}`,
            direction,
            reasoning: contradiction.implication,
          });
        } else if (action === 'note') {
          selections.push({
            patternId: contradiction.id,
            pattern: `${contradiction.brandSays} vs ${contradiction.evidenceShows}`,
            direction: 'Keep in consideration',
            reasoning: contradiction.implication,
          });
        }
      }
    }

    return selections;
  }

  /**
   * Review white space opportunities
   */
  private async reviewWhiteSpace(
    whiteSpace: PatternPresentationOutput['whiteSpace']
  ): Promise<WhiteSpaceDecision[]> {
    const decisions: WhiteSpaceDecision[] = [];

    for (const [index, ws] of whiteSpace.entries()) {
      console.log(chalk.cyan(`\n${index + 1}/${whiteSpace.length}`));
      console.log(chalk.bold(`White Space: ${ws.description}`));
      console.log(chalk.yellow(`Competitors Focus: ${ws.competitorFocus}`));
      console.log(chalk.yellow(`Untapped: ${ws.untappedOpportunity}`));

      const { decision } = await inquirer.prompt([
        {
          type: 'list',
          name: 'decision',
          message: 'What should we do with this white space?',
          choices: [
            { name: '🎯 Pursue - Own this space', value: 'pursue' },
            { name: '🔍 Explore - Investigate further', value: 'explore' },
            { name: '📝 Note - Keep in mind', value: 'note' },
            { name: '⏭️  Skip - Not for us', value: 'skip' },
          ],
        },
      ]);

      if (decision !== 'skip') {
        const { reasoning } = await inquirer.prompt([
          {
            type: 'input',
            name: 'reasoning',
            message: 'Why this decision?',
          },
        ]);

        decisions.push({
          gapId: ws.id,
          gap: ws.description,
          decision: decision as DirectionDecision,
          reasoning,
        });
      }
    }

    return decisions;
  }

  /**
   * Capture creative leaps
   */
  private async captureCreativeLeaps(
    contradictions: SelectedContradiction[],
    whiteSpace: WhiteSpaceDecision[]
  ): Promise<CreativeLeap[]> {
    const leaps: CreativeLeap[] = [];

    console.log(chalk.gray('\nBased on the patterns you selected, what creative leaps do you see?\n'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('- "Position as X instead of Y"'));
    console.log(chalk.gray('- "Own the contradiction - be the premium accessible brand"'));
    console.log(chalk.gray('- "Target segment Z that nobody else is addressing"\n'));

    let addMore = true;

    while (addMore) {
      const { idea } = await inquirer.prompt([
        {
          type: 'input',
          name: 'idea',
          message: 'Creative leap (or press Enter to finish):',
        },
      ]);

      if (!idea.trim()) {
        break;
      }

      const { rationale } = await inquirer.prompt([
        {
          type: 'input',
          name: 'rationale',
          message: 'Rationale for this leap:',
        },
      ]);

      // Ask which patterns this relates to
      const relatedPatterns: string[] = [];
      contradictions.forEach(c => {
        if (idea.toLowerCase().includes(c.pattern.toLowerCase().slice(0, 20))) {
          relatedPatterns.push(c.patternId);
        }
      });
      whiteSpace.forEach(ws => {
        if (idea.toLowerCase().includes(ws.gap.toLowerCase().slice(0, 20))) {
          relatedPatterns.push(ws.gapId);
        }
      });

      leaps.push({ idea, rationale, relatedPatterns });

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another creative leap?',
          default: false,
        },
      ]);

      addMore = more;
    }

    return leaps;
  }

  /**
   * Capture gut intuitions
   */
  private async captureIntuitions(): Promise<Intuition[]> {
    const intuitions: Intuition[] = [];

    console.log(chalk.gray('\nYour gut feelings, instincts, hunches...\n'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('- "Customers actually want Z, not what the market assumes"'));
    console.log(chalk.gray('- "This category is ready for disruption"'));
    console.log(chalk.gray('- "The premium positioning feels forced"\n'));

    let addMore = true;

    while (addMore) {
      const { observation } = await inquirer.prompt([
        {
          type: 'input',
          name: 'observation',
          message: 'Intuition (or press Enter to finish):',
        },
      ]);

      if (!observation.trim()) {
        break;
      }

      const { context } = await inquirer.prompt([
        {
          type: 'input',
          name: 'context',
          message: 'Context for this intuition:',
        },
      ]);

      const { confidence } = await inquirer.prompt([
        {
          type: 'list',
          name: 'confidence',
          message: 'How confident are you?',
          choices: [
            { name: '🔥 Very confident (0.9)', value: 0.9 },
            { name: '👍 Confident (0.7)', value: 0.7 },
            { name: '🤔 Moderate (0.5)', value: 0.5 },
            { name: '🤷 Low (0.3)', value: 0.3 },
          ],
        },
      ]);

      intuitions.push({ observation, context, confidence });

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another intuition?',
          default: false,
        },
      ]);

      addMore = more;
    }

    return intuitions;
  }

  /**
   * Define primary strategic direction
   */
  private async definePrimaryDirection(
    leaps: CreativeLeap[]
  ): Promise<{ primaryDirection: string; keyThemes: string[] }> {
    console.log(chalk.gray('\nSummarize your overall direction in one clear statement.\n'));

    if (leaps.length > 0) {
      console.log(chalk.gray('Your creative leaps:'));
      leaps.forEach((leap, i) => {
        console.log(chalk.gray(`${i + 1}. ${leap.idea}`));
      });
      console.log();
    }

    const { primaryDirection } = await inquirer.prompt([
      {
        type: 'input',
        name: 'primaryDirection',
        message: 'Primary direction (one sentence):',
        validate: (input: string) => {
          if (input.trim().length < 10) {
            return 'Please provide a clear direction statement';
          }
          return true;
        },
      },
    ]);

    const { keyThemes } = await inquirer.prompt([
      {
        type: 'input',
        name: 'keyThemes',
        message: 'Key themes (comma-separated):',
        filter: (input: string) => {
          return input.split(',').map(s => s.trim()).filter(Boolean);
        },
      },
    ]);

    return { primaryDirection, keyThemes };
  }

  /**
   * Print summary of captured direction
   */
  private printSummary(output: CreativeDirectionOutput): void {
    console.log(chalk.bold('\n📊 Summary\n'));
    console.log(chalk.cyan(`Primary Direction: ${output.primaryDirection}`));
    console.log(chalk.cyan(`Key Themes: ${output.keyThemes.join(', ')}`));
    console.log(chalk.gray(`\nSelected ${output.selectedContradictions.length} contradictions`));
    console.log(chalk.gray(`Made ${output.whiteSpaceDecisions.length} white space decisions`));
    console.log(chalk.gray(`Captured ${output.creativeLeaps.length} creative leaps`));
    console.log(chalk.gray(`Recorded ${output.intuitions.length} intuitions\n`));
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(output: CreativeDirectionOutput): string {
    let md = `# Creative Direction: ${output.brandName}\n\n`;
    md += `*Captured: ${new Date(output.generatedAt).toLocaleDateString()}*\n\n`;
    md += `---\n\n`;

    // Primary Direction
    md += `## 🎯 Primary Direction\n\n`;
    md += `**${output.primaryDirection}**\n\n`;
    md += `**Key Themes**: ${output.keyThemes.join(', ')}\n\n`;
    md += `---\n\n`;

    // Selected Contradictions
    if (output.selectedContradictions.length > 0) {
      md += `## ✅ Selected Contradictions\n\n`;
      output.selectedContradictions.forEach((sc, i) => {
        md += `### ${i + 1}. ${sc.patternId}\n\n`;
        md += `**Pattern**: ${sc.pattern}\n\n`;
        md += `**Direction**: ${sc.direction}\n\n`;
        md += `**Reasoning**: ${sc.reasoning}\n\n`;
      });
      md += `---\n\n`;
    }

    // White Space Decisions
    if (output.whiteSpaceDecisions.length > 0) {
      md += `## 🎯 White Space Decisions\n\n`;
      output.whiteSpaceDecisions.forEach((ws, i) => {
        const emoji = ws.decision === 'pursue' ? '🎯' : ws.decision === 'explore' ? '🔍' : '📝';
        md += `### ${i + 1}. ${emoji} ${ws.gap}\n\n`;
        md += `**Decision**: ${ws.decision}\n\n`;
        md += `**Reasoning**: ${ws.reasoning}\n\n`;
      });
      md += `---\n\n`;
    }

    // Creative Leaps
    if (output.creativeLeaps.length > 0) {
      md += `## 💡 Creative Leaps\n\n`;
      output.creativeLeaps.forEach((leap, i) => {
        md += `### ${i + 1}. ${leap.idea}\n\n`;
        md += `**Rationale**: ${leap.rationale}\n\n`;
        if (leap.relatedPatterns.length > 0) {
          md += `**Related Patterns**: ${leap.relatedPatterns.join(', ')}\n\n`;
        }
      });
      md += `---\n\n`;
    }

    // Intuitions
    if (output.intuitions.length > 0) {
      md += `## 🔮 Intuitions\n\n`;
      output.intuitions.forEach((intuition, i) => {
        const confidenceEmoji = intuition.confidence >= 0.8 ? '🔥' : intuition.confidence >= 0.6 ? '👍' : '🤔';
        md += `### ${i + 1}. ${confidenceEmoji} ${intuition.observation}\n\n`;
        md += `**Context**: ${intuition.context}\n\n`;
        md += `**Confidence**: ${intuition.confidence}\n\n`;
      });
    }

    return md;
  }
}
