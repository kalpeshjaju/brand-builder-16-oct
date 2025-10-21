import { Command } from 'commander';
import { FileSystemUtils } from '../../utils/file-system.js';
import path from 'path';

async function useHandler(options: { brand: string }) {
  const activePath = path.join('.brandos', 'ACTIVE_BRAND');
  await FileSystemUtils.writeFile(activePath, options.brand.trim());
  console.log(`Active brand set to: ${options.brand}`);
}

export const useCommand = new Command('use')
  .description('Set active brand context (reduces need to pass --brand)')
  .requiredOption('-b, --brand <name>', 'Brand name')
  .action(useHandler);

