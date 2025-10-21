import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AgentFactory } from '../src/orchestrator/AgentFactory.js';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, '..');
  const outPath = join(projectRoot, 'docs', 'agents-manifest.json');

  const names = AgentFactory.listNames();
  const agents = names.map(name => {
    const meta = AgentFactory.getMetadata(name);
    return {
      name,
      description: meta?.metadata?.description || '',
      version: meta?.metadata?.version || '1.0.0',
      inputs: meta?.metadata?.inputs || [],
      outputs: meta?.metadata?.outputs || [],
    };
  });

  const payload = { agents };
  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Agents manifest written to ${outPath}`);
}

main().catch(err => {
  console.error('Failed to generate agents manifest');
  console.error(err);
  process.exitCode = 1;
});

