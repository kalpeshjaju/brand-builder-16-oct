// Strategy loader utility - normalize strategy files into structured BrandStrategy objects

import { FileSystemUtils } from './file-system.js';
import { parseJSON } from './json-parser.js';
import { Logger } from './logger.js';
import type { BrandStrategy } from '../types/index.js';
import { extname } from 'path';
import { readFile } from 'fs/promises';
import { z } from 'zod';

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

type StrategyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is StrategyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Narrow an unknown value to BrandStrategy by checking for core strategy keys.
 */
export function isBrandStrategyLike(value: unknown): value is BrandStrategy {
  if (!isRecord(value)) {
    return false;
  }

  return STRATEGY_INDICATOR_KEYS.some((key) => key in value);
}

const brandStrategySchema = z
  .object({})
  .passthrough()
  .superRefine((value, ctx) => {
    if (!isBrandStrategyLike(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Object does not resemble a brand strategy',
      });
    }
  })
  .transform((value) => value as BrandStrategy);

const strategyFileSchema = z
  .object({
    brandName: z.string().trim().min(1).optional(),
    generatedAt: z.string().optional(),
    mode: z.string().optional(),
    strategy: brandStrategySchema.optional(),
    content: z.string().optional(),
    rawContent: z.string().optional(),
  })
  .passthrough();

function extractStrategyFromContent(content: string): {
  strategy: BrandStrategy;
  parseMethod?: string;
} {
  const result = parseJSON<Record<string, unknown>>(content);

  if (!result.success || !result.data) {
    throw new Error('Strategy content could not be parsed as JSON. Ensure the LLM output is valid JSON.');
  }

  const parsed = result.data;

  let candidate: BrandStrategy | undefined;

  if (isBrandStrategyLike(parsed)) {
    candidate = parsed;
  } else if (isRecord(parsed) && isBrandStrategyLike(parsed['brandStrategy'])) {
    candidate = parsed['brandStrategy'];
  }

  if (!candidate) {
    throw new Error('Parsed content does not contain a valid brand strategy object.');
  }

  return {
    strategy: candidate,
    parseMethod: result.method,
  };
}

export async function loadStrategyFromFile(filePath: string): Promise<LoadedStrategy> {
  const ext = extname(filePath).toLowerCase();

  // Markdown support: parse either JSON code fence or simple headings
  if (ext === '.md' || ext === '.markdown') {
    const text = await readFile(filePath, 'utf-8');
    const jsonFence = /```json\s*([\s\S]*?)```/i.exec(text);
    if (jsonFence && jsonFence[1]) {
      const { strategy, parseMethod } = extractStrategyFromContent(jsonFence[1]);
      const titleMatch = /^#\s+(.+)$/m.exec(text);
      const derivedBrandName = titleMatch && titleMatch[1]
        ? titleMatch[1].replace(/ Brand Strategy$/i, '').trim()
        : strategy.brandName;
      const brandName = derivedBrandName && derivedBrandName.trim().length > 0
        ? derivedBrandName
        : 'Unknown';
      return {
        brandName,
        strategy,
        metadata: { parseMethod: parseMethod || 'json-fence' },
        rawContent: text,
      };
    }

    // Minimal heuristic parser for common headings
    const getSection = (heading: string) => {
      const re = new RegExp(`^##\\s+${heading}\\s*$[\\s\\S]*?(?=^##\\s+|\n\n---|\n\n\*Generated|$)`, 'mi');
      const m = re.exec(text);
      return m ? m[0] : '';
    };

    // Extract bullets from a block
    const bullets = (block: string) => (block.match(/^[-*+]\s+(.+)$/gmi) || []).map((l) => l.replace(/^[-*+]\s+/, '').trim());

    const brandTitle = /^#\s+(.+)$/m.exec(text)?.[1] || 'Unknown';
    const brandName = brandTitle.replace(/ Brand Strategy$/i, '').trim();

    const foundation = getSection('Brand Foundation');
    const purpose = (/^###\s+Purpose\s*$([\s\S]*?)(?=^###|$)/mi.exec(foundation)?.[1] || '').trim();
    const mission = (/^###\s+Mission\s*$([\s\S]*?)(?=^###|$)/mi.exec(foundation)?.[1] || '').trim();
    const vision = (/^###\s+Vision\s*$([\s\S]*?)(?=^###|$)/mi.exec(foundation)?.[1] || '').trim();

    const values = bullets(getSection('Core Values'));
    const positioning = getSection('Brand Positioning').replace(/^##\s+Brand Positioning\s*$/mi, '').trim();
    const personality = bullets(getSection('Brand Personality'));
    const keyMessagesBlock = getSection('Key Messages');
    const keyMessages = (keyMessagesBlock.match(/^\d+\.\s+(.+)$/gmi) || []).map((l) => l.replace(/^\d+\.\s+/, '').trim());
    const differentiators = bullets(getSection('Competitive Differentiation'));

    const candidate: Partial<BrandStrategy> = {};
    if (purpose) candidate.purpose = purpose;
    if (mission) candidate.mission = mission;
    if (vision) candidate.vision = vision;
    if (values.length) candidate.values = values;
    if (positioning) candidate.positioning = positioning;
    if (personality.length) candidate.personality = personality;
    if (keyMessages.length) candidate.keyMessages = keyMessages;
    if (differentiators.length) candidate.differentiators = differentiators;

    if (isBrandStrategyLike(candidate)) {
      return {
        brandName,
        strategy: candidate as BrandStrategy,
        metadata: { parseMethod: 'markdown-headings' },
        rawContent: text,
      };
    }

    throw new Error('Markdown file does not contain recognizable strategy sections or a JSON code block.');
  }

  // JSON and generic loader path
  const rawJson = await FileSystemUtils.readJSON<unknown>(filePath);

  const directStrategy = brandStrategySchema.safeParse(rawJson);
  if (directStrategy.success) {
    const data = directStrategy.data;
    const brandName = (typeof data['brandName'] === 'string' ? data['brandName'] : undefined) || 'Unknown';

    return {
      brandName,
      strategy: data,
      metadata: {
        parseMethod: 'direct',
      },
    };
  }

  const structuredResult = strategyFileSchema.safeParse(rawJson);
  if (!structuredResult.success) {
    const message = structuredResult.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Strategy file is invalid: ${message}`);
  }

  const structured = structuredResult.data;

  if (structured.strategy) {
    const strategy = structured.strategy;
    const strategyBrandName = typeof strategy['brandName'] === 'string'
      ? strategy['brandName']
      : undefined;

    return {
      brandName: structured.brandName || strategyBrandName || 'Unknown',
      strategy,
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
