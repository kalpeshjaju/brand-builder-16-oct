// Narrative Command - Generate comprehensive 6-act narrative package

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { NarrativeBuilder } from '../../narrative/narrative-builder.js';
import { NarrativeHTMLGenerator } from '../../narrative/narrative-html-generator.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import type { BrandStrategy } from '../../types/index.js';
import path from 'path';
import { handleCommandError } from '../utils/error-handler.js';

export interface NarrativeCommandOptions {
  brand: string;
  output?: string;
  format?: 'html' | 'json' | 'both';
}

export async function narrativeCommand(options: NarrativeCommandOptions): Promise<void> {
  const { brand, output, format = 'html' } = options;

  console.log(chalk.blue('\n📖 Brand Narrative Generator\n'));
  console.log(`Brand: ${chalk.bold(brand)}`);
  console.log(`Format: ${chalk.bold(format)}\n`);

  const spinner = ora('Loading brand data...').start();

  try {
    // 1. Initialize narrative builder
    const builder = new NarrativeBuilder(brand);

    // 2. Load strategy (if exists)
    spinner.text = 'Loading strategy...';
    const strategyPath = path.join('outputs', 'strategies', `${brand}-strategy.json`);
    try {
      const strategy = await FileSystemUtils.readJSON(strategyPath) as BrandStrategy;
      builder.setStrategy(strategy);
      spinner.succeed(`Strategy loaded: ${strategyPath}`);
    } catch (error) {
      spinner.warn(`No strategy found at ${strategyPath} (optional)`);
    }

    // 3. Load evolution outputs (if exists)
    spinner.start('Loading evolution outputs...');
    const evolutionDir = path.join('outputs', 'evolution', brand);

    try {
      const evolutionFiles = await FileSystemUtils.listFiles(evolutionDir);
      const evolutionOutputs: any = {};

      // Load research blitz (Phase 1)
      if (evolutionFiles.includes('01-research-blitz.json')) {
        const researchBlitz = await FileSystemUtils.readJSON(
          path.join(evolutionDir, '01-research-blitz.json')
        ) as Record<string, any>;
        evolutionOutputs.phase1 = {
          contradictions: researchBlitz['contradictions'] || [],
          analysis: researchBlitz,
        };
      }

      // Load patterns (Phase 2)
      if (evolutionFiles.includes('02-patterns.json')) {
        const patterns = await FileSystemUtils.readJSON(
          path.join(evolutionDir, '02-patterns.json')
        ) as Record<string, any>;
        evolutionOutputs.phase2 = {
          languageGaps: patterns['languageGaps'] || [],
          inflectionPoints: patterns['inflectionPoints'] || [],
          marketWhiteSpace: patterns['whiteSpace'] || [],
        };
      }

      if (Object.keys(evolutionOutputs).length > 0) {
        builder.setEvolutionOutputs(evolutionOutputs);
        spinner.succeed(`Evolution outputs loaded from ${evolutionDir}`);
      } else {
        spinner.warn(`No evolution outputs found (optional)`);
      }
    } catch (error) {
      spinner.warn(`No evolution outputs found (optional)`);
    }

    // 4. Load audit (if exists)
    spinner.start('Loading audit results...');
    const auditPath = path.join('outputs', 'audits', `${brand}-audit.json`);
    try {
      const auditResults = await FileSystemUtils.readJSON(auditPath);
      builder.setAuditResults(auditResults);
      spinner.succeed(`Audit loaded: ${auditPath}`);
    } catch (error) {
      spinner.warn(`No audit found at ${auditPath} (optional)`);
    }

    // 5. Build narrative structure
    spinner.start('Building 6-act narrative structure...');
    const narrative = await builder.build();
    spinner.succeed(`Narrative built: ${narrative.acts.length} acts, ${narrative.metadata.totalDocuments} documents`);

    // 6. Generate outputs
    const basePath = output || path.join('outputs', 'narratives', `${brand}-narrative`);

    // JSON output
    if (format === 'json' || format === 'both') {
      spinner.start('Generating JSON output...');
      await FileSystemUtils.writeJSON(`${basePath}.json`, narrative);
      spinner.succeed(`JSON saved: ${basePath}.json`);
    }

    // HTML output
    if (format === 'html' || format === 'both') {
      spinner.start('Generating comprehensive HTML package...');
      const htmlGenerator = new NarrativeHTMLGenerator();
      const html = await htmlGenerator.generatePackage(narrative);

      await FileSystemUtils.writeFile(`${basePath}.html`, html);

      const stats = await FileSystemUtils.getFileStats(`${basePath}.html`);
      spinner.succeed(`HTML saved: ${basePath}.html (${Math.round(stats.size / 1024)} KB)`);
    }

    // Summary
    console.log(chalk.green('\n✅ Narrative generation complete!\n'));
    console.log(chalk.bold('📊 Package Summary:'));
    console.log(`   Acts: ${narrative.acts.length}`);
    console.log(`   Documents: ${narrative.metadata.totalDocuments}`);
    console.log(`   Total Words: ${narrative.metadata.totalWords.toLocaleString()}`);

    console.log(chalk.bold('\n📁 Files Generated:'));
    if (format === 'json' || format === 'both') {
      console.log(`   ${basePath}.json`);
    }
    if (format === 'html' || format === 'both') {
      console.log(`   ${basePath}.html`);
    }

    console.log(chalk.bold('\n📖 Acts Included:'));
    narrative.acts.forEach(act => {
      console.log(`   ${act.actNumber}. ${act.title} (${act.documents.length} documents)`);
    });

    console.log(chalk.dim('\n💡 Tip: Open the HTML file in a browser for the best reading experience\n'));
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Narrative command failed', normalizedError);

    if (normalizedError.message.includes('ENOENT')) {
      console.log(chalk.yellow('💡 Troubleshooting:'));
      console.log('   1. Ensure brand workspace exists (run: brandos init -b <brand>)');
      console.log('   2. Generate strategy first (run: brandos generate -b <brand>)');
      console.log('   3. Run evolution workshop (run: brandos evolve -b <brand>)');
      console.log('   4. Run audit (run: brandos audit -i outputs/strategies/<brand>-strategy.json)');
    }

    handleCommandError('narrative', normalizedError, spinner);
  }
}

// Command definition
export const narrativeCommandDef = new Command('narrative')
  .description('Generate comprehensive 6-act narrative package from brand data')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .option('-o, --output <path>', 'Output file path (without extension)')
  .option('-f, --format <type>', 'Output format (html|json|both)', 'html')
  .action(narrativeCommand);
