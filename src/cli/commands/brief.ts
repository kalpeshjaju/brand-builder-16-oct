// Brief Command - Generate agency creative brief

import { BriefGenerator } from '../../brief/brief-generator.js';
import { FileSystemUtils, loadStrategyFromFile } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

export interface BriefCommandOptions {
  brand?: string;
  input?: string;
  output?: string;
  format?: 'json' | 'html' | 'markdown';
  detail?: 'essential' | 'standard' | 'comprehensive';
}

export async function briefCommand(options: BriefCommandOptions): Promise<void> {
  const { brand, input, output, format = 'json', detail = 'standard' } = options;

  console.log(chalk.blue('\n📋 Agency Brief Generator\n'));

  const spinner = ora('Loading brand strategy...').start();

  try {
    // Determine input strategy file
    let strategyPath: string;
    let brandName: string;

    if (input) {
      strategyPath = input;
      const loaded = await loadStrategyFromFile(input);
      brandName = loaded.brandName;
      spinner.succeed(`Strategy loaded: ${strategyPath}`);
    } else if (brand) {
      strategyPath = path.join('outputs', 'strategies', `${brand}-strategy.json`);
      brandName = brand;

      if (!(await FileSystemUtils.fileExists(strategyPath))) {
        throw new Error(`Strategy not found at ${strategyPath}. Run 'brandos generate -b ${brand}' first.`);
      }

      spinner.succeed(`Strategy loaded for ${brandName}`);
    } else {
      throw new Error('Either --brand or --input is required');
    }

    // Load strategy
    const loaded = await loadStrategyFromFile(strategyPath);
    const strategy = loaded.strategy;

    // Generate brief
    spinner.start('Generating agency brief...');
    const generator = new BriefGenerator();
    const brief = await generator.generate(strategy, brandName, {
      includeExamples: detail !== 'essential',
      detailLevel: detail
    });

    spinner.succeed('Brief generated');

    // Save brief
    const basePath = output || path.join('outputs', 'briefs', `${brandName}-brief`);

    spinner.start('Saving brief...');

    if (format === 'json') {
      await FileSystemUtils.writeJSON(`${basePath}.json`, brief);
      spinner.succeed(`Brief saved: ${basePath}.json`);
    } else if (format === 'html') {
      const html = generateBriefHTML(brief);
      await FileSystemUtils.writeFile(`${basePath}.html`, html);
      spinner.succeed(`Brief saved: ${basePath}.html`);
    } else if (format === 'markdown') {
      const markdown = generateBriefMarkdown(brief);
      await FileSystemUtils.writeFile(`${basePath}.md`, markdown);
      spinner.succeed(`Brief saved: ${basePath}.md`);
    }

    // Display summary
    console.log(chalk.green('\n✅ Agency Brief Complete!\n'));
    console.log(chalk.bold('📊 Brief Summary:'));
    console.log(`   Brand: ${brief.brandName}`);
    console.log(`   Detail Level: ${detail}`);
    console.log(`   Format: ${format.toUpperCase()}`);

    console.log(chalk.bold('\n📋 Sections Included:'));
    console.log(`   ✓ Brand Identity (purpose, mission, vision, positioning)`);
    console.log(`   ✓ Visual Guidelines (colors, typography, logo, imagery)`);
    console.log(`   ✓ Asset Specifications (digital, print, social media)`);
    console.log(`   ✓ Messaging Framework (voice, tone, key messages)`);
    console.log(`   ✓ Execution Guidance (website, content, campaigns)`);

    console.log(chalk.bold('\n🎨 Ready for Agency:'));
    console.log(`   Color Palette: ${brief.visualGuidelines.colorPalette.primary.length} primary + ${brief.visualGuidelines.colorPalette.secondary.length} secondary colors`);
    console.log(`   Typography: ${brief.visualGuidelines.typography.primaryFont.name} (primary)`);
    console.log(`   Logo Variations: ${brief.visualGuidelines.logoGuidelines.variations.length} versions`);
    console.log(`   Deliverables: ${brief.assetSpecifications.deliverables.length} specified`);

    console.log(chalk.dim(`\n💡 Tip: Share this brief with your design/creative agency to ensure brand consistency\n`));

  } catch (error) {
    spinner.fail(chalk.red('Brief generation failed'));
    console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));

    if ((error as Error).message.includes('Strategy not found')) {
      console.log(chalk.yellow('💡 Troubleshooting:'));
      console.log('   1. Generate strategy first: brandos generate -b <brand>');
      console.log('   2. Or provide strategy file: brandos brief -i path/to/strategy.json');
    }

    process.exit(1);
  }
}

/**
 * Generate HTML from brief
 */
function generateBriefHTML(brief: any): string {
  // Simple HTML generation - can be enhanced later
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brief.brandName} - Agency Brief</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e293b; margin-top: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        h3 { color: #475569; margin-top: 24px; }
        .color-swatch { display: inline-block; width: 80px; height: 80px; border-radius: 4px; margin: 8px; }
        .metadata { color: #64748b; font-size: 0.9em; margin-bottom: 30px; }
        ul, ol { margin: 12px 0; padding-left: 24px; }
        li { margin: 8px 0; line-height: 1.6; }
        .section { margin: 40px 0; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>${brief.brandName} Agency Brief</h1>
    <div class="metadata">Generated: ${new Date(brief.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

    <div class="section">
        <h2>Brand Identity</h2>
        <h3>Purpose</h3>
        <p>${brief.brandIdentity.overview.purpose}</p>
        <h3>Mission</h3>
        <p>${brief.brandIdentity.overview.mission}</p>
        <h3>Vision</h3>
        <p>${brief.brandIdentity.overview.vision}</p>
        <h3>Positioning</h3>
        <p>${brief.brandIdentity.positioning.statement}</p>
    </div>

    <div class="section">
        <h2>Visual Guidelines</h2>
        <h3>Color Palette</h3>
        <div>
            ${brief.visualGuidelines.colorPalette.primary.map((c: any) => `
                <div style="display: inline-block; margin: 12px;">
                    <div class="color-swatch" style="background: ${c.hex};"></div>
                    <div style="text-align: center; margin-top: 8px;">
                        <strong>${c.name}</strong><br>
                        <code>${c.hex}</code>
                    </div>
                </div>
            `).join('')}
        </div>
        <h3>Typography</h3>
        <p><strong>Primary Font:</strong> ${brief.visualGuidelines.typography.primaryFont.name}</p>
        <p>${brief.visualGuidelines.typography.primaryFont.personality}</p>
    </div>

    <div class="section">
        <h2>Messaging Framework</h2>
        <h3>Brand Voice</h3>
        <p>${brief.messagingFramework.voice.description}</p>
        <h3>Key Messages</h3>
        <ol>
            ${brief.messagingFramework.keyMessages.primary.map((m: string) => `<li>${m}</li>`).join('')}
        </ol>
    </div>

    <footer style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; text-align: center;">
        <p>Generated by Brand Builder Pro • ${new Date().getFullYear()}</p>
    </footer>
</body>
</html>`;
}

/**
 * Generate Markdown from brief
 */
function generateBriefMarkdown(brief: any): string {
  const sections: string[] = [];

  sections.push(`# ${brief.brandName} - Agency Creative Brief`);
  sections.push('');
  sections.push(`**Generated:** ${new Date(brief.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Brand Identity
  sections.push('## Brand Identity');
  sections.push('');
  sections.push('### Overview');
  sections.push(`- **Purpose:** ${brief.brandIdentity.overview.purpose}`);
  sections.push(`- **Mission:** ${brief.brandIdentity.overview.mission}`);
  sections.push(`- **Vision:** ${brief.brandIdentity.overview.vision}`);
  sections.push(`- **Essence:** ${brief.brandIdentity.overview.essence}`);
  sections.push('');

  sections.push('### Positioning');
  sections.push(brief.brandIdentity.positioning.statement);
  sections.push('');

  // Visual Guidelines
  sections.push('## Visual Guidelines');
  sections.push('');
  sections.push('### Color Palette');
  brief.visualGuidelines.colorPalette.primary.forEach((color: any) => {
    sections.push(`- **${color.name}**: ${color.hex} - ${color.usage}`);
  });
  sections.push('');

  sections.push('### Typography');
  sections.push(`**Primary Font:** ${brief.visualGuidelines.typography.primaryFont.name}`);
  sections.push(`- ${brief.visualGuidelines.typography.primaryFont.personality}`);
  sections.push('');

  // Messaging
  sections.push('## Messaging Framework');
  sections.push('');
  sections.push('### Brand Voice');
  sections.push(brief.messagingFramework.voice.description);
  sections.push('');
  sections.push('### Key Messages');
  brief.messagingFramework.keyMessages.primary.forEach((msg: string, i: number) => {
    sections.push(`${i + 1}. ${msg}`);
  });
  sections.push('');

  // Asset Specifications
  sections.push('## Asset Deliverables');
  sections.push('');
  brief.assetSpecifications.deliverables.forEach((deliv: any) => {
    sections.push(`### ${deliv.name}`);
    sections.push(`- **Priority:** ${deliv.priority}`);
    sections.push(`- **Category:** ${deliv.category}`);
    sections.push(`- **Timeline:** ${deliv.timeline}`);
    sections.push(`- **Formats:** ${deliv.format.join(', ')}`);
    sections.push('');
  });

  return sections.join('\n');
}
