/**
 * Phase 1: Research Blitz
 *
 * Pure analysis module - gathers facts, patterns, contradictions
 * NO recommendations, only organized intelligence
 */

import { LLMService } from '../genesis/llm-service.js';
import { Logger } from '../utils/logger.js';
import { webFetcher, type WebFetchResult } from '../utils/web-fetcher.js';
import type {
  ResearchBlitzOutput,
  BrandAudit,
  CompetitorAnalysis,
  MarketGap,
  Contradiction,
  CustomerLanguage,
  CulturalContext
} from '../types/evolution-types.js';

const logger = new Logger('ResearchBlitz');

export interface ResearchBlitzConfig {
  brandName: string;
  brandUrl: string;
  competitorUrls?: string[];
  maxCompetitors?: number;
}

export class ResearchBlitz {
  private llm: LLMService;
  private config: ResearchBlitzConfig;

  constructor(config: ResearchBlitzConfig) {
    this.config = {
      maxCompetitors: 5,
      ...config,
    };
    this.llm = new LLMService({ temperature: 0.3 });
  }

  /**
   * Run the complete research blitz
   */
  async execute(): Promise<ResearchBlitzOutput> {
    logger.info('Starting research blitz', { brand: this.config.brandName });

    try {
      // Phase 1.1: Brand Audit
      logger.info('Conducting brand audit...');
      const brandAudit = await this.conductBrandAudit();

      // Phase 1.2: Competitor Analysis
      logger.info('Analyzing competitors...');
      const competitors = await this.analyzeCompetitors();

      // Phase 1.3: Market Gap Analysis
      logger.info('Identifying market gaps...');
      const marketGaps = await this.identifyMarketGaps(brandAudit, competitors);

      // Phase 1.4: Contradiction Detection
      logger.info('Detecting contradictions...');
      const contradictions = await this.detectContradictions(brandAudit);

      // Phase 1.5: Customer Language Mining
      logger.info('Mining customer language...');
      const customerLanguage = await this.mineCustomerLanguage();

      // Phase 1.6: Cultural Context
      logger.info('Gathering cultural context...');
      const culturalContext = await this.gatherCulturalContext();

      const output: ResearchBlitzOutput = {
        brandName: this.config.brandName,
        brandUrl: this.config.brandUrl,
        generatedAt: new Date().toISOString(),
        brandAudit,
        competitors,
        marketGaps,
        contradictions,
        customerLanguage,
        culturalContext,
        confidence: 0.75, // Conservative baseline
        sources: [this.config.brandUrl, ...(this.config.competitorUrls || [])],
      };

      logger.info('Research blitz completed', {
        competitors: competitors.length,
        gaps: marketGaps.length,
        contradictions: contradictions.length,
      });

      return output;
    } catch (error) {
      logger.error('Research blitz failed', error);
      throw new Error(
        `Failed to complete research blitz for ${this.config.brandName}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check brand URL and ensure API access.`
      );
    }
  }

  /**
   * Conduct comprehensive brand audit
   */
  private async conductBrandAudit(): Promise<BrandAudit> {
    // Fetch actual website content
    let webContent: WebFetchResult;
    try {
      webContent = await webFetcher.fetch(this.config.brandUrl);
    } catch (error) {
      logger.error('Failed to fetch brand website', error);
      throw new Error(
        `Cannot analyze brand - failed to fetch ${this.config.brandUrl}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Ensure URL is accessible and correct.`
      );
    }

    const systemPrompt = `You are a brand analyst conducting an objective audit.
Extract factual information only. NO recommendations or subjective opinions.
Focus on what EXISTS, not what should be.`;

    const userPrompt = `Analyze the brand "${this.config.brandName}" based on this website content:

WEBSITE: ${this.config.brandUrl}
TITLE: ${webContent.title}
META DESCRIPTION: ${webContent.metaDescription || 'None'}

MAIN HEADINGS:
${webContent.headings.slice(0, 10).join('\n')}

CONTENT (excerpt):
${webContent.content.slice(0, 3000)}

Extract the following (use "Unknown" if not found):

1. POSITIONING: How does the brand currently position itself? (2-3 sentences, factual only)

2. VISUAL IDENTITY:
   - Primary colors (describe what you see)
   - Typography style
   - Imagery style (based on descriptions in content)

3. MESSAGING:
   - Tagline or brand statement
   - 3-5 key messages found in the content
   - Tone of voice (formal, casual, playful, etc.)

4. UX FINDINGS:
   - 3-5 observations based on navigation structure
   - Key sections visible from headings

5. CURRENT STATE:
   - One paragraph summarizing current brand state
   - Focus on facts from the content

Return ONLY factual observations from the website content.
Format as JSON with keys: positioning, visualIdentity, messaging, uxFindings, currentState`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      // Parse JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        positioning: parsed.positioning || 'Unknown',
        visualIdentity: {
          colors: Array.isArray(parsed.visualIdentity?.colors) ? parsed.visualIdentity.colors : [],
          typography: Array.isArray(parsed.visualIdentity?.typography) ? parsed.visualIdentity.typography : [],
          imagery: Array.isArray(parsed.visualIdentity?.imagery) ? parsed.visualIdentity.imagery : [],
        },
        messaging: {
          tagline: parsed.messaging?.tagline || 'Unknown',
          keyMessages: Array.isArray(parsed.messaging?.keyMessages) ? parsed.messaging.keyMessages : [],
          tone: parsed.messaging?.tone || 'Unknown',
        },
        uxFindings: Array.isArray(parsed.uxFindings) ? parsed.uxFindings : [],
        currentState: parsed.currentState || 'Unknown',
      };
    } catch (error) {
      logger.error('Failed to parse brand audit response', error);
      // Return minimal valid structure
      return {
        positioning: 'Analysis pending',
        visualIdentity: { colors: [], typography: [], imagery: [] },
        messaging: { tagline: '', keyMessages: [], tone: 'Unknown' },
        uxFindings: [],
        currentState: 'Analysis pending',
      };
    }
  }

  /**
   * Analyze competitors
   */
  private async analyzeCompetitors(): Promise<CompetitorAnalysis[]> {
    const competitorUrls = (this.config.competitorUrls || []).slice(0, this.config.maxCompetitors);

    if (competitorUrls.length === 0) {
      logger.warn('No competitor URLs provided');
      return [];
    }

    const analyses: CompetitorAnalysis[] = [];

    for (const url of competitorUrls) {
      try {
        const analysis = await this.analyzeCompetitor(url);
        analyses.push(analysis);
      } catch (error) {
        logger.error(`Failed to analyze competitor ${url}`, error);
      }
    }

    return analyses;
  }

  /**
   * Analyze a single competitor
   */
  private async analyzeCompetitor(url: string): Promise<CompetitorAnalysis> {
    // Fetch competitor website
    let webContent: WebFetchResult;
    try {
      webContent = await webFetcher.fetch(url);
    } catch (error) {
      logger.warn(`Failed to fetch competitor ${url}`, error);
      // Return minimal analysis if fetch fails
      return {
        name: new URL(url).hostname,
        url,
        positioning: 'Unable to fetch - website inaccessible',
        strengths: [],
        weaknesses: ['Website could not be accessed for analysis'],
        differentiators: [],
        pricing: 'Unknown',
        channels: [],
      };
    }

    const systemPrompt = `You are analyzing a competitor. Extract ONLY factual information.
NO recommendations, NO quality judgments. Report what EXISTS.`;

    const userPrompt = `Analyze this competitor based on their website content:

WEBSITE: ${url}
TITLE: ${webContent.title}
META DESCRIPTION: ${webContent.metaDescription || 'None'}

MAIN HEADINGS:
${webContent.headings.slice(0, 10).join('\n')}

CONTENT (excerpt):
${webContent.content.slice(0, 2500)}

Extract:
1. Positioning statement (how do they position themselves?)
2. Top 3 strengths (what do they emphasize?)
3. Potential weaknesses (what's missing or unclear?)
4. Differentiators (what makes them unique?)
5. Pricing tier (premium, mid-market, budget - based on content)
6. Channels (online, retail, B2B, etc.)

Format as JSON with keys: name, url, positioning, strengths, weaknesses, differentiators, pricing, channels`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        name: parsed.name || new URL(url).hostname,
        url,
        positioning: parsed.positioning || 'Unknown',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        differentiators: Array.isArray(parsed.differentiators) ? parsed.differentiators : [],
        pricing: parsed.pricing || 'Unknown',
        channels: Array.isArray(parsed.channels) ? parsed.channels : [],
      };
    } catch (error) {
      logger.error(`Failed to parse competitor analysis for ${url}`, error);
      return {
        name: new URL(url).hostname,
        url,
        positioning: 'Analysis pending',
        strengths: [],
        weaknesses: [],
        differentiators: [],
        pricing: 'Unknown',
        channels: [],
      };
    }
  }

  /**
   * Identify market gaps based on brand and competitor analysis
   */
  private async identifyMarketGaps(
    brandAudit: BrandAudit,
    competitors: CompetitorAnalysis[]
  ): Promise<MarketGap[]> {
    if (competitors.length === 0) {
      return [];
    }

    const systemPrompt = `You are a market analyst identifying white space and gaps.
Focus on what ISN'T being done, what's MISSING from the market.
NO recommendations, just observations of gaps.`;

    const competitorSummary = competitors
      .map(c => `${c.name}: ${c.positioning}`)
      .join('\n');

    const userPrompt = `Brand: ${this.config.brandName}
Positioning: ${brandAudit.positioning}

Competitors:
${competitorSummary}

Identify 5-7 market gaps:
- What are competitors NOT addressing?
- What segments are underserved?
- What messages are missing from the market?
- What needs are not being met?

For each gap, provide:
- Clear description
- Evidence (what you observed)
- Opportunity size (small/medium/large)
- Confidence (0-10)

Format as JSON array with keys: gap, description, evidence, opportunitySize, confidence`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any) => {
        const obj = item as Record<string, unknown>;
        return {
          gap: (obj['gap'] as string) || 'Unknown gap',
          description: (obj['description'] as string) || '',
          evidence: Array.isArray(obj['evidence']) ? obj['evidence'] as string[] : [],
          opportunitySize: (obj['opportunitySize'] as 'small' | 'medium' | 'large') || 'medium',
          confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] as number / 10 : 0.5,
        };
      });
    } catch (error) {
      logger.error('Failed to parse market gaps', error);
      return [];
    }
  }

  /**
   * Detect contradictions in brand presentation
   */
  private async detectContradictions(brandAudit: BrandAudit): Promise<Contradiction[]> {
    const systemPrompt = `You are analyzing brand contradictions.
A contradiction is when the brand SAYS one thing but SHOWS another.
Be specific and factual. Cite evidence.`;

    const userPrompt = `Brand: ${this.config.brandName}

Audit findings:
${JSON.stringify(brandAudit, null, 2)}

Identify contradictions:
- Brand says X but evidence shows Y
- Messaging claims A but UX demonstrates B
- Visual identity suggests P but tone conveys Q

For each contradiction:
- What the brand claims/implies
- What the evidence actually shows
- The implication of this mismatch
- Severity (low/medium/high)

Return 5-7 contradictions as JSON array with keys: what, evidence, implication, severity`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any) => {
        const obj = item as Record<string, unknown>;
        return {
          what: (obj['what'] as string) || '',
          evidence: (obj['evidence'] as string) || '',
          implication: (obj['implication'] as string) || '',
          severity: (obj['severity'] as 'low' | 'medium' | 'high') || 'medium',
        };
      });
    } catch (error) {
      logger.error('Failed to parse contradictions', error);
      return [];
    }
  }

  /**
   * Mine customer language patterns
   * Note: In production, this would scrape reviews, social media, etc.
   * For now, we'll use Claude's knowledge about typical language patterns
   */
  private async mineCustomerLanguage(): Promise<CustomerLanguage> {
    const systemPrompt = `You are analyzing customer language patterns.
Based on typical customer language in this brand's category, identify:
- Common phrases customers use
- Sentiment patterns
- Pain points they express
- Desires they articulate`;

    const userPrompt = `Brand: ${this.config.brandName}
URL: ${this.config.brandUrl}

Based on the brand category and typical customer behavior, identify:

1. Common phrases customers might use (with frequency estimate)
2. Sentiment patterns (positive, negative, neutral themes)
3. Typical pain points
4. Common desires/aspirations

Format as JSON with keys: patterns, sentiment, painPoints, desires`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
        sentiment: {
          positive: Array.isArray(parsed.sentiment?.positive) ? parsed.sentiment.positive : [],
          negative: Array.isArray(parsed.sentiment?.negative) ? parsed.sentiment.negative : [],
          neutral: Array.isArray(parsed.sentiment?.neutral) ? parsed.sentiment.neutral : [],
        },
        painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
        desires: Array.isArray(parsed.desires) ? parsed.desires : [],
      };
    } catch (error) {
      logger.error('Failed to parse customer language', error);
      return {
        patterns: [],
        sentiment: { positive: [], negative: [], neutral: [] },
        painPoints: [],
        desires: [],
      };
    }
  }

  /**
   * Gather current cultural context (Oct 2025)
   */
  private async gatherCulturalContext(): Promise<CulturalContext[]> {
    const systemPrompt = `You are analyzing cultural context as of October 2025.
Identify relevant trends, shifts, and cultural moments that could impact this brand.
Be specific about dates and sources.`;

    const userPrompt = `Brand: ${this.config.brandName}
Current date: October 2025

Identify 5-7 cultural trends or shifts relevant to this brand:
- Consumer behavior trends
- Category-specific shifts
- Technology trends
- Social/cultural movements

For each:
- Name the trend
- Describe it briefly
- Explain relevance to this brand
- Source (where this trend is documented)
- When it emerged/gained momentum

Format as JSON array with keys: trend, description, relevance, source, date`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any) => {
        const obj = item as Record<string, unknown>;
        return {
          trend: (obj['trend'] as string) || '',
          description: (obj['description'] as string) || '',
          relevance: (obj['relevance'] as string) || '',
          source: (obj['source'] as string) || 'Market analysis',
          date: (obj['date'] as string) || new Date().toISOString(),
        };
      });
    } catch (error) {
      logger.error('Failed to parse cultural context', error);
      return [];
    }
  }
}
