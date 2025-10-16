// Generate command - Generate brand strategy

import type { BrandStrategy, GenerateCommandOptions } from '../../types/index.js';
import { LLMService } from '../../genesis/llm-service.js';
import { FileSystemUtils, logger, FormattingUtils, parseJSON, isBrandStrategyLike } from '../../utils/index.js';
import chalk from 'chalk';
import ora from 'ora';

function extractBrandStrategy(rawResponse: string, brand: string): {
  strategy: BrandStrategy;
  parseMethod?: string;
} {
  const parsed = parseJSON<Record<string, unknown>>(rawResponse);

  if (!parsed.success || !parsed.data) {
    throw new Error(
      'Generated strategy could not be parsed as valid JSON. ' +
      'Update the prompt or retry to ensure the response is structured JSON.'
    );
  }

  const payload = parsed.data;
  const candidate = isBrandStrategyLike(payload)
    ? payload
    : (payload?.['brandStrategy'] as unknown);

  if (!isBrandStrategyLike(candidate)) {
    throw new Error(
      'Generated strategy is missing a `brandStrategy` object with core fields (purpose, mission, positioning, etc.).'
    );
  }

  const strategy = candidate;

  if (!strategy.keyMessages || strategy.keyMessages.length === 0) {
    logger.warn('Generated strategy contains no key messages', { brand });
  }

  return { strategy, parseMethod: parsed.method };
}

export async function generateCommand(options: GenerateCommandOptions): Promise<void> {
  const spinner = ora('Generating brand strategy...').start();

  try {
    const { brand, mode, output, format } = options;

    if (!brand) {
      throw new Error('Brand name is required. Use --brand flag.');
    }

    logger.info('Generate command', { brand, mode });

    // Load brand config
    const workspacePath = FileSystemUtils.getBrandWorkspacePath(brand);
    const configPath = `${workspacePath}/config.json`;

    if (!(await FileSystemUtils.fileExists(configPath))) {
      throw new Error(`Brand workspace not found. Run: brandos init --brand "${brand}"`);
    }

    const config = await FileSystemUtils.readJSON(configPath);

    // Generate strategy using LLM
    const llm = new LLMService();

    const prompt = `Generate a comprehensive brand strategy for ${brand}.

Brand Configuration:
${JSON.stringify(config, null, 2)}

Mode: ${mode}

Please provide:
1. Brand Positioning
2. Value Proposition
3. Key Messages (3-5)
4. Target Audience
5. Competitive Differentiation
6. Brand Personality

Format as structured JSON.`;

    spinner.text = `Generating ${mode} strategy...`;
    const strategyText = await llm.prompt(prompt);
    const { strategy, parseMethod } = extractBrandStrategy(strategyText, brand);

    const outputPayload = {
      brandName: brand,
      generatedAt: new Date().toISOString(),
      mode,
      strategy,
      rawContent: strategyText,
      metadata: {
        parseMethod: parseMethod ?? 'unknown',
      },
    };

    // Save strategy
    const outputPath = output || `outputs/strategies/${FormattingUtils.sanitizeFilename(brand)}-strategy.json`;
    await FileSystemUtils.writeJSON(outputPath, outputPayload);

    spinner.succeed(chalk.green('Strategy generated successfully!'));

    console.log('\n' + chalk.bold('Strategy Generated:'));
    console.log(chalk.cyan(`  Brand: ${brand}`));
    console.log(chalk.cyan(`  Mode: ${mode}`));
    console.log(chalk.cyan(`  Output: ${outputPath}`));

    if (format !== 'json') {
      console.log('\n' + chalk.bold('Strategy Preview:'));
      console.log(strategyText.substring(0, 500) + '...');
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to generate strategy'));
    logger.error('Generate command failed', error);
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
