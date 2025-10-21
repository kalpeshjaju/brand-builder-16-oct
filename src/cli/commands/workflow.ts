import { Command } from 'commander';
import ora from 'ora';
import path from 'path';
import chalk from 'chalk';
import { ConfigOrchestrator } from '../../orchestrator/config-orchestrator.js';
import { AgentFactory } from '../../orchestrator/AgentFactory.js';
import { handleCommandError } from '../utils/error-handler.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import type { PatternPresentationOutput, ResearchBlitzOutput } from '../../types/evolution-types.js';
import { PatternPresenter } from '../../evolution/pattern-presenter.js';

async function runWorkflow(options: {
  brand: string;
  url: string;
  competitors?: string[];
  config?: string;
  output?: string;
  explain?: boolean;
  resume?: boolean;
  force?: boolean;
}) {
  const spinner = ora('Running agentic workflow...').start();
  try {
    const cfgPath = options.config || path.join('config', 'workflow.json');
    if (options.explain) {
      const rawText = await FileSystemUtils.readFile(cfgPath);
      const raw = JSON.parse(rawText);
      const { validateWorkflowConfig } = await import('../../config/workflow-validator.js');
      const validation = validateWorkflowConfig(raw);
      if (!validation.ok) {
        spinner.fail('Invalid workflow configuration');
        console.log(validation.errors.join('\n'));
        return;
      }
      spinner.stop();
      console.log(chalk.bold('\nExecution Plan (Explain)'));
      console.log(`Brand: ${options.brand}`);
      console.log(`URL: ${options.url}`);
      console.log(`Competitors: ${(options.competitors || []).length}`);
      for (const stage of validation.data.stages) {
        console.log(`\nStage: ${stage.name}`);
        for (const a of stage.agents) {
          const meta = AgentFactory.getMetadata(a.name);
          const desc = meta?.metadata?.description || 'No description available';
          console.log(`  - ${a.name}: ${desc}`);
        }
      }
      console.log('');
      spinner.start('Running agentic workflow...');
    }
    // Determine output directory (reuse evolution outputs path for compatibility)
    const outDir = options.output || path.join('outputs', 'evolution', options.brand.toLowerCase().replace(/\s+/g, '-'));
    await FileSystemUtils.ensureDir(outDir);

    // Build include set (resume-aware)
    const include = new Set<string>();
    const primaryOutput: Record<string, string> = {
      'evolution.research-blitz': '01-research-blitz.json',
      'evolution.pattern-presentation': '02-patterns.json',
      'evolution.creative-direction': '03-creative-direction.json',
      'evolution.validation': '04-validation.json',
      'evolution.build-out': '05-buildout.json',
      'docs.teardown': '06-teardown-swot.json',
      'docs.narrative': '07-narrative-package.json',
      'genesis.research-topics': '08-research-topics.json',
      'genesis.deliverables-bundle': '09-deliverables-bundle.json',
      'guardian.source-quality': '10a-source-quality.json',
      'guardian.recency': '10b-recency.json',
      'guardian.readiness': '10c-readiness.json',
      'guardian.gates': '10-guardian-gates.json',
      'docs.product-catalog': '11-product-catalog.json',
      'docs.pricing-guide': '12-pricing-guide.json',
      'docs.corporate-catalog': '13-corporate-catalog.json',
      'docs.training-guide': '14-training-guide.json',
      'docs.asset-map': '15-asset-map.json',
    };

    const rawCfgText = await FileSystemUtils.readFile(cfgPath);
    const rawCfg = JSON.parse(rawCfgText) as { stages: Array<{ name: string; agents: Array<{ name: string }> }> };
    for (const stage of rawCfg.stages) {
      for (const a of stage.agents) {
        const outFile = primaryOutput[a.name];
        if (!options.resume || !outFile) {
          include.add(a.name);
          continue;
        }
        const exists = await FileSystemUtils.fileExists(path.join(outDir, outFile));
        if (exists && !options.force) {
          // skip
        } else {
          include.add(a.name);
        }
      }
    }

    // Preload existing outputs into initial results so dependent agents can run under --resume
    const initialResults: Record<string, unknown> = {};
    for (const [agent, file] of Object.entries(primaryOutput)) {
      const fp = path.join(outDir, file);
      // Only preload known upstream phases by file presence
      if (await FileSystemUtils.fileExists(fp)) {
        try {
          const data = await FileSystemUtils.readJSON(fp);
          initialResults[agent] = data;
        } catch {}
      }
    }

    const orchestrator = new ConfigOrchestrator({
      brandName: options.brand,
      brandUrl: options.url,
      competitorUrls: options.competitors || [],
    });
    const results = await orchestrator.runFromFile(cfgPath, { include, overrideUseOracle: !!(options as any)['useOracle'], initialResults });

    // Save Research Blitz output
    const r1 = results['evolution.research-blitz'];
    if (r1?.success && r1.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '01-research-blitz.json'), r1.data as ResearchBlitzOutput);
    }

    // Save Pattern Presentation output + markdown
    const r2 = results['evolution.pattern-presentation'];
    if (r2?.success && r2.data) {
      const data = r2.data as PatternPresentationOutput;
      await FileSystemUtils.writeJSON(path.join(outDir, '02-patterns.json'), data);

      // Generate markdown presentation for readability
      const presenter = new PatternPresenter();
      const md = presenter.generateMarkdownPresentation(data);
      await FileSystemUtils.writeFile(path.join(outDir, '02-patterns.md'), md);
    }

    // Optional phases 3-5 outputs if present
    const r3 = results['evolution.creative-direction'];
    if (r3?.success && r3.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '03-creative-direction.json'), r3.data);
      const md = generateCreativeDirectionMarkdown(r3.data as any);
      await FileSystemUtils.writeFile(path.join(outDir, '03-creative-direction.md'), md);
    }

    const r4 = results['evolution.validation'];
    if (r4?.success && r4.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '04-validation.json'), r4.data);
      const md = generateValidationMarkdown(r4.data as any);
      await FileSystemUtils.writeFile(path.join(outDir, '04-validation.md'), md);
    }

    const r5 = results['evolution.build-out'];
    if (r5?.success && r5.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '05-buildout.json'), r5.data);
      const md = generateBuildoutMarkdown(r5.data as any);
      await FileSystemUtils.writeFile(path.join(outDir, '05-brand-evolution-strategy.md'), md);
    }

    // Documentation agents
    const r6 = results['docs.teardown'];
    if (r6?.success && r6.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '06-teardown-swot.json'), r6.data);
    }
    const r7 = results['docs.narrative'];
    if (r7?.success && r7.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '07-narrative-package.json'), r7.data);
    }
    const oc = results['oracle.context'];
    if (oc?.success && oc.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '00-oracle-context.json'), oc.data);
    }

    // Horizon framework outputs
    const r8 = results['genesis.research-topics'];
    if (r8?.success && r8.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '08-research-topics.json'), r8.data);
    }
    const r9 = results['genesis.deliverables-bundle'];
    // Guardian gates
    const r10 = results['guardian.gates'];
    if (r10?.success && r10.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '10-guardian-gates.json'), r10.data);
    }
    if (r9?.success && r9.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '09-deliverables-bundle.json'), r9.data);
    }

    // Guardian micro outputs
    const g1 = results['guardian.source-quality'];
    if (g1?.success && g1.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '10a-source-quality.json'), g1.data);
    }
    const g2 = results['guardian.recency'];
    if (g2?.success && g2.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '10b-recency.json'), g2.data);
    }
    const g3 = results['guardian.readiness'];
    if (g3?.success && g3.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '10c-readiness.json'), g3.data);
    }
    const g4 = results['guardian.numeric-variance'];
    if (g4?.success && g4.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '10d-numeric-variance.json'), g4.data);
    }
    const g5 = results['guardian.cross-verify'];
    if (g5?.success && g5.data) {
      await FileSystemUtils.writeJSON(path.join(outDir, '10e-cross-verify.json'), g5.data);
    }

    // If require-pass, enforce guardian gates
    if ((options as any)['requirePass']) {
      const guardianPath = path.join(outDir, '10-guardian-gates.json');
      if (await FileSystemUtils.fileExists(guardianPath)) {
        const g = await FileSystemUtils.readJSON<any>(guardianPath);
        if (g?.overall !== 'pass') {
          spinner.fail('Quality gates failed (guardian.gates)');
          console.error(chalk.red('Run with --explain and review recommendations in 10-guardian-gates.json'));
          process.exitCode = 1;
          return;
        }
      }
    }

    // Manifest and summary
    const manifest = await createRunManifest({
      cfgPath,
      outDir,
      brand: options.brand,
      include,
      results: results as any,
      primaryOutput,
      resume: !!options.resume,
      force: !!options.force,
    });
    await FileSystemUtils.writeJSON(path.join(outDir, 'run-manifest.json'), manifest);
    printFinalSummary(manifest);

    spinner.succeed('Workflow completed');
    console.log(chalk.cyan(`\n📁 Outputs saved to: ${outDir}\n`));
  } catch (error) {
    handleCommandError('workflow run', error, spinner);
  }
}

export const workflowCommand = new Command('workflow')
  .description('Run config-driven agentic workflow');

workflowCommand
  .command('run')
  .description('Execute stages defined in config/workflow.json')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .requiredOption('-u, --url <url>', 'Brand website URL')
  .option('-c, --competitors <urls...>', 'Competitor URLs')
  .option('-f, --config <path>', 'Workflow config path', path.join('config', 'workflow.json'))
  .option('-o, --output <dir>', 'Output directory (defaults to outputs/evolution/<brand>)')
  .option('-x, --explain', 'Explain plan before execution')
  .option('-r, --resume', 'Skip agents when their outputs already exist')
  .option('--force', 'Re-run even if outputs exist (overrides --resume)')
  .option('--use-oracle', 'Enable ORACLE context retrieval (requires Python deps)')
  .option('--require-pass', 'Exit non-zero if guardian gates overall=fail')
  .action(runWorkflow);

function generateCreativeDirectionMarkdown(output: any): string {
  let md = `# Creative Direction: ${output.brandName}\n\n`;
  md += `*Captured: ${new Date(output.generatedAt || Date.now()).toLocaleDateString()}*\n\n`;
  md += `---\n\n`;
  md += `## 🎯 Primary Direction\n\n`;
  md += `**${output.primaryDirection || ''}**\n\n`;
  if (Array.isArray(output.keyThemes) && output.keyThemes.length) {
    md += `**Key Themes**: ${output.keyThemes.join(', ')}\n\n`;
  }
  return md;
}

function generateValidationMarkdown(v: any): string {
  let md = `# Validation Report: ${v.brandName}\n\n`;
  md += `*Generated: ${new Date(v.generatedAt || Date.now()).toLocaleDateString()}*\n\n`;
  md += `## Recommendation\n\n**${String(v.recommendation || '').toUpperCase()}** (Confidence ${(v.overallConfidence * 10).toFixed(1)}/10)\n\n`;
  md += `## Differentiation Score\n\n${(v.differentiationScore * 10).toFixed(1)}/10\n\n`;
  md += `## Alignment\n\nScore: ${(v.alignmentCheck?.score ?? 5)}/10\n\n`;
  return md;
}

function generateBuildoutMarkdown(b: any): string {
  let md = `# Brand Evolution Strategy: ${b.brandName}\n\n`;
  md += `*Generated: ${new Date(b.generatedAt || Date.now()).toLocaleDateString()}*\n\n`;
  md += `## Executive Summary\n\n${b.executiveSummary || ''}\n\n`;
  md += `## Positioning Framework\n\n- ${b.positioningFramework?.statement || ''}\n\n`;
  md += `## Messaging Architecture\n\n- Tagline: ${b.messagingArchitecture?.tagline || ''}\n\n`;
  return md;
}

async function createRunManifest(params: {
  cfgPath: string;
  outDir: string;
  brand: string;
  include: Set<string>;
  results: Record<string, { success: boolean; error?: string }>;
  primaryOutput: Record<string, string>;
  resume: boolean;
  force: boolean;
}) {
  const raw = JSON.parse(await FileSystemUtils.readFile(params.cfgPath));
  const stages: Array<{ name: string; agents: Array<{ name: string; status: string; output?: string[]; error?: string }> }> = [];
  for (const stage of raw.stages as Array<{ name: string; agents: Array<{ name: string }> }>) {
    const agents: Array<{ name: string; status: string; output?: string[]; error?: string }> = [];
    for (const a of stage.agents) {
      if (params.include.has(a.name)) {
        const res = params.results[a.name];
        const status = res?.success ? 'success' : 'error';
        const error = res?.success ? undefined : res?.error || 'unknown error';
        const out = params.primaryOutput[a.name];
        agents.push({ name: a.name, status, output: out ? [out] : undefined, error });
      } else {
        const out = params.primaryOutput[a.name];
        agents.push({ name: a.name, status: 'skipped', output: out ? [out] : undefined });
      }
    }
    stages.push({ name: stage.name, agents });
  }
  const startedAt = new Date().toISOString();
  const finishedAt = new Date().toISOString();
  return { brand: params.brand, startedAt, finishedAt, stages, options: { resume: params.resume, force: params.force } };
}

function printFinalSummary(manifest: any): void {
  console.log(chalk.bold('\nSummary by Agent'));
  for (const stage of manifest.stages) {
    console.log(chalk.cyan(`\nStage: ${stage.name}`));
    for (const a of stage.agents) {
      const statusColor = a.status === 'success' ? chalk.green : a.status === 'skipped' ? chalk.yellow : chalk.red;
      console.log(`  - ${a.name}: ${statusColor(a.status)}${a.error ? ` (${a.error})` : ''}`);
    }
  }
  console.log('');
}
