import { Command } from 'commander';
import path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import { buildExecutiveReport } from '../../presentation/report-builder.js';

async function reportCommandHandler(options: { brand: string; output?: string }) {
  const html = await buildExecutiveReport(options.brand);
  const outPath = options.output || path.join('outputs', 'evolution', options.brand.toLowerCase().replace(/\s+/g, '-'), 'brand-report.html');
  await FileSystemUtils.writeFile(outPath, html);
  console.log(`Report written to: ${outPath}`);
}

export const reportCommand = new Command('report')
  .description('Generate a single HTML report combining phase outputs')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .option('-o, --output <path>', 'Output HTML path (defaults to outputs/evolution/<brand>/brand-report.html)')
  .action(reportCommandHandler);

