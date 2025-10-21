import { Command } from 'commander';
import { FileSystemUtils } from '../../utils/file-system.js';
import path from 'path';

async function setupHandler() {
  // Create .env.example and .env if missing
  const envExample = `# Brand Builder Pro
DEFAULT_MODEL=claude-sonnet-4-5-20250929
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=8000
LLM_TIMEOUT_MS=60000
LLM_MAX_RETRIES=3
LOG_LEVEL=info
# Set ANTHROPIC_API_KEY to run online; set BRANDOS_OFFLINE=true for offline mode
ANTHROPIC_API_KEY=
BRANDOS_OFFLINE=true
`;
  await FileSystemUtils.writeFile('.env.example', envExample);
  console.log('Wrote .env.example');
  // Do not overwrite existing .env
}

export const setupCommand = new Command('setup')
  .description('Create example environment and check prerequisites')
  .action(setupHandler);

