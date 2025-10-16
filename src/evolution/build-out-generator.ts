/**
 * Phase 5: Build-Out Generator
 *
 * Generates comprehensive brand evolution strategy
 * Grounded in research evidence, aligned with creative direction, validated
 */

import { LLMService } from '../genesis/llm-service.js';
import { Logger } from '../utils/logger.js';
import type {
  ResearchBlitzOutput,
  CreativeDirectionOutput,
  ValidationOutput,
  BuildOutOutput,
  PositioningFramework,
  MessagingArchitecture,
  ContentExample,
  VisualDirection,
  ChannelStrategy,
  ImplementationPhase,
  SuccessMetric
} from '../types/evolution-types.js';

const logger = new Logger('BuildOutGenerator');

export class BuildOutGenerator {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService({ temperature: 0.4 }); // Moderate creativity for execution details
  }

  /**
   * Generate complete build-out strategy
   */
  async generate(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput,
    validation: ValidationOutput
  ): Promise<BuildOutOutput> {
    logger.info('Generating build-out strategy', { brand: direction.brandName });

    try {
      // Create executive summary first
      const executiveSummary = this.generateExecutiveSummary(direction, validation);

      // 1. Positioning Framework
      logger.info('Creating positioning framework...');
      const positioningFramework = await this.createPositioningFramework(research, direction);

      // 2. Messaging Architecture
      logger.info('Building messaging architecture...');
      const messagingArchitecture = await this.buildMessagingArchitecture(research, direction);

      // 3. Content Examples
      logger.info('Generating content examples...');
      const contentExamples = await this.generateContentExamples(direction, messagingArchitecture);

      // 4. Visual Direction
      logger.info('Defining visual direction...');
      const visualDirection = await this.defineVisualDirection(research, direction);

      // 5. Channel Strategy
      logger.info('Planning channel strategy...');
      const channelStrategy = await this.planChannelStrategy(research, direction);

      // 6. Implementation Roadmap
      logger.info('Creating implementation roadmap...');
      const implementationRoadmap = await this.createRoadmap(direction, validation);

      // 7. Success Metrics
      logger.info('Defining success metrics...');
      const successMetrics = await this.defineSuccessMetrics(direction);

      // 8. Evidence Trail
      const evidenceTrail = this.compileEvidenceTrail(research, direction, validation);

      const output: BuildOutOutput = {
        brandName: direction.brandName,
        generatedAt: new Date().toISOString(),
        executiveSummary,
        positioningFramework,
        messagingArchitecture,
        contentExamples,
        visualDirection,
        channelStrategy,
        implementationRoadmap,
        successMetrics,
        evidenceTrail,
      };

      logger.info('Build-out complete');

      return output;
    } catch (error) {
      logger.error('Build-out generation failed', error);
      throw new Error(
        `Failed to generate build-out\n` +
        `Reason: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    direction: CreativeDirectionOutput,
    validation: ValidationOutput
  ): string {
    return `## Executive Summary

**Strategic Direction**: ${direction.primaryDirection}

**Key Themes**: ${direction.keyThemes.join(', ')}

**Validation Score**: ${(validation.overallConfidence * 10).toFixed(1)}/10

**Recommendation**: ${validation.recommendation.toUpperCase()}

This brand evolution strategy is ${validation.recommendation === 'proceed' ? 'ready for implementation' : validation.recommendation === 'modify' ? 'recommended with modifications' : 'requires reconsideration'}. The direction is grounded in comprehensive market research, customer insights, and competitive analysis. Implementation timeline: ${validation.feasibilityCheck.timeline}.`;
  }

  /**
   * Create positioning framework
   */
  private async createPositioningFramework(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<PositioningFramework> {
    const systemPrompt = `You are creating a positioning framework.
Use the classic structure: For [target], [brand] is the [category frame] that [POD] because [RTB].`;

    const userPrompt = `Brand: ${research.brandName}

Direction: ${direction.primaryDirection}

Themes: ${direction.keyThemes.join(', ')}

Customer Desires:
${research.customerLanguage.desires.join('\n')}

Create a positioning framework:
1. Positioning statement (For X, Y is Z that W because RTB)
2. Target audience (specific segment)
3. Category frame (how we frame the category)
4. Point of difference (what makes us unique)
5. Reasons to believe (3-5 proof points)

Format as JSON with keys: statement, targetAudience, categoryFrame, pointOfDifference, reasonToBelieve`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        statement: parsed.statement || '',
        targetAudience: parsed.targetAudience || '',
        categoryFrame: parsed.categoryFrame || '',
        pointOfDifference: parsed.pointOfDifference || '',
        reasonToBelieve: Array.isArray(parsed.reasonToBelieve) ? parsed.reasonToBelieve : [],
      };
    } catch (error) {
      logger.error('Failed to parse positioning framework', error);
      return {
        statement: `For ${research.brandName} customers, we provide ${direction.primaryDirection}`,
        targetAudience: 'Target audience TBD',
        categoryFrame: 'Category TBD',
        pointOfDifference: direction.primaryDirection,
        reasonToBelieve: [],
      };
    }
  }

  /**
   * Build messaging architecture
   */
  private async buildMessagingArchitecture(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<MessagingArchitecture> {
    const systemPrompt = `You are building a messaging architecture.
Create clear, compelling messaging that aligns with the strategic direction.`;

    const customerLanguage = research.customerLanguage.patterns
      .map(p => p.phrase)
      .join(', ');

    const userPrompt = `Direction: ${direction.primaryDirection}

Themes: ${direction.keyThemes.join(', ')}

Customer Language:
${customerLanguage}

Create messaging architecture:
1. Brand essence (1-2 words)
2. Tagline (7 words max)
3. Key messages (5-7 messages)
4. Proof points (3-5 claims with evidence)
5. Tone of voice (3-5 descriptors)

Format as JSON with keys: brandEssence, tagline, keyMessages, proofPoints (array of {claim, evidence}), toneOfVoice`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        brandEssence: parsed.brandEssence || '',
        tagline: parsed.tagline || '',
        keyMessages: Array.isArray(parsed.keyMessages) ? parsed.keyMessages : [],
        proofPoints: Array.isArray(parsed.proofPoints) ? parsed.proofPoints : [],
        toneOfVoice: Array.isArray(parsed.toneOfVoice) ? parsed.toneOfVoice : [],
      };
    } catch (error) {
      logger.error('Failed to parse messaging architecture', error);
      return {
        brandEssence: direction.keyThemes[0] || 'Innovation',
        tagline: '',
        keyMessages: [],
        proofPoints: [],
        toneOfVoice: [],
      };
    }
  }

  /**
   * Generate content examples
   */
  private async generateContentExamples(
    _direction: CreativeDirectionOutput,
    messaging: MessagingArchitecture
  ): Promise<ContentExample[]> {
    const systemPrompt = `You are writing brand content examples.
Make them specific, compelling, and aligned with the messaging.`;

    const userPrompt = `Brand Essence: ${messaging.brandEssence}
Tagline: ${messaging.tagline}
Tone: ${messaging.toneOfVoice.join(', ')}

Create 5 content examples:
1. Homepage hero section
2. About us copy (2-3 paragraphs)
3. Product description
4. Social media post
5. Email subject line + preview

For each:
- Type
- Title
- Content (actual copy)
- Context (where/how it's used)

Format as JSON array with keys: type, title, content, context`;

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
        type: item.type || '',
        title: item.title || '',
        content: item.content || '',
        context: item.context || '',
      }));
    } catch (error) {
      logger.error('Failed to parse content examples', error);
      return [];
    }
  }

  /**
   * Define visual direction
   */
  private async defineVisualDirection(
    _research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<VisualDirection> {
    const systemPrompt = `You are defining visual brand direction.
Suggest colors, typography, imagery that align with the strategic direction.`;

    const currentVisual = _research.brandAudit.visualIdentity;

    const userPrompt = `Direction: ${direction.primaryDirection}

Themes: ${direction.keyThemes.join(', ')}

Current Visual Identity:
- Colors: ${currentVisual.colors.join(', ')}
- Typography: ${currentVisual.typography.join(', ')}
- Imagery: ${currentVisual.imagery.join(', ')}

Define evolved visual direction:
1. Color palette (5-7 colors with hex codes and rationale)
2. Typography (font families and usage)
3. Imagery style (photography, illustrations, etc.)
4. Design principles (3-5 guiding principles)

Format as JSON with keys: colorPalette, typography, imagery, designPrinciples`;

    const response = await this.llm.prompt(userPrompt, systemPrompt);

    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        colorPalette: Array.isArray(parsed.colorPalette) ? parsed.colorPalette : [],
        typography: Array.isArray(parsed.typography) ? parsed.typography : [],
        imagery: Array.isArray(parsed.imagery) ? parsed.imagery : [],
        designPrinciples: Array.isArray(parsed.designPrinciples) ? parsed.designPrinciples : [],
      };
    } catch (error) {
      logger.error('Failed to parse visual direction', error);
      return {
        colorPalette: [],
        typography: [],
        imagery: [],
        designPrinciples: [],
      };
    }
  }

  /**
   * Plan channel strategy
   */
  private async planChannelStrategy(
    _research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput
  ): Promise<ChannelStrategy[]> {
    const systemPrompt = `You are planning channel strategy.
Identify best channels for this brand evolution and prioritize them.`;

    const userPrompt = `Direction: ${direction.primaryDirection}

Target Audience: Based on direction and research

Available Channels:
- Website/SEO
- Social Media (Instagram, LinkedIn, TikTok, etc.)
- Content Marketing (Blog, Video, Podcast)
- Email Marketing
- Paid Advertising (Google, Social, Display)
- PR & Media
- Partnerships
- Events/Community
- Retail/Physical

For each relevant channel:
1. Priority (primary, secondary, tertiary)
2. Tactics (specific actions)
3. KPIs (2-3 metrics)

Format as JSON array with keys: channel, priority, tactics, kpis`;

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
        channel: item.channel || '',
        priority: item.priority || 'secondary',
        tactics: Array.isArray(item.tactics) ? item.tactics : [],
        kpis: Array.isArray(item.kpis) ? item.kpis : [],
      }));
    } catch (error) {
      logger.error('Failed to parse channel strategy', error);
      return [];
    }
  }

  /**
   * Create implementation roadmap
   */
  private async createRoadmap(
    direction: CreativeDirectionOutput,
    validation: ValidationOutput
  ): Promise<ImplementationPhase[]> {
    const systemPrompt = `You are creating an implementation roadmap.
Break down the evolution into phases with clear deliverables.`;

    const requirements = validation.feasibilityCheck.requirements.join('\n');

    const userPrompt = `Direction: ${direction.primaryDirection}

Requirements:
${requirements}

Timeline: ${validation.feasibilityCheck.timeline}

Create 4-6 implementation phases:
1. Phase name
2. Duration
3. Key deliverables
4. Dependencies

Typical phases:
- Phase 1: Strategy & Planning
- Phase 2: Brand Identity & Design
- Phase 3: Content & Messaging
- Phase 4: Digital Presence
- Phase 5: Launch & Activation
- Phase 6: Optimization

Format as JSON array with keys: phase, duration, deliverables, dependencies`;

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
        phase: item.phase || '',
        duration: item.duration || '',
        deliverables: Array.isArray(item.deliverables) ? item.deliverables : [],
        dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
      }));
    } catch (error) {
      logger.error('Failed to parse implementation roadmap', error);
      return [];
    }
  }

  /**
   * Define success metrics
   */
  private async defineSuccessMetrics(direction: CreativeDirectionOutput): Promise<SuccessMetric[]> {
    const systemPrompt = `You are defining success metrics.
Create measurable KPIs that track brand evolution progress.`;

    const userPrompt = `Direction: ${direction.primaryDirection}

Define 7-10 success metrics across:
- Brand Awareness
- Brand Perception
- Customer Engagement
- Business Impact

For each metric:
1. Metric name
2. Baseline (current or assumed)
3. Target (specific number)
4. Timeline (when to achieve)
5. Measurement method

Format as JSON array with keys: metric, baseline, target, timeline, measurement`;

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
        metric: item.metric || '',
        baseline: item.baseline || '',
        target: item.target || '',
        timeline: item.timeline || '',
        measurement: item.measurement || '',
      }));
    } catch (error) {
      logger.error('Failed to parse success metrics', error);
      return [];
    }
  }

  /**
   * Compile evidence trail
   */
  private compileEvidenceTrail(
    research: ResearchBlitzOutput,
    direction: CreativeDirectionOutput,
    validation: ValidationOutput
  ): string[] {
    const trail: string[] = [];

    // Phase 1: Research evidence
    trail.push(`Research conducted on ${new Date(research.generatedAt).toLocaleDateString()}`);
    trail.push(`Analyzed ${research.competitors.length} competitors`);
    trail.push(`Identified ${research.marketGaps.length} market gaps`);
    trail.push(`Detected ${research.contradictions.length} brand contradictions`);

    // Phase 3: Creative direction
    trail.push(`Direction captured on ${new Date(direction.generatedAt).toLocaleDateString()}`);
    trail.push(`Selected ${direction.selectedContradictions.length} contradictions to explore`);
    trail.push(`Made ${direction.whiteSpaceDecisions.length} white space decisions`);
    trail.push(`Captured ${direction.creativeLeaps.length} creative leaps`);

    // Phase 4: Validation
    trail.push(`Validation completed on ${new Date(validation.generatedAt).toLocaleDateString()}`);
    trail.push(`Alignment score: ${validation.alignmentCheck.score}/10`);
    trail.push(`Evidence confidence: ${(validation.evidenceAssessment.netConfidence * 10).toFixed(1)}/10`);
    trail.push(`Overall confidence: ${(validation.overallConfidence * 10).toFixed(1)}/10`);
    trail.push(`Recommendation: ${validation.recommendation}`);

    return trail;
  }

  /**
   * Generate comprehensive markdown strategy document
   */
  generateMarkdownStrategy(output: BuildOutOutput): string {
    let md = `# Brand Evolution Strategy\n## ${output.brandName}\n\n`;
    md += `*Generated: ${new Date(output.generatedAt).toLocaleDateString()}*\n\n`;
    md += `---\n\n`;

    // Executive Summary
    md += output.executiveSummary;
    md += `\n\n---\n\n`;

    // Positioning
    md += `## 🎯 Positioning Framework\n\n`;
    md += `**Positioning Statement**\n\n${output.positioningFramework.statement}\n\n`;
    md += `**Target Audience**: ${output.positioningFramework.targetAudience}\n\n`;
    md += `**Category Frame**: ${output.positioningFramework.categoryFrame}\n\n`;
    md += `**Point of Difference**: ${output.positioningFramework.pointOfDifference}\n\n`;
    md += `**Reasons to Believe**:\n`;
    output.positioningFramework.reasonToBelieve.forEach(rtb => md += `- ${rtb}\n`);
    md += `\n---\n\n`;

    // Messaging
    md += `## 💬 Messaging Architecture\n\n`;
    md += `**Brand Essence**: ${output.messagingArchitecture.brandEssence}\n\n`;
    md += `**Tagline**: "${output.messagingArchitecture.tagline}"\n\n`;
    md += `**Tone of Voice**: ${output.messagingArchitecture.toneOfVoice.join(', ')}\n\n`;
    md += `**Key Messages**:\n`;
    output.messagingArchitecture.keyMessages.forEach((msg, i) => md += `${i + 1}. ${msg}\n`);
    md += `\n---\n\n`;

    // Content Examples
    if (output.contentExamples.length > 0) {
      md += `## ✍️ Content Examples\n\n`;
      output.contentExamples.forEach(example => {
        md += `### ${example.title}\n\n`;
        md += `**Type**: ${example.type}\n\n`;
        md += `${example.content}\n\n`;
        md += `*${example.context}*\n\n`;
      });
      md += `---\n\n`;
    }

    // Channel Strategy
    if (output.channelStrategy.length > 0) {
      md += `## 📢 Channel Strategy\n\n`;
      const primary = output.channelStrategy.filter(c => c.priority === 'primary');
      const secondary = output.channelStrategy.filter(c => c.priority === 'secondary');

      if (primary.length > 0) {
        md += `### Primary Channels\n\n`;
        primary.forEach(ch => {
          md += `**${ch.channel}**\n`;
          md += `Tactics: ${ch.tactics.join(', ')}\n`;
          md += `KPIs: ${ch.kpis.join(', ')}\n\n`;
        });
      }

      if (secondary.length > 0) {
        md += `### Secondary Channels\n\n`;
        secondary.forEach(ch => {
          md += `- **${ch.channel}**: ${ch.tactics.join(', ')}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    }

    // Implementation Roadmap
    if (output.implementationRoadmap.length > 0) {
      md += `## 🗺️ Implementation Roadmap\n\n`;
      output.implementationRoadmap.forEach((phase) => {
        md += `### ${phase.phase}\n\n`;
        md += `**Duration**: ${phase.duration}\n\n`;
        md += `**Deliverables**:\n`;
        phase.deliverables.forEach(d => md += `- ${d}\n`);
        md += `\n`;
      });
      md += `---\n\n`;
    }

    // Success Metrics
    if (output.successMetrics.length > 0) {
      md += `## 📊 Success Metrics\n\n`;
      md += `| Metric | Baseline | Target | Timeline |\n`;
      md += `|--------|----------|--------|----------|\n`;
      output.successMetrics.forEach(metric => {
        md += `| ${metric.metric} | ${metric.baseline} | ${metric.target} | ${metric.timeline} |\n`;
      });
      md += `\n---\n\n`;
    }

    // Evidence Trail
    md += `## 🔍 Evidence Trail\n\n`;
    output.evidenceTrail.forEach(evidence => md += `- ${evidence}\n`);
    md += `\n`;

    return md;
  }
}
