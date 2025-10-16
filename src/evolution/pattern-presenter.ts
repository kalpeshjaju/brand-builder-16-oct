/**
 * Phase 2: Pattern Presenter
 *
 * Transforms research data into clear patterns for human review
 * Shows contradictions, white space, language gaps - NO recommendations
 */

import { LLMService } from '../genesis/llm-service.js';
import { Logger } from '../utils/logger.js';
import type {
  ResearchBlitzOutput,
  PatternPresentationOutput,
  ContradictionPattern,
  WhiteSpace,
  LanguageGap,
  PositioningMap,
  InflectionPoint
} from '../types/evolution-types.js';

const logger = new Logger('PatternPresenter');

export class PatternPresenter {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService({ temperature: 0.2 });
  }

  /**
   * Present patterns from research blitz
   */
  async present(researchData: ResearchBlitzOutput): Promise<PatternPresentationOutput> {
    logger.info('Presenting patterns', { brand: researchData.brandName });

    try {
      // Convert contradictions to patterns
      const contradictions = await this.formatContradictions(researchData);

      // Identify white space
      const whiteSpace = await this.identifyWhiteSpace(researchData);

      // Analyze language gaps
      const languageGaps = await this.analyzeLanguageGaps(researchData);

      // Create positioning map
      const positioningMap = await this.createPositioningMap(researchData);

      // Identify inflection points
      const inflectionPoints = await this.identifyInflectionPoints(researchData);

      const output: PatternPresentationOutput = {
        brandName: researchData.brandName,
        generatedAt: new Date().toISOString(),
        contradictions,
        whiteSpace,
        languageGaps,
        positioningMap,
        inflectionPoints,
      };

      logger.info('Pattern presentation complete', {
        contradictions: contradictions.length,
        whiteSpace: whiteSpace.length,
        languageGaps: languageGaps.length,
        inflectionPoints: inflectionPoints.length,
      });

      return output;
    } catch (error) {
      logger.error('Pattern presentation failed', error);
      throw new Error(
        `Failed to present patterns for ${researchData.brandName}\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check research data completeness.`
      );
    }
  }

  /**
   * Format contradictions into clear patterns
   */
  private async formatContradictions(data: ResearchBlitzOutput): Promise<ContradictionPattern[]> {
    const patterns: ContradictionPattern[] = data.contradictions.map((c, index) => ({
      id: `contradiction-${index + 1}`,
      brandSays: this.extractBrandClaim(c.what, data),
      evidenceShows: c.evidence,
      implication: c.implication,
      severity: c.severity,
    }));

    return patterns;
  }

  /**
   * Extract what the brand explicitly says/claims
   */
  private extractBrandClaim(what: string, data: ResearchBlitzOutput): string {
    // Try to find the brand's claim from audit data
    const messaging = data.brandAudit.messaging;

    // Check if contradiction relates to positioning
    if (what.toLowerCase().includes('position')) {
      return data.brandAudit.positioning;
    }

    // Check if relates to key messages
    if (what.toLowerCase().includes('message')) {
      return messaging.keyMessages[0] || what;
    }

    // Default: return the "what" from contradiction
    return what;
  }

  /**
   * Identify market white space
   */
  private async identifyWhiteSpace(data: ResearchBlitzOutput): Promise<WhiteSpace[]> {
    if (data.competitors.length === 0) {
      return [];
    }

    const systemPrompt = `You are identifying market white space.
White space = opportunities that NO competitor is addressing.
Be specific about what's missing.`;

    const competitorPositionings = data.competitors
      .map(c => `${c.name}: ${c.positioning}`)
      .join('\n');

    const competitorStrengths = data.competitors
      .map(c => `${c.name}: ${c.strengths.join(', ')}`)
      .join('\n');

    const userPrompt = `Competitors in the market:

POSITIONING:
${competitorPositionings}

STRENGTHS:
${competitorStrengths}

MARKET GAPS IDENTIFIED:
${data.marketGaps.map(g => `- ${g.gap}: ${g.description}`).join('\n')}

For each significant white space opportunity:
1. What is the white space? (clear description)
2. What are ALL competitors focusing on instead?
3. What's the untapped opportunity?
4. Evidence supporting this gap

Return 5-7 white space opportunities as JSON array with keys: id, description, competitorFocus, untappedOpportunity, evidence`;

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

      return parsed.map((item: any, index: number) => ({
        id: item.id || `whitespace-${index + 1}`,
        description: item.description || '',
        competitorFocus: item.competitorFocus || '',
        untappedOpportunity: item.untappedOpportunity || '',
        evidence: Array.isArray(item.evidence) ? item.evidence : [],
      }));
    } catch (error) {
      logger.error('Failed to parse white space', error);
      return [];
    }
  }

  /**
   * Analyze language gaps between customers and brand
   */
  private async analyzeLanguageGaps(data: ResearchBlitzOutput): Promise<LanguageGap[]> {
    const systemPrompt = `You are analyzing language alignment gaps.
Compare what customers say vs. what the brand says.
Identify mismatches in language, tone, framing.`;

    const userPrompt = `Brand: ${data.brandName}

BRAND LANGUAGE:
- Tagline: ${data.brandAudit.messaging.tagline}
- Key messages: ${data.brandAudit.messaging.keyMessages.join(', ')}
- Tone: ${data.brandAudit.messaging.tone}

CUSTOMER LANGUAGE:
- Common phrases: ${data.customerLanguage.patterns.map(p => p.phrase).join(', ')}
- Pain points: ${data.customerLanguage.painPoints.join(', ')}
- Desires: ${data.customerLanguage.desires.join(', ')}

Identify 5-7 language gaps where:
- Customers say X but brand says Y
- The gap represents a misalignment
- Provide specific examples

Format as JSON array with keys: customersSay, brandSays, gap, examples`;

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

      return parsed.map((item: any) => ({
        customersSay: item.customersSay || '',
        brandSays: item.brandSays || '',
        gap: item.gap || '',
        examples: Array.isArray(item.examples) ? item.examples : [],
      }));
    } catch (error) {
      logger.error('Failed to parse language gaps', error);
      return [];
    }
  }

  /**
   * Create visual positioning map
   */
  private async createPositioningMap(data: ResearchBlitzOutput): Promise<PositioningMap> {
    const systemPrompt = `You are creating a 2-axis positioning map.
Choose the 2 most relevant axes for this market.
Map all brands (target brand + competitors) on these axes.`;

    const allBrands = [
      {
        name: data.brandName,
        positioning: data.brandAudit.positioning,
      },
      ...data.competitors.map(c => ({
        name: c.name,
        positioning: c.positioning,
      })),
    ];

    const userPrompt = `Create a positioning map for these brands:

${allBrands.map(b => `${b.name}: ${b.positioning}`).join('\n')}

1. Define 2 axes most relevant to this market
   - Each axis should have clear low/high ends
   - Examples: Premium/Budget, Traditional/Innovative, Performance/Lifestyle

2. Position each brand on a scale from -5 to +5 on each axis
   - -5 = far left/bottom
   - 0 = neutral/middle
   - +5 = far right/top

Format as JSON:
{
  "axis1": { "name": "...", "low": "...", "high": "..." },
  "axis2": { "name": "...", "low": "...", "high": "..." },
  "brands": [
    { "name": "Brand A", "position": { "x": 2, "y": -3 } }
  ]
}`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        axis1: parsed.axis1 || { name: 'Axis 1', low: 'Low', high: 'High' },
        axis2: parsed.axis2 || { name: 'Axis 2', low: 'Low', high: 'High' },
        brands: Array.isArray(parsed.brands) ? parsed.brands : [],
      };
    } catch (error) {
      logger.error('Failed to parse positioning map', error);
      // Return minimal valid map
      return {
        axis1: { name: 'Premium', low: 'Budget', high: 'Premium' },
        axis2: { name: 'Innovation', low: 'Traditional', high: 'Innovative' },
        brands: [{ name: data.brandName, position: { x: 0, y: 0 } }],
      };
    }
  }

  /**
   * Identify market inflection points
   */
  private async identifyInflectionPoints(data: ResearchBlitzOutput): Promise<InflectionPoint[]> {
    const systemPrompt = `You are identifying inflection points - moments of market change.
Focus on shifts that create opportunities or threats.
Based on October 2025 context.`;

    const culturalContext = data.culturalContext
      .map(c => `${c.trend}: ${c.description}`)
      .join('\n');

    const userPrompt = `Brand: ${data.brandName}

CULTURAL TRENDS (Oct 2025):
${culturalContext}

Identify 3-5 inflection points:
- Type (market_shift, trend, technology, consumer_behavior)
- Clear description
- Timing (current, emerging, future)
- Impact level (low, medium, high)
- Evidence/examples

Format as JSON array with keys: type, description, timing, impact, evidence`;

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

      return parsed.map((item: any) => ({
        type: item.type || 'market_shift',
        description: item.description || '',
        timing: item.timing || 'current',
        impact: item.impact || 'medium',
        evidence: Array.isArray(item.evidence) ? item.evidence : [],
      }));
    } catch (error) {
      logger.error('Failed to parse inflection points', error);
      return [];
    }
  }

  /**
   * Generate markdown presentation
   */
  generateMarkdownPresentation(data: PatternPresentationOutput): string {
    let md = `# Pattern Analysis: ${data.brandName}\n\n`;
    md += `*Generated: ${new Date(data.generatedAt).toLocaleDateString()}*\n\n`;
    md += `---\n\n`;

    // Contradictions
    md += `## 🔴 Contradictions Found\n\n`;
    if (data.contradictions.length === 0) {
      md += `*No significant contradictions detected.*\n\n`;
    } else {
      data.contradictions.forEach((c, i) => {
        const emoji = c.severity === 'high' ? '🔴' : c.severity === 'medium' ? '🟡' : '🟢';
        md += `### ${i + 1}. ${emoji} ${c.id}\n\n`;
        md += `**Brand Says**: ${c.brandSays}\n\n`;
        md += `**Evidence Shows**: ${c.evidenceShows}\n\n`;
        md += `**Implication**: ${c.implication}\n\n`;
        md += `**Severity**: ${c.severity}\n\n`;
        md += `---\n\n`;
      });
    }

    // White Space
    md += `## ⚪ Market White Space\n\n`;
    if (data.whiteSpace.length === 0) {
      md += `*No significant white space identified.*\n\n`;
    } else {
      data.whiteSpace.forEach((ws, i) => {
        md += `### ${i + 1}. ${ws.description}\n\n`;
        md += `**Competitors Focus On**: ${ws.competitorFocus}\n\n`;
        md += `**Untapped Opportunity**: ${ws.untappedOpportunity}\n\n`;
        md += `**Evidence**:\n`;
        ws.evidence.forEach(e => md += `- ${e}\n`);
        md += `\n---\n\n`;
      });
    }

    // Language Gaps
    md += `## 💬 Customer Language vs. Brand Language\n\n`;
    if (data.languageGaps.length === 0) {
      md += `*Language appears aligned.*\n\n`;
    } else {
      md += `| Customers Say | Brand Says | Gap |\n`;
      md += `|---------------|------------|-----|\n`;
      data.languageGaps.forEach(lg => {
        md += `| ${lg.customersSay} | ${lg.brandSays} | ${lg.gap} |\n`;
      });
      md += `\n`;
    }

    // Positioning Map
    md += `## 📊 Positioning Map\n\n`;
    md += `**Axis 1**: ${data.positioningMap.axis1.name} (${data.positioningMap.axis1.low} ← → ${data.positioningMap.axis1.high})\n`;
    md += `**Axis 2**: ${data.positioningMap.axis2.name} (${data.positioningMap.axis2.low} ← → ${data.positioningMap.axis2.high})\n\n`;
    md += `| Brand | Position |\n`;
    md += `|-------|----------|\n`;
    data.positioningMap.brands.forEach(b => {
      md += `| ${b.name} | (${b.position.x}, ${b.position.y}) |\n`;
    });
    md += `\n`;

    // Inflection Points
    md += `## 🔄 Market Inflection Points\n\n`;
    if (data.inflectionPoints.length === 0) {
      md += `*No major inflection points identified.*\n\n`;
    } else {
      data.inflectionPoints.forEach((ip, i) => {
        const emoji = ip.impact === 'high' ? '🔴' : ip.impact === 'medium' ? '🟡' : '🟢';
        md += `### ${i + 1}. ${emoji} ${ip.description}\n\n`;
        md += `**Type**: ${ip.type}\n`;
        md += `**Timing**: ${ip.timing}\n`;
        md += `**Impact**: ${ip.impact}\n\n`;
        md += `**Evidence**:\n`;
        ip.evidence.forEach(e => md += `- ${e}\n`);
        md += `\n---\n\n`;
      });
    }

    return md;
  }
}
