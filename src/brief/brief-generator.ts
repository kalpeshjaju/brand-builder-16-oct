// Agency Brief Generator - Transform brand strategy into professional creative briefs

import type {
  AgencyBrief,
  BrandIdentityBrief,
  VisualGuidelines,
  AssetSpecifications,
  MessagingFramework,
  ExecutionGuidance,
  ColorPaletteSpec,
  TypographySpec,
  LogoGuidelines,
  ImageryGuidance,
  BriefGenerationOptions
} from '../types/brief-types.js';
import type { BrandStrategy } from '../types/index.js';

export class BriefGenerator {
  /**
   * Generate complete agency brief from brand strategy
   */
  async generate(
    strategy: BrandStrategy,
    brandName: string,
    options: BriefGenerationOptions = {}
  ): Promise<AgencyBrief> {
    const {
      includeExamples = true,
      detailLevel = 'standard'
    } = options;

    return {
      brandName,
      generatedAt: new Date().toISOString(),
      brandIdentity: this.generateBrandIdentity(strategy, brandName),
      visualGuidelines: this.generateVisualGuidelines(strategy, brandName, detailLevel),
      assetSpecifications: this.generateAssetSpecs(brandName, detailLevel),
      messagingFramework: this.generateMessagingFramework(strategy, includeExamples),
      executionGuidance: this.generateExecutionGuidance(strategy, brandName)
    };
  }

  /**
   * Generate brand identity brief
   */
  private generateBrandIdentity(strategy: BrandStrategy, brandName: string): BrandIdentityBrief {
    // Generate brand essence (one-sentence distillation)
    const essence = this.generateBrandEssence(strategy, brandName);

    // Extract human analogy from personality
    const humanAnalogy = this.generateHumanAnalogy(strategy);

    // Generate behavioral manifestations of values
    const behaviors = this.generateValueBehaviors(strategy);

    return {
      overview: {
        purpose: strategy.purpose || `To be defined: Why ${brandName} exists beyond profit`,
        mission: strategy.mission || `To be defined: What ${brandName} does and for whom`,
        vision: strategy.vision || `To be defined: Where ${brandName} is headed`,
        essence
      },
      positioning: {
        statement: strategy.positioning || `To be defined: ${brandName}'s unique market position`,
        targetAudience: this.extractTargetAudience(strategy),
        competitors: this.extractCompetitors(strategy),
        differentiation: strategy.differentiators || [
          'To be defined: Key differentiators from competitors'
        ],
        valueProposition: this.generateValueProposition(strategy)
      },
      personality: {
        traits: strategy.personality || [
          'To be defined: Brand personality traits'
        ],
        archetype: this.inferBrandArchetype(strategy),
        humanAnalogy
      },
      values: {
        core: strategy.values || ['To be defined: Core brand values'],
        behaviors
      }
    };
  }

  /**
   * Generate brand essence (one sentence)
   */
  private generateBrandEssence(strategy: BrandStrategy, brandName: string): string {
    if (strategy.positioning && strategy.differentiators && strategy.differentiators.length > 0) {
      const primaryDiff = strategy.differentiators[0];
      if (primaryDiff) {
        return `${brandName} is the brand that ${primaryDiff.toLowerCase()}.`;
      }
    }

    if (strategy.purpose) {
      const simplified = strategy.purpose.split('.')[0]?.toLowerCase() || strategy.purpose.toLowerCase();
      return `${brandName} exists ${simplified}.`;
    }

    return `${brandName}: To be defined - distilled brand essence in one sentence`;
  }

  /**
   * Generate human analogy for brand
   */
  private generateHumanAnalogy(strategy: BrandStrategy): string {
    if (!strategy.personality || strategy.personality.length === 0) {
      return 'To be defined: If this brand were a person, they would be...';
    }

    const traits = strategy.personality.slice(0, 3).join(', ');
    return `A ${traits} individual who values authenticity and builds lasting relationships`;
  }

  /**
   * Generate behavioral manifestations of values
   */
  private generateValueBehaviors(strategy: BrandStrategy): string[] {
    if (!strategy.values || strategy.values.length === 0) {
      return ['To be defined: How values manifest in daily actions'];
    }

    return strategy.values.map(value => {
      return `We demonstrate "${value}" by prioritizing it in every decision and interaction`;
    });
  }

  /**
   * Extract target audience from strategy
   */
  private extractTargetAudience(strategy: BrandStrategy): string {
    const allText = JSON.stringify(strategy).toLowerCase();

    if (allText.includes('b2b') || allText.includes('enterprise') || allText.includes('business')) {
      return 'B2B businesses and enterprises seeking professional solutions';
    }

    if (allText.includes('b2c') || allText.includes('consumer') || allText.includes('individual')) {
      return 'Individual consumers seeking quality products/services';
    }

    return 'To be defined: Primary and secondary target audiences with demographics and psychographics';
  }

  /**
   * Extract competitors from strategy
   */
  private extractCompetitors(_strategy: BrandStrategy): string[] {
    // This is a placeholder - ideally would extract from evolution data
    return [
      'To be defined: 3-5 key competitors with their positioning'
    ];
  }

  /**
   * Generate value proposition
   */
  private generateValueProposition(strategy: BrandStrategy): string {
    if (strategy.positioning && strategy.differentiators && strategy.differentiators.length > 0) {
      const diff = strategy.differentiators[0];
      if (diff) {
        return `We deliver ${diff.toLowerCase()}, enabling customers to achieve better outcomes`;
      }
    }

    return 'To be defined: Clear statement of unique value delivered to customers';
  }

  /**
   * Infer brand archetype
   */
  private inferBrandArchetype(strategy: BrandStrategy): string {
    if (!strategy.personality || strategy.personality.length === 0) {
      return 'To be determined through brand workshop';
    }

    const personalityText = strategy.personality.join(' ').toLowerCase();

    // Simple archetype inference based on personality traits
    if (personalityText.includes('innovat') || personalityText.includes('pioneer')) {
      return 'Creator / Innovator';
    }
    if (personalityText.includes('care') || personalityText.includes('support')) {
      return 'Caregiver';
    }
    if (personalityText.includes('lead') || personalityText.includes('authorit')) {
      return 'Ruler / Leader';
    }
    if (personalityText.includes('friend') || personalityText.includes('approachable')) {
      return 'Everyperson / Friend';
    }

    return 'To be determined: Brand archetype (e.g., Hero, Sage, Creator, Caregiver)';
  }

  /**
   * Generate visual guidelines
   */
  private generateVisualGuidelines(
    strategy: BrandStrategy,
    brandName: string,
    detailLevel: string
  ): VisualGuidelines {
    return {
      colorPalette: this.generateColorPalette(strategy, brandName),
      typography: this.generateTypography(strategy, brandName),
      logoGuidelines: this.generateLogoGuidelines(brandName, detailLevel),
      imagery: this.generateImageryGuidance(strategy),
      designPrinciples: this.generateDesignPrinciples(strategy),
      doAndDonts: {
        do: [
          'Maintain consistent brand voice across all touchpoints',
          'Use approved color palette and typography',
          'Ensure accessibility standards (WCAG 2.1 AA minimum)',
          'Test designs across multiple devices and contexts',
          'Prioritize clarity and user experience'
        ],
        dont: [
          'Alter logo proportions or colors',
          'Use unapproved fonts or colors',
          'Overcrowd designs with too many elements',
          'Ignore brand personality in creative execution',
          'Skip accessibility testing'
        ]
      }
    };
  }

  /**
   * Generate color palette specification
   */
  private generateColorPalette(_strategy: BrandStrategy, _brandName: string): ColorPaletteSpec {
    // This would ideally be generated by AI or based on brand attributes
    // For now, provide professional template
    return {
      primary: [
        {
          name: 'Brand Primary',
          hex: '#2563EB',
          rgb: 'rgb(37, 99, 235)',
          cmyk: 'C84 M58 Y0 K8',
          usage: 'Primary brand color for logos, CTAs, and key elements',
          emotion: 'Trust, professionalism, stability'
        }
      ],
      secondary: [
        {
          name: 'Brand Secondary',
          hex: '#7C3AED',
          rgb: 'rgb(124, 58, 237)',
          cmyk: 'C48 M76 Y0 K7',
          usage: 'Accent color for highlights and secondary elements',
          emotion: 'Innovation, creativity, forward-thinking'
        }
      ],
      neutral: [
        {
          name: 'Neutral Dark',
          hex: '#1E293B',
          rgb: 'rgb(30, 41, 59)',
          cmyk: 'C49 M30 Y0 K77',
          usage: 'Primary text and dark UI elements',
          emotion: 'Professional, grounded, reliable'
        },
        {
          name: 'Neutral Light',
          hex: '#F8FAFC',
          rgb: 'rgb(248, 250, 252)',
          cmyk: 'C2 M1 Y0 K1',
          usage: 'Backgrounds, light surfaces',
          emotion: 'Clean, spacious, modern'
        }
      ],
      accent: [
        {
          name: 'Accent Success',
          hex: '#10B981',
          rgb: 'rgb(16, 185, 129)',
          cmyk: 'C56 M0 Y30 K27',
          usage: 'Success states, positive actions',
          emotion: 'Growth, success, vitality'
        }
      ],
      guidance: {
        primaryUse: 'Use primary color for brand presence (logos, CTAs, key touchpoints)',
        secondaryUse: 'Use secondary color sparingly for accents and visual interest',
        combinations: [
          'Primary + Neutral Light (high contrast, accessible)',
          'Secondary + Neutral Dark (sophisticated, modern)',
          'Primary + Secondary (energetic, dynamic - use carefully)'
        ],
        accessibility: 'All text combinations must meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)'
      }
    };
  }

  /**
   * Generate typography specification
   */
  private generateTypography(strategy: BrandStrategy, _brandName: string): TypographySpec {
    // Infer font personality from brand personality
    const isModern = strategy.personality?.some(p =>
      /modern|contemporary|innovative|cutting.edge/i.test(p)
    );
    const isProfessional = strategy.personality?.some(p =>
      /professional|authoritative|credible|trustworthy/i.test(p)
    );

    const primaryFont = isModern
      ? 'Inter (modern, clean geometric sans-serif)'
      : isProfessional
      ? 'Source Sans Pro (professional, highly readable)'
      : 'Open Sans (friendly, versatile)';

    return {
      primaryFont: {
        name: primaryFont.split('(')[0]?.trim() || primaryFont,
        family: 'sans-serif',
        weights: [400, 500, 600, 700],
        styles: ['regular', 'italic'],
        source: 'Google Fonts',
        fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
        usage: 'All headings, UI elements, and primary content',
        personality: primaryFont.split('(')[1]?.replace(')', '') || 'Clean and professional'
      },
      secondaryFont: {
        name: 'Georgia',
        family: 'serif',
        weights: [400, 700],
        styles: ['regular', 'italic'],
        source: 'System font',
        fallbacks: ['Times New Roman', 'serif'],
        usage: 'Long-form content, quotes, editorial content (optional)',
        personality: 'Classic, readable, authoritative'
      },
      headingHierarchy: {
        h1: { fontSize: '2.5rem', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontSize: '2rem', lineHeight: '1.3', fontWeight: 600, letterSpacing: '-0.01em' },
        h3: { fontSize: '1.5rem', lineHeight: '1.4', fontWeight: 600 },
        h4: { fontSize: '1.25rem', lineHeight: '1.5', fontWeight: 500 }
      },
      bodyText: {
        fontSize: '1rem',
        lineHeight: '1.6',
        fontWeight: 400
      },
      guidance: {
        pairing: 'Primary font for structure, secondary font for warmth and editorial content',
        sizing: 'Use modular scale (1.25 ratio) for consistent hierarchy',
        spacing: 'Maintain generous line-height (1.6+ for body) for readability',
        accessibility: 'Minimum 16px for body text, sufficient contrast, no all-caps for long text'
      }
    };
  }

  /**
   * Generate logo guidelines
   */
  private generateLogoGuidelines(_brandName: string, detailLevel: string): LogoGuidelines {
    const comprehensive = detailLevel === 'comprehensive';

    return {
      variations: [
        {
          name: 'Primary Logo',
          description: 'Full-color horizontal lockup',
          usage: 'Default logo for most applications',
          formats: ['SVG', 'PNG'],
          colorMode: 'full-color'
        },
        {
          name: 'Monochrome',
          description: 'Single-color version for limited color contexts',
          usage: 'Fax, stamps, single-color printing',
          formats: ['SVG', 'PNG'],
          colorMode: 'monochrome'
        },
        {
          name: 'Reverse',
          description: 'White logo for dark backgrounds',
          usage: 'Dark backgrounds, photography overlays',
          formats: ['SVG', 'PNG'],
          colorMode: 'reverse'
        },
        ...(comprehensive ? [{
          name: 'Icon Mark',
          description: 'Standalone icon without text',
          usage: 'App icons, favicons, social media profiles',
          formats: ['SVG', 'PNG', 'ICO'],
          colorMode: 'full-color' as const
        }] : [])
      ],
      clearSpace: 'Minimum clear space equals the height of the "x" in the brand name',
      minimumSize: {
        print: '0.5 inches / 13mm wide',
        digital: '120px wide for optimal legibility'
      },
      placement: [
        'Top left corner (primary web placement)',
        'Center (hero sections, full-page applications)',
        'Bottom right (documents, invoices)'
      ],
      incorrectUsage: [
        'Do not stretch, skew, or rotate the logo',
        'Do not change logo colors',
        'Do not add effects (shadows, gradients, outlines)',
        'Do not place on busy backgrounds without clear space',
        'Do not recreate or modify logo elements'
      ],
      fileFormats: {
        vector: ['SVG (web)', 'AI (Adobe Illustrator)', 'EPS (print)'],
        raster: ['PNG (transparency)', 'JPG (photography)'],
        sizes: ['@1x', '@2x', '@3x for retina displays']
      }
    };
  }

  /**
   * Generate imagery guidance
   */
  private generateImageryGuidance(strategy: BrandStrategy): ImageryGuidance {
    const personalityText = (strategy.personality || []).join(' ').toLowerCase();

    const isModern = /modern|contemporary|innovative/.test(personalityText);
    const isWarm = /friendly|approachable|warm|welcoming/.test(personalityText);
    const isProfessional = /professional|corporate|business/.test(personalityText);

    return {
      style: isModern
        ? 'Clean, minimalist, high-quality photography with negative space'
        : isWarm
        ? 'Authentic, candid photography with warm tones and human connection'
        : 'Professional, composed photography with balanced lighting',
      subjects: [
        'Real people (not overly staged stock photos)',
        'Products in context of use',
        'Environmental shots that reflect brand values',
        'Close-ups highlighting quality and craftsmanship'
      ],
      composition: [
        'Rule of thirds for balanced composition',
        'Generous negative space around subjects',
        'Consistent perspective and depth of field',
        'Natural, directional lighting'
      ],
      mood: isProfessional
        ? ['Confident', 'Composed', 'Professional', 'Aspirational']
        : isWarm
        ? ['Welcoming', 'Authentic', 'Optimistic', 'Human']
        : ['Modern', 'Clean', 'Sophisticated', 'Innovative'],
      filters: [
        'Subtle, consistent color grading',
        'Maintain natural skin tones',
        'Avoid heavy saturation or over-processing',
        'Consistent editing style across all imagery'
      ],
      avoid: [
        'Generic stock photography clichés',
        'Artificial or overly staged scenarios',
        'Inconsistent visual styles across images',
        'Heavy filters or dated effects',
        'Imagery that contradicts brand values'
      ],
      examples: [
        {
          description: 'Hero image: Professional using product in natural environment',
          reasoning: 'Shows real-world application while maintaining aspirational quality'
        },
        {
          description: 'Product detail: Close-up showcasing quality and craftsmanship',
          reasoning: 'Builds trust through transparency and attention to detail'
        },
        {
          description: 'Lifestyle: Authentic moment capturing brand values in action',
          reasoning: 'Creates emotional connection and demonstrates brand impact'
        }
      ]
    };
  }

  /**
   * Generate design principles
   */
  private generateDesignPrinciples(strategy: BrandStrategy): string[] {
    const principles = [
      'Clarity over cleverness - prioritize user understanding',
      'Consistency builds recognition - maintain visual and verbal patterns',
      'Authenticity over perfection - show real, relatable moments'
    ];

    if (strategy.personality?.some(p => /innovative|modern/i.test(p))) {
      principles.push('Embrace white space - let design breathe');
    }

    if (strategy.values?.some(v => /quality|excellence/i.test(v))) {
      principles.push('Attention to detail - quality in every element');
    }

    if (strategy.personality?.some(p => /accessible|friendly|approachable/i.test(p))) {
      principles.push('Inclusive design - accessible to all users');
    }

    return principles;
  }

  /**
   * Generate asset specifications
   */
  private generateAssetSpecs(_brandName: string, detailLevel: string): AssetSpecifications {
    const comprehensive = detailLevel === 'comprehensive';

    return {
      digital: {
        website: {
          logo: [
            { name: 'Header Logo', dimensions: '240x60px', format: 'SVG, PNG', resolution: '@2x', purpose: 'Main navigation' },
            { name: 'Footer Logo', dimensions: '180x45px', format: 'SVG, PNG', resolution: '@2x', purpose: 'Footer branding' }
          ],
          favicon: [
            { name: 'Favicon', dimensions: '32x32px', format: 'ICO, PNG', purpose: 'Browser tab icon' },
            { name: 'Apple Touch Icon', dimensions: '180x180px', format: 'PNG', purpose: 'iOS home screen' }
          ],
          ogImage: [
            { name: 'Open Graph Image', dimensions: '1200x630px', format: 'JPG, PNG', purpose: 'Social media sharing' }
          ],
          heroImages: [
            { name: 'Hero Desktop', dimensions: '1920x1080px', format: 'JPG', colorSpace: 'sRGB', purpose: 'Homepage hero' },
            { name: 'Hero Mobile', dimensions: '750x1334px', format: 'JPG', colorSpace: 'sRGB', purpose: 'Mobile homepage' }
          ]
        },
        email: {
          headerLogo: [
            { name: 'Email Header', dimensions: '600x100px', format: 'PNG', purpose: 'Email template header' }
          ],
          emailWidth: '600px maximum width',
          imageSpecs: [
            { name: 'Email Image', dimensions: '600x400px', format: 'JPG, PNG', purpose: 'Email content images' }
          ]
        },
        display: {
          bannerSizes: [
            { name: 'Leaderboard', dimensions: '728x90px', format: 'JPG, PNG, GIF', purpose: 'Display advertising' },
            { name: 'Medium Rectangle', dimensions: '300x250px', format: 'JPG, PNG, GIF', purpose: 'Display advertising' },
            { name: 'Skyscraper', dimensions: '160x600px', format: 'JPG, PNG, GIF', purpose: 'Display advertising' }
          ],
          videoSpecs: comprehensive ? [
            { name: 'Pre-roll Video', duration: '15-30s', aspectRatio: '16:9', resolution: '1920x1080', frameRate: '30fps', codec: 'H.264', format: 'MP4' }
          ] : []
        }
      },
      print: {
        businessCards: {
          size: '3.5" x 2" (US Standard)',
          bleed: '0.125" all sides',
          resolution: '300 DPI minimum',
          colorMode: 'CMYK'
        },
        letterhead: {
          size: '8.5" x 11" (US Letter)',
          margins: '1" all sides',
          resolution: '300 DPI minimum'
        },
        brochures: {
          sizes: ['8.5" x 11"', '8.5" x 14"', 'A4'],
          folds: ['Bi-fold', 'Tri-fold', 'Z-fold'],
          resolution: '300 DPI minimum'
        }
      },
      social: {
        profileImages: [
          { platform: 'Facebook', size: '180x180px', format: 'PNG, JPG' },
          { platform: 'Twitter', size: '400x400px', format: 'PNG, JPG' },
          { platform: 'LinkedIn', size: '400x400px', format: 'PNG, JPG' },
          { platform: 'Instagram', size: '320x320px', format: 'PNG, JPG' }
        ],
        coverImages: [
          { platform: 'Facebook', size: '820x312px', format: 'JPG, PNG' },
          { platform: 'Twitter', size: '1500x500px', format: 'JPG, PNG' },
          { platform: 'LinkedIn', size: '1584x396px', format: 'JPG, PNG' }
        ],
        postSizes: [
          { platform: 'Instagram', square: '1080x1080px', landscape: '1080x566px', portrait: '1080x1350px', stories: '1080x1920px' },
          { platform: 'Facebook', square: '1200x1200px', landscape: '1200x630px', portrait: '1080x1350px', stories: '1080x1920px' },
          { platform: 'Twitter', square: '1200x1200px', landscape: '1200x675px', portrait: '1080x1350px', stories: 'N/A' },
          { platform: 'LinkedIn', square: '1200x1200px', landscape: '1200x627px', portrait: '1080x1350px', stories: 'N/A' }
        ],
        videoSpecs: comprehensive ? [
          { platform: 'Instagram Feed', maxDuration: '60s', aspectRatio: '1:1, 4:5', resolution: '1080x1080px' },
          { platform: 'Instagram Stories', maxDuration: '15s', aspectRatio: '9:16', resolution: '1080x1920px' },
          { platform: 'Facebook', maxDuration: '240s', aspectRatio: '16:9, 1:1, 4:5', resolution: '1080p minimum' },
          { platform: 'LinkedIn', maxDuration: '600s', aspectRatio: '16:9, 1:1', resolution: '1080p minimum' }
        ] : []
      },
      marketing: {
        presentations: {
          slides: ['Master template', 'Title slide', 'Content slide', 'Image slide', 'Closing slide'],
          templates: ['PowerPoint (.pptx)', 'Keynote (.key)', 'Google Slides']
        },
        documents: {
          templates: ['Word template', 'Google Docs template', 'PDF template'],
          styles: ['Headings hierarchy', 'Body text', 'Pull quotes', 'Tables']
        },
        promotional: comprehensive ? {
          items: ['T-shirts', 'Mugs', 'Pens', 'Notebooks', 'Tote bags'],
          specifications: ['Vector logos required', 'Pantone color matching', 'Vendor approval process']
        } : {
          items: ['To be specified based on needs'],
          specifications: ['Vector logos required for all promotional items']
        }
      },
      deliverables: [
        {
          id: 'DELIV-001',
          name: 'Brand Identity Package',
          category: 'identity',
          priority: 'critical',
          format: ['PDF guide', 'Digital assets'],
          specifications: 'Complete brand guidelines with all logo variations and usage rules',
          timeline: 'Phase 1 - Week 1-2',
          dependencies: []
        },
        {
          id: 'DELIV-002',
          name: 'Website Assets',
          category: 'digital',
          priority: 'critical',
          format: ['SVG', 'PNG', 'JPG'],
          specifications: 'All sizes and formats for website implementation',
          timeline: 'Phase 1 - Week 2-3',
          dependencies: ['DELIV-001']
        },
        {
          id: 'DELIV-003',
          name: 'Social Media Templates',
          category: 'social',
          priority: 'high',
          format: ['PSD', 'Figma', 'Canva'],
          specifications: 'Editable templates for all major platforms',
          timeline: 'Phase 2 - Week 3-4',
          dependencies: ['DELIV-001']
        },
        {
          id: 'DELIV-004',
          name: 'Print Collateral',
          category: 'print',
          priority: 'medium',
          format: ['PDF', 'AI'],
          specifications: 'Business cards, letterhead, print-ready files',
          timeline: 'Phase 2 - Week 4-5',
          dependencies: ['DELIV-001']
        }
      ]
    };
  }

  /**
   * Generate messaging framework
   */
  private generateMessagingFramework(strategy: BrandStrategy, includeExamples: boolean): MessagingFramework {
    return {
      voice: {
        description: strategy.voiceAndTone?.voice || 'To be defined: Consistent brand voice description',
        attributes: strategy.voiceAndTone?.toneAttributes || [
          'To be defined: Voice attributes (e.g., professional, friendly, authoritative)'
        ],
        examples: includeExamples ? [
          {
            context: 'Homepage hero headline',
            good: 'Transform your workflow with intelligent automation',
            bad: 'Our revolutionary AI platform disrupts the industry',
            reasoning: 'Good: Clear benefit, active voice. Bad: Jargon, vague claims'
          },
          {
            context: 'Error message',
            good: 'We couldn\'t process your payment. Please check your card details and try again.',
            bad: 'ERROR: Payment failed. Code 500.',
            reasoning: 'Good: Human, helpful, actionable. Bad: Technical, unhelpful'
          }
        ] : []
      },
      tone: {
        situations: [
          {
            situation: 'Marketing & Sales',
            tone: 'Confident but not pushy, benefit-focused',
            example: 'See how [Brand] helps teams save 10 hours per week'
          },
          {
            situation: 'Customer Support',
            tone: 'Empathetic, patient, solution-oriented',
            example: 'I understand this is frustrating. Let\'s solve this together.'
          },
          {
            situation: 'Product Updates',
            tone: 'Excited but professional, clear about benefits',
            example: 'Introducing [Feature]: Now you can [benefit] with just one click'
          },
          {
            situation: 'Crisis Communication',
            tone: 'Transparent, accountable, reassuring',
            example: 'We experienced an outage. Here\'s what happened and how we\'re preventing it'
          }
        ],
        guidelines: [
          'Adapt tone to context while maintaining consistent voice',
          'Be more formal in B2B contexts, more conversational in B2C',
          'Match emotional tone to situation (celebrate wins, empathize with problems)',
          'Always prioritize clarity over cleverness'
        ]
      },
      keyMessages: {
        primary: strategy.keyMessages || [
          'To be defined: 3-5 primary brand messages that communicate core value'
        ],
        secondary: [
          'Supporting message reinforcing primary value',
          'Proof point demonstrating capability',
          'Customer success example'
        ],
        proofPoints: strategy.differentiators || [
          'Specific evidence supporting brand claims',
          'Quantifiable results or achievements',
          'Customer testimonials or case studies'
        ]
      },
      taglines: {
        primary: undefined,
        alternatives: [
          'Option 1: [Benefit-focused tagline]',
          'Option 2: [Aspirational tagline]',
          'Option 3: [Action-oriented tagline]'
        ],
        usage: 'Use primary tagline consistently across all brand touchpoints'
      },
      boilerplate: {
        short: this.generateBoilerplate(strategy, 'short'),
        medium: this.generateBoilerplate(strategy, 'medium'),
        long: this.generateBoilerplate(strategy, 'long')
      }
    };
  }

  /**
   * Generate boilerplate text
   */
  private generateBoilerplate(strategy: BrandStrategy, length: 'short' | 'medium' | 'long'): string {
    const brandName = 'Brand Name'; // Would be passed in

    if (length === 'short') {
      if (strategy.positioning) {
        return `${brandName} ${strategy.positioning}`;
      }
      return `${brandName} is [one-sentence description of what the company does and who it serves]. [Founded year] | [Location]`;
    }

    if (length === 'medium') {
      const parts = [];
      if (strategy.positioning) parts.push(strategy.positioning);
      if (strategy.differentiators && strategy.differentiators.length > 0 && strategy.differentiators[0]) {
        parts.push(`Our unique approach includes ${strategy.differentiators[0].toLowerCase()}.`);
      }
      parts.push('Learn more at [website].');
      return parts.join(' ');
    }

    // Long boilerplate
    const parts = [];
    if (strategy.purpose) {
      parts.push(`${brandName} exists ${strategy.purpose.toLowerCase()}.`);
    }
    if (strategy.mission) {
      parts.push(strategy.mission);
    }
    if (strategy.differentiators && strategy.differentiators.length > 0) {
      parts.push(`We stand apart through ${strategy.differentiators.slice(0, 2).join(' and ').toLowerCase()}.`);
    }
    if (strategy.values && strategy.values.length > 0) {
      parts.push(`Guided by values of ${strategy.values.slice(0, 3).join(', ').toLowerCase()}, we're committed to excellence.`);
    }
    parts.push('[Company info: Founded year, headquarters, team size, key achievements]');
    parts.push('For more information, visit [website] or contact [email].');

    return parts.join(' ');
  }

  /**
   * Generate execution guidance
   */
  private generateExecutionGuidance(_strategy: BrandStrategy, _brandName: string): ExecutionGuidance {
    return {
      websiteGuidance: {
        homepage: [
          'Hero section: Clear value proposition within 5 seconds',
          'Social proof: Logos, testimonials, or metrics above the fold',
          'Primary CTA: Single, clear action aligned with business goal',
          'Benefits over features: Focus on customer outcomes',
          'Trust signals: Security, certifications, guarantees'
        ],
        navigation: [
          'Maximum 7 top-level nav items for cognitive ease',
          'Clear labels using customer language, not internal jargon',
          'Consistent navigation across all pages',
          'Mobile-first design with hamburger menu',
          'Prominent CTA in navigation bar'
        ],
        contentStrategy: [
          'Homepage: Who you serve, what you offer, why choose you',
          'About page: Mission, story, team, values in action',
          'Product/Service pages: Benefits, features, pricing, CTAs',
          'Resources: Blog, case studies, guides (build authority)',
          'Contact: Multiple ways to reach (form, email, phone, chat)'
        ],
        ux: [
          'Loading time under 3 seconds',
          'Mobile-responsive across all breakpoints',
          'Accessibility: WCAG 2.1 AA compliance minimum',
          'Clear visual hierarchy guiding eye to key elements',
          'Frictionless forms with inline validation'
        ]
      },
      contentGuidance: {
        blogPosts: [
          'Educational over promotional (80/20 rule)',
          'SEO-optimized: keyword research, meta descriptions, internal linking',
          'Scannable format: headings, bullets, short paragraphs',
          'Visuals: Featured image + in-content imagery',
          'CTA at end directing to relevant product/service'
        ],
        socialMedia: [
          'Platform-specific content (not cross-posting identical content)',
          '80% value (education, entertainment, inspiration) / 20% promotion',
          'Consistent posting schedule maintaining presence',
          'Authentic brand voice adapted to platform norms',
          'Engage with community: respond, share, participate'
        ],
        emailMarketing: [
          'Subject lines: Clear, benefit-focused, under 50 characters',
          'Preview text: Extend subject line, compelling reason to open',
          'Personal from name (not generic company)',
          'Single primary CTA per email',
          'Mobile-optimized design and copy'
        ],
        video: [
          'Hook within first 3 seconds to stop scroll',
          'Captions for 85% of viewers watching without sound',
          'Clear narrative arc: problem → solution → call to action',
          'Brand presence without being heavy-handed',
          'Multiple formats: tutorials, testimonials, culture'
        ]
      },
      campaignGuidance: {
        launch: [
          'Pre-launch teaser campaign building anticipation',
          'Launch event creating moment of awareness',
          'Multi-channel activation (PR, social, email, paid)',
          'Influencer/partner amplification for reach',
          'Measurement framework tracking key metrics'
        ],
        ongoing: [
          'Always-on content maintaining brand presence',
          'Seasonal campaigns aligned with calendar',
          'Product launches following proven playbook',
          'Retargeting campaigns nurturing consideration',
          'Lifecycle campaigns based on customer journey'
        ],
        seasonal: [
          'Plan 90 days ahead for major holidays/seasons',
          'Adapt brand creative to seasonal themes',
          'Limited-time offers creating urgency',
          'Seasonal content resonating with audience mood',
          'Post-season follow-up continuing relationship'
        ]
      },
      partnershipGuidance: {
        cobranding: [
          'Partner alignment: Shared values and complementary audiences',
          'Visual guidelines: How logos appear together',
          'Messaging approval: Both brands review communications',
          'Clear value exchange: What each partner contributes',
          'Success metrics: How partnership performance is measured'
        ],
        sponsorships: [
          'Brand fit: Event/property aligns with brand values',
          'Activation plan: How to leverage beyond logo placement',
          'Content creation: Behind-scenes, interviews, experiences',
          'Measurement: Awareness, engagement, lead generation',
          'Long-term relationship building repeat opportunities'
        ],
        collaborations: [
          'Win-win value: Clear benefits for all parties',
          'Creative freedom: Balance brand guidelines with collaboration spirit',
          'Co-creation: Involve customers/community in process',
          'Authentic narrative: Story behind collaboration',
          'Limited availability creating exclusivity and urgency'
        ]
      }
    };
  }
}
