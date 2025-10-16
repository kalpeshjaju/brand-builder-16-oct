// Strategy loader utility - normalize strategy files into structured BrandStrategy objects

import { FileSystemUtils } from './file-system.js';
import { parseJSON } from './json-parser.js';
import { Logger } from './logger.js';
import type { BrandStrategy } from '../types/index.js';

const logger = new Logger('StrategyLoader');

export interface LoadedStrategy {
  brandName: string;
  strategy: BrandStrategy;
  metadata: {
    mode?: string;
    generatedAt?: string;
    parseMethod?: string;
  };
  rawContent?: string;
}

interface StrategyFileShape {
  brandName?: string;
  generatedAt?: string;
  mode?: string;
  strategy?: BrandStrategy;
  content?: string;
  rawContent?: string;
}

const STRATEGY_INDICATOR_KEYS = [
  'purpose',
  'mission',
  'vision',
  'values',
  'positioning',
  'personality',
  'voiceAndTone',
  'keyMessages',
  'differentiators',
  'proofPoints',
] as const;

export function isBrandStrategyLike(value: unknown): value is BrandStrategy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return STRATEGY_INDICATOR_KEYS.some((key) => key in (value as Record<string, unknown>));
}

function extractStrategyFromContent(content: string): {
  strategy: BrandStrategy;
  parseMethod?: string;
} {
  const result = parseJSON<Record<string, unknown>>(content);

  if (!result.success || !result.data) {
    throw new Error('Strategy content could not be parsed as JSON. Ensure the LLM output is valid JSON.');
  }

  const parsed = result.data;
  const candidate = isBrandStrategyLike(parsed)
    ? parsed
    : (parsed?.['brandStrategy'] as unknown);

  if (!isBrandStrategyLike(candidate)) {
    throw new Error('Parsed content does not contain a valid brand strategy object.');
  }

  return {
    strategy: candidate,
    parseMethod: result.method,
  };
}

export async function loadStrategyFromFile(filePath: string): Promise<LoadedStrategy> {
  const fileData = await FileSystemUtils.readJSON<StrategyFileShape | BrandStrategy>(filePath);

  if (isBrandStrategyLike(fileData)) {
    const data = fileData as BrandStrategy;
    const brandName = (typeof data['brandName'] === 'string' ? data['brandName'] : undefined) || 'Unknown';

    return {
      brandName,
      strategy: fileData,
      metadata: {
        parseMethod: 'direct',
      },
    };
  }

  const structured = fileData as StrategyFileShape;

  if (structured.strategy && isBrandStrategyLike(structured.strategy)) {
    const strategyBrandName = typeof structured.strategy['brandName'] === 'string'
      ? structured.strategy['brandName']
      : undefined;

    return {
      brandName: structured.brandName || strategyBrandName || 'Unknown',
      strategy: structured.strategy,
      metadata: {
        mode: structured.mode,
        generatedAt: structured.generatedAt,
        parseMethod: 'embedded',
      },
      rawContent: structured.rawContent || structured.content,
    };
  }

  if (structured.content || structured.rawContent) {
    try {
      const { strategy, parseMethod } = extractStrategyFromContent(structured.rawContent || structured.content || '');

      const strategyBrandName = typeof strategy['brandName'] === 'string'
        ? strategy['brandName']
        : undefined;

      return {
        brandName: structured.brandName || strategyBrandName || 'Unknown',
        strategy,
        metadata: {
          mode: structured.mode,
          generatedAt: structured.generatedAt,
          parseMethod,
        },
        rawContent: structured.rawContent || structured.content,
      };
    } catch (error) {
      logger.error('Failed to parse strategy content', {
        filePath,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  throw new Error(
    'Strategy file is missing required data. Expected a strategy object or `content` containing JSON.'
  );
}
