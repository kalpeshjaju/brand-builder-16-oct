import { Command } from 'commander';
import path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';

async function packageHandler(options: { brand: string; output?: string }) {
  const brand = options.brand;
  const base = path.join('outputs', 'evolution', brand.toLowerCase().replace(/\s+/g, '-'));
  const pkgDir = options.output || path.join(base, 'package');
  await FileSystemUtils.ensureDir(pkgDir);

  const files = [
    'brand-report.html',
    '01-research-blitz.json',
    '02-patterns.json', '02-patterns.md',
    '03-creative-direction.json', '03-creative-direction.md',
    '04-validation.json', '04-validation.md',
    '05-buildout.json', '05-brand-evolution-strategy.md',
    '06-teardown-swot.json', '07-narrative-package.json',
    '08-research-topics.json', '09-deliverables-bundle.json',
    '10-guardian-gates.json'
  ];

  const copied: string[] = [];
  for (const f of files) {
    const src = path.join(base, f);
    const exists = await FileSystemUtils.fileExists(src);
    if (exists) {
      const dest = path.join(pkgDir, f);
      await FileSystemUtils.writeFile(dest, await FileSystemUtils.readFile(src));
      copied.push(f);
    }
  }
  const manifest = { brand, createdAt: new Date().toISOString(), files: copied };
  await FileSystemUtils.writeJSON(path.join(pkgDir, 'manifest.json'), manifest);
  console.log(`Package created at: ${pkgDir}`);
}

export const packageCommand = new Command('package')
  .description('Assemble a package folder with key outputs and a manifest')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .option('-o, --output <dir>', 'Package output directory')
  .action(packageHandler);

