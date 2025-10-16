// Strategy loader tests covering real brand scenarios

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadStrategyFromFile } from '../../../src/utils/strategy-loader.js';
import type { BrandStrategy } from '../../../src/types/index.js';

const TMP_PREFIX = join(tmpdir(), 'brand-builder-strategy-loader-');

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(TMP_PREFIX);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function buildStrategy(overrides: Partial<BrandStrategy>): BrandStrategy {
  return {
    purpose: 'Default purpose statement to satisfy loader checks.',
    mission: 'Deliver meaningful impact for our audience.',
    positioning: 'Positioned as the category leader.',
    keyMessages: ['Default key message'],
    differentiators: ['Differentiator one'],
    values: ['Value one'],
    proofPoints: [
      {
        claim: 'Default claim',
        source: 'Default source',
        sourceUrl: 'https://example.com',
        confidence: 0.9,
      },
    ],
    ...overrides,
  };
}

describe('Strategy Loader', () => {
  it('loads structured strategy payload for revaaforyou.com', async () => {
    const filePath = join(tempDir, 'revaa.json');
    const strategy = buildStrategy({
      positioning: 'Revaa champions sustainable menstrual wellness for modern India.',
      keyMessages: ['Eco-friendly period care rooted in science'],
      proofPoints: [
        {
          claim: 'Compostable menstrual cups tested for 10-year durability',
          source: 'RevaaForYou product specs',
          sourceUrl: 'https://revaaforyou.com/pages/about-us',
          confidence: 0.95,
        },
      ],
    });

    const payload = {
      brandName: 'Revaa',
      generatedAt: '2025-10-16T00:00:00.000Z',
      mode: 'professional',
      strategy,
    };

    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    const loaded = await loadStrategyFromFile(filePath);

    expect(loaded.brandName).toBe('Revaa');
    expect(loaded.strategy.positioning).toContain('Revaa');
    expect(loaded.metadata.parseMethod).toBe('embedded');
  });

  it('parses legacy code-block content for flyberry.in', async () => {
    const filePath = join(tempDir, 'flyberry.json');
    const strategy = buildStrategy({
      positioning: 'Flyberry is the gourmet destination for mindful snacking in India.',
      keyMessages: [
        'Sustainably sourced dates and berries from Indian farms',
        'Cold-chain logistics preserve freshness from farm to doorstep',
      ],
      proofPoints: [
        {
          claim: 'Over 120 SKUs of gourmet dry fruits and healthy snacks',
          source: 'Flyberry catalogue',
          sourceUrl: 'https://flyberry.in/collections/all',
          confidence: 0.88,
        },
      ],
    });

    const legacyContent = `\`\`\`json
{
  "brandStrategy": ${JSON.stringify(strategy, null, 2)}
}
\`\`\``;

    const payload = {
      brandName: 'Flyberry Gourmet',
      mode: 'professional',
      content: legacyContent,
    };

    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    const loaded = await loadStrategyFromFile(filePath);

    expect(loaded.brandName).toBe('Flyberry Gourmet');
    expect(loaded.strategy.keyMessages?.length).toBeGreaterThanOrEqual(2);
    expect(loaded.metadata.parseMethod).toBe('code-block');
  });

  it('supports direct brand strategy files for shopkarishma.com', async () => {
    const filePath = join(tempDir, 'shopkarishma.json');
    const strategy = buildStrategy({
      positioning: 'ShopKarishma blends AI-driven personalization with Indian fashion heritage.',
      keyMessages: [
        'AI stylist delivers curated looks for every body type',
        'Crafted collections from emerging Indian designers',
      ],
      proofPoints: [
        {
          claim: 'Personalized catalogues increase conversion by 27%',
          source: 'ShopKarishma product analytics',
          sourceUrl: 'https://shopkarishma.com/pages/how-it-works',
          confidence: 0.9,
        },
      ],
    });

    await writeFile(filePath, JSON.stringify(strategy, null, 2), 'utf-8');

    const loaded = await loadStrategyFromFile(filePath);

    expect(loaded.strategy.keyMessages?.[0]).toContain('AI stylist');
    expect(loaded.metadata.parseMethod).toBe('direct');
  });
});
