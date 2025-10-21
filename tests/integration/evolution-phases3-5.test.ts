import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/genesis/llm-service.js', () => {
  class MockLLMService {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_config?: unknown) {}

    async prompt(userMessage: string): Promise<string> {
      if (userMessage.includes('Assess alignment (0-10 scale)')) {
        return JSON.stringify({
          score: 8,
          evidence: ['Direction reinforces heritage craftsmanship.'],
          concerns: [],
          brandDnaFactors: ['Quality-first product development'],
        });
      }

      if (userMessage.includes('AVAILABLE RESEARCH')) {
        return JSON.stringify({
          supportingEvidence: [
            { source: 'Market Gap #1', finding: 'Competitors ignore sustainability', confidence: 0.9 },
            { source: 'Customer Desire', finding: 'Customers mention eco packaging', confidence: 0.8 },
          ],
          contradictingEvidence: [],
          netConfidence: 8,
        });
      }

      if (userMessage.includes('Identify 5-7 risks')) {
        return JSON.stringify([
          {
            risk: 'Supply chain costs increase',
            severity: 'medium',
            likelihood: 'medium',
            mitigation: 'Lock long-term contracts with suppliers',
            impact: 'Margins compressed',
          },
          {
            risk: 'Audience perceives claim as greenwashing',
            severity: 'high',
            likelihood: 'low',
            mitigation: 'Publish transparent lifecycle reports',
            impact: 'Reputation damage',
          },
        ]);
      }

      if (userMessage.includes('Assess:\n1. Can the brand deliver on this?')) {
        return JSON.stringify({
          canDeliver: true,
          requirements: ['Secure compostable packaging supplier', 'Train CX team on sustainability claims'],
          gaps: ['Need lifecycle marketing manager'],
          timeline: '2 quarters',
          resources: ['Packaging engineer', 'Sustainability analyst'],
        });
      }

      if (userMessage.includes('Assess market viability')) {
        return JSON.stringify({
          score: 8,
          targetSegment: 'Urban wellness enthusiasts 28-40',
          segmentSize: 'Mid-size (approx. 4M in target geos)',
          resonanceFactors: ['Growing demand for zero-waste snacks', 'Willingness to pay premium'],
          barriers: ['Need education on composting process'],
        });
      }

      if (userMessage.includes('Rate differentiation (0-10)')) {
        return '8.5';
      }

      if (userMessage.includes('Create a positioning framework')) {
        return JSON.stringify({
          statement: 'For eco-conscious snackers, Test Brand is the premium indulgence that stays planet positive because every bite fuels regenerative farms.',
          targetAudience: 'Eco-conscious professionals seeking responsible indulgence',
          categoryFrame: 'Premium sustainable snacks',
          pointOfDifference: 'Closed-loop compostable packaging with transparent sourcing',
          reasonToBelieve: [
            'Certified compostable pouches',
            'Regenerative cocoa and fruit farms',
            'Third-party verified impact reports',
          ],
        });
      }

      if (userMessage.includes('Create messaging architecture')) {
        return JSON.stringify({
          brandEssence: 'Joyfully Regenerative',
          tagline: 'Indulgence that gives back',
          keyMessages: [
            'Every bite funds regenerative agriculture.',
            'Certified compostable wrappers return to soil in 90 days.',
            'Flavor-first recipes perfected by award-winning chefs.',
          ],
          proofPoints: [
            { claim: 'Certified compostable', evidence: 'BPI Certification #1234' },
            { claim: 'Regenerative sourcing', evidence: 'Partner farms in Costa Rica & Kerala' },
          ],
          toneOfVoice: ['Warm', 'Assured', 'Bright'],
        });
      }

      if (userMessage.includes('Create 5 content examples')) {
        return JSON.stringify([
          {
            type: 'homepage_hero',
            title: 'Close the Loop on Indulgence',
            content: 'Taste dessert-level decadence while restoring the planet with every wrapper you compost.',
            context: 'Homepage hero',
          },
          {
            type: 'about',
            title: 'We Treat Soil Like Royalty',
            content: 'Our farmers tend regenerative plots that sequester carbon and protect biodiversity.',
            context: 'About page storytelling',
          },
          {
            type: 'product',
            title: 'Suncharged Cacao Bites',
            content: 'Small batch cacao, upcycled citrus zest, and a fully compostable pouch.',
            context: 'Product detail page',
          },
          {
            type: 'social',
            title: '#CompostJoy',
            content: 'Show us your compost bin glow-up — the sweetest way to snack.',
            context: 'Instagram carousel',
          },
          {
            type: 'email',
            title: 'Soil Just Got a Sweet Upgrade',
            content: 'Subject: Soil just got a sweet upgrade\nPreview: Meet the snack that makes composting craveable.',
            context: 'Lifecycle email teaser',
          },
        ]);
      }

      if (userMessage.includes('Define evolved visual direction')) {
        return JSON.stringify({
          colorPalette: ['#2E7D32 - Forest canopy', '#FBC02D - Sunlit pollen', '#FFFFFF - Pure canvas'],
          typography: ['Quincy CF - headlines', 'Source Sans - supporting copy'],
          imagery: ['High-contrast macro shots of ingredients', 'Hands returning pouches to soil'],
          designPrinciples: ['Celebrate circularity', 'Hero real textures', 'Keep calls-to-action grounded'],
        });
      }

      if (userMessage.includes('Format as JSON array with keys: channel, priority, tactics, kpis')) {
        return JSON.stringify([
          {
            channel: 'Email Marketing',
            priority: 'primary',
            tactics: ['Lifecycle compost education series', 'Customer spotlight stories'],
            kpis: ['Open rate', 'Repeat purchase rate'],
          },
          {
            channel: 'Social Media (Instagram)',
            priority: 'primary',
            tactics: ['#CompostJoy UGC challenges', 'Behind-the-scenes farm reels'],
            kpis: ['Engagement rate', 'Follower growth'],
          },
          {
            channel: 'Events/Community',
            priority: 'secondary',
            tactics: ['Pop-up compost workshops', 'Farm-to-snack tasting events'],
            kpis: ['Event RSVPs', 'Sampling-to-purchase conversion'],
          },
        ]);
      }

      if (userMessage.includes('Create 4-6 implementation phases')) {
        return JSON.stringify([
          {
            phase: 'Phase 1: Strategy & Enablement',
            duration: '6 weeks',
            deliverables: ['Supplier agreements', 'Lifecycle messaging guide'],
            dependencies: [],
          },
          {
            phase: 'Phase 2: Identity Refresh',
            duration: '8 weeks',
            deliverables: ['Updated packaging design', 'Photography toolkit'],
            dependencies: ['Phase 1'],
          },
          {
            phase: 'Phase 3: Content & Launch',
            duration: '6 weeks',
            deliverables: ['Email sequences', 'Paid social assets', 'UGC starter kit'],
            dependencies: ['Phase 1', 'Phase 2'],
          },
          {
            phase: 'Phase 4: Community Expansion',
            duration: 'Ongoing',
            deliverables: ['Ambassador program', 'Soil impact dashboard'],
            dependencies: ['Phase 3'],
          },
        ]);
      }

      if (userMessage.includes('Define 7-10 success metrics')) {
        return JSON.stringify([
          {
            metric: 'Compost participation submissions',
            baseline: '0',
            target: '5,000 by Q4',
            timeline: 'Q4 2025',
            measurement: 'User uploads tagged #CompostJoy',
          },
          {
            metric: 'Repeat purchase rate',
            baseline: '22%',
            target: '35%',
            timeline: 'Q1 2026',
            measurement: 'Subscription + repeat order data',
          },
          {
            metric: 'Brand favorability for sustainability',
            baseline: '54%',
            target: '75%',
            timeline: 'Q2 2026',
            measurement: 'Quarterly brand tracker',
          },
        ]);
      }

      return JSON.stringify({ message: 'Unhandled prompt in mock LLM', promptPreview: userMessage.slice(0, 80) });
    }
  }

  return { LLMService: MockLLMService };
});

import { CreativeDirector } from '../../src/evolution/creative-director.js';
import { ValidationEngine } from '../../src/evolution/validation-engine.js';
import { BuildOutGenerator } from '../../src/evolution/build-out-generator.js';
import type {
  PatternPresentationOutput,
  ResearchBlitzOutput,
} from '../../src/types/evolution-types.js';
import type { CreativeDirectionConfig } from '../../src/types/evolution-config-types.js';

describe('Evolution phases 3-5 integration', () => {
  it('captures creative direction, validates it, and builds the final strategy', async () => {
    const patterns: PatternPresentationOutput = {
      brandName: 'Test Brand',
      generatedAt: new Date().toISOString(),
      contradictions: [
        {
          id: 'contradiction-1',
          brandSays: 'We are the premium snack',
          evidenceShows: 'Website emphasizes discounts heavily',
          implication: 'Erodes premium perception',
          severity: 'high',
        },
      ],
      whiteSpace: [
        {
          id: 'gap-1',
          description: 'Own compostable packaging leadership',
          competitorFocus: 'Speed and price promotions',
          untappedOpportunity: 'Make sustainability tangible through packaging loop',
          evidence: ['Competitor sites lack compost messaging'],
        },
      ],
      languageGaps: [
        {
          customersSay: 'I want indulgence without guilt',
          brandSays: 'We are just convenient snacks',
          gap: 'Emotionally resonant sustainability story missing',
          examples: ['Customer survey 2025'],
        },
      ],
      positioningMap: {
        axis1: { name: 'Price', low: 'Budget', high: 'Premium' },
        axis2: { name: 'Sustainability', low: 'Basic', high: 'Regenerative' },
        brands: [],
      },
      inflectionPoints: [
        {
          type: 'trend',
          description: 'Compost-at-home programs in major cities expanding',
          timing: 'emerging',
          impact: 'high',
          evidence: ['NYC curbside compost expansion 2025'],
        },
      ],
    };

    const creativeConfig: CreativeDirectionConfig = {
      brandName: 'Test Brand',
      contradictions: [{ patternId: 'contradiction-1', action: 'explore', direction: 'Elevate premium cues via sustainability' }],
      whiteSpace: [{ gapId: 'gap-1', decision: 'pursue', reasoning: 'Leverages proprietary compostable packaging' }],
      creativeLeaps: [{ idea: 'Launch closed-loop refill program', rationale: 'Reinforces regenerative promise' }],
      intuitions: [{ observation: 'Customers proudly share compost bins', context: 'Lifecycle emails', confidence: 0.7 }],
      primaryDirection: 'Own the joyful regenerative snack experience',
      keyThemes: ['Regenerative indulgence', 'Closed-loop joy'],
    };

    const research: ResearchBlitzOutput = {
      brandName: 'Test Brand',
      brandUrl: 'https://testbrand.com',
      generatedAt: new Date().toISOString(),
      brandAudit: {
        positioning: 'Accessible better-for-you snacks',
        visualIdentity: {
          colors: ['#FF6600'],
          typography: ['Arial'],
          imagery: ['Fun lifestyle photography'],
        },
        messaging: {
          tagline: 'Snack happy, live happy',
          keyMessages: ['Tasty', 'Convenient'],
          tone: 'Playful',
        },
        uxFindings: ['Single-page checkout'],
        currentState: 'Growing DTC snack brand with playful imagery.',
      },
      competitors: [
        {
          name: 'FastSnack',
          url: 'https://fastsnack.com',
          positioning: 'Budget-friendly energy bars',
          strengths: ['Low price'],
          weaknesses: ['No sustainability story'],
          differentiators: [],
          pricing: 'Budget',
          channels: ['Retail'],
        },
      ],
      marketGaps: [
        {
          gap: 'Transparent compostable packaging leadership',
          description: 'No competitor combines premium flavor with compostable packaging education.',
          evidence: ['Competitive site audit'],
          opportunitySize: 'large',
          confidence: 0.8,
        },
      ],
      contradictions: [
        {
          what: 'Premium claims vs discount-led visuals',
          evidence: 'Homepage hero uses coupon pop-ups',
          implication: 'Undercuts luxury perception',
          severity: 'medium',
        },
      ],
      customerLanguage: {
        patterns: [
          { phrase: 'Zero waste snacks', frequency: 18, context: 'Survey responses' },
          { phrase: 'Indulgent but ethical', frequency: 12, context: 'Social listening' },
        ],
        sentiment: {
          positive: ['Love the flavors'],
          negative: ['Packaging feels generic'],
          neutral: ['Ships monthly'],
        },
        painPoints: ['Hard to compost without instructions'],
        desires: ['Treat myself without plastic guilt'],
      },
      culturalContext: [
        {
          trend: 'Compost pickup expansion',
          description: 'Major cities adding curbside compost programs',
          relevance: 'Customers ready for compost education',
          source: 'EPA 2025 report',
          date: '2025-08-01',
        },
      ],
      confidence: 0.75,
      sources: ['https://testbrand.com'],
    };

    const creativeDirector = new CreativeDirector();
    const direction = await creativeDirector.captureDirection(patterns, 'config', creativeConfig);

    expect(direction.primaryDirection).toBe(creativeConfig.primaryDirection);
    expect(direction.whiteSpaceDecisions).toHaveLength(1);
    expect(direction.creativeLeaps[0]?.idea).toContain('refill program');

    const validationEngine = new ValidationEngine();
    const validation = await validationEngine.validate(research, direction);

    expect(validation.recommendation).toBe('proceed');
    expect(validation.overallConfidence).toBeGreaterThan(0.75);
    expect(validation.riskAnalysis).toHaveLength(2);

    const buildOutGenerator = new BuildOutGenerator();
    const buildout = await buildOutGenerator.generate(research, direction, validation);

    expect(buildout.positioningFramework.pointOfDifference).toContain('compostable');
    expect(buildout.messagingArchitecture.keyMessages.length).toBeGreaterThan(0);
    expect(buildout.contentExamples.length).toBe(5);
    expect(buildout.channelStrategy[0]?.channel).toBe('Email Marketing');
    expect(buildout.implementationRoadmap.length).toBeGreaterThan(0);
    expect(buildout.successMetrics.length).toBeGreaterThan(0);
    expect(buildout.evidenceTrail).toContainEqual(expect.stringContaining('Research conducted'));
  });
});
