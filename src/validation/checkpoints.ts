// 26 Quality Checkpoints for Brand Strategy Validation

import type { QualityCheckpoint, CheckpointCategory, CheckpointResult, ValidationContext } from '../types/validation-types.js';
import type { BrandStrategy } from '../types/index.js';

/**
 * CATEGORY 1: Brand Foundation (5 checkpoints)
 */
const foundationCheckpoints: QualityCheckpoint[] = [
  {
    id: 'F01',
    category: 'foundation',
    name: 'Purpose Statement',
    description: 'Brand has a clear, compelling purpose statement',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasPurpose = !!strategy.purpose;
      const isSubstantive = strategy.purpose && strategy.purpose.length > 50;
      const isActionable = strategy.purpose && /\b(empower|enable|transform|provide|help|create|build|deliver)\b/i.test(strategy.purpose);

      if (!hasPurpose) {
        return {
          checkpointId: 'F01',
          status: 'fail',
          score: 0,
          message: 'Missing brand purpose statement',
          suggestions: [
            'Define why the brand exists beyond making money',
            'Answer: What positive change do we create in the world?',
            'Make it inspirational yet achievable'
          ]
        };
      }

      if (!isSubstantive) {
        return {
          checkpointId: 'F01',
          status: 'warning',
          score: 40,
          message: 'Purpose statement is too brief',
          details: `Current length: ${strategy.purpose?.length || 0} characters (minimum: 50)`,
          suggestions: ['Expand purpose to be more descriptive and meaningful']
        };
      }

      if (!isActionable) {
        return {
          checkpointId: 'F01',
          status: 'warning',
          score: 70,
          message: 'Purpose lacks action-oriented language',
          suggestions: ['Use verbs like: empower, enable, transform, provide, help']
        };
      }

      return {
        checkpointId: 'F01',
        status: 'pass',
        score: 100,
        message: 'Strong purpose statement',
        evidence: strategy.purpose ? [strategy.purpose] : []
      };
    }
  },
  {
    id: 'F02',
    category: 'foundation',
    name: 'Mission Clarity',
    description: 'Mission statement is clear, specific, and actionable',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasMission = !!strategy.mission;
      const isSpecific = strategy.mission && strategy.mission.length > 40;
      const hasActionVerbs = strategy.mission && /\b(provide|deliver|create|build|offer|enable)\b/i.test(strategy.mission);

      if (!hasMission) {
        return {
          checkpointId: 'F02',
          status: 'fail',
          score: 0,
          message: 'Missing mission statement',
          suggestions: [
            'Define what you do and for whom',
            'Make it specific and actionable',
            'Answer: How do we fulfill our purpose?'
          ]
        };
      }

      const score = (isSpecific ? 50 : 0) + (hasActionVerbs ? 50 : 0);
      const status = score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail';

      return {
        checkpointId: 'F02',
        status,
        score,
        message: score >= 80 ? 'Clear mission statement' : 'Mission needs improvement',
        suggestions: score < 80 ? [
          'Make mission more specific',
          'Use action-oriented language',
          'Clarify target audience and value delivered'
        ] : undefined
      };
    }
  },
  {
    id: 'F03',
    category: 'foundation',
    name: 'Vision Statement',
    description: 'Vision paints an inspiring future state',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasVision = !!strategy.vision;
      const isAspirative = strategy.vision && /\b(become|transform|lead|pioneer|revolutionize|world|global|industry)\b/i.test(strategy.vision);
      const isFutureFocused = strategy.vision && /\b(will|future|tomorrow|ahead|2030|2025)\b/i.test(strategy.vision);

      if (!hasVision) {
        return {
          checkpointId: 'F03',
          status: 'fail',
          score: 0,
          message: 'Missing vision statement',
          suggestions: [
            'Describe the ideal future state you\'re working toward',
            'Make it aspirational and inspiring',
            'Answer: Where are we going?'
          ]
        };
      }

      const score = 40 + (isAspirative ? 30 : 0) + (isFutureFocused ? 30 : 0);
      const status = score >= 80 ? 'pass' : 'warning';

      return {
        checkpointId: 'F03',
        status,
        score,
        message: score >= 80 ? 'Inspiring vision statement' : 'Vision needs more aspiration',
        suggestions: score < 80 ? [
          'Make vision more aspirational',
          'Add future-focused language',
          'Paint a compelling picture of success'
        ] : undefined
      };
    }
  },
  {
    id: 'F04',
    category: 'foundation',
    name: 'Core Values',
    description: 'Brand has 3-7 distinctive core values',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasValues = strategy.values && strategy.values.length > 0;
      const optimalCount = strategy.values && strategy.values.length >= 3 && strategy.values.length <= 7;
      const areDistinctive = strategy.values && strategy.values.every(v => v.length > 5);

      if (!hasValues) {
        return {
          checkpointId: 'F04',
          status: 'fail',
          score: 0,
          message: 'Missing core values',
          suggestions: [
            'Define 3-7 core values that guide brand behavior',
            'Make them distinctive, not generic',
            'Ensure they reflect actual brand priorities'
          ]
        };
      }

      if (!optimalCount) {
        return {
          checkpointId: 'F04',
          status: 'warning',
          score: 50,
          message: strategy.values!.length < 3
            ? `Too few values (${strategy.values!.length}). Aim for 3-7.`
            : `Too many values (${strategy.values!.length}). Aim for 3-7.`,
          suggestions: [
            strategy.values!.length < 3
              ? 'Add more core values to cover key principles'
              : 'Consolidate to 3-7 most important values'
          ]
        };
      }

      if (!areDistinctive) {
        return {
          checkpointId: 'F04',
          status: 'warning',
          score: 70,
          message: 'Some values are too generic',
          suggestions: ['Make values more specific and distinctive to your brand']
        };
      }

      return {
        checkpointId: 'F04',
        status: 'pass',
        score: 100,
        message: `Strong set of ${strategy.values!.length} core values`,
        evidence: strategy.values
      };
    }
  },
  {
    id: 'F05',
    category: 'foundation',
    name: 'Foundation Alignment',
    description: 'Purpose, mission, vision, and values are aligned',
    severity: 'medium',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasAll = strategy.purpose && strategy.mission && strategy.vision && strategy.values && strategy.values.length > 0;

      if (!hasAll) {
        return {
          checkpointId: 'F05',
          status: 'skipped',
          score: 0,
          message: 'Cannot assess alignment - missing foundation elements'
        };
      }

      // Check for thematic consistency
      const allText = [strategy.purpose, strategy.mission, strategy.vision, ...(strategy.values || [])].join(' ').toLowerCase();
      const hasConsistentThemes = /\b(quality|innovation|customer|excellence|trust|integrity)\b/.test(allText);

      return {
        checkpointId: 'F05',
        status: hasConsistentThemes ? 'pass' : 'warning',
        score: hasConsistentThemes ? 100 : 70,
        message: hasConsistentThemes
          ? 'Foundation elements show thematic alignment'
          : 'Foundation elements may lack thematic consistency',
        suggestions: !hasConsistentThemes ? [
          'Review purpose, mission, vision, and values for consistent themes',
          'Ensure they reinforce each other rather than conflict'
        ] : undefined
      };
    }
  }
];

/**
 * CATEGORY 2: Strategic Clarity (5 checkpoints)
 */
const strategicCheckpoints: QualityCheckpoint[] = [
  {
    id: 'S01',
    category: 'strategic',
    name: 'Positioning Statement',
    description: 'Clear, differentiated positioning statement exists',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasPositioning = !!strategy.positioning;
      const isSubstantive = strategy.positioning && strategy.positioning.length > 100;
      const hasTargetAudience = strategy.positioning && /\b(for|target|serve|help|customers|users|businesses)\b/i.test(strategy.positioning);
      const hasDifferentiation = strategy.positioning && /\b(only|unique|unlike|different|first|leading|exclusively)\b/i.test(strategy.positioning);

      if (!hasPositioning) {
        return {
          checkpointId: 'S01',
          status: 'fail',
          score: 0,
          message: 'Missing positioning statement',
          suggestions: [
            'Define who you serve, what you offer, and why you\'re different',
            'Use format: For [target], we [offer] by [differentiation]',
            'Make it specific and defensible'
          ]
        };
      }

      const score = 25 + (isSubstantive ? 25 : 0) + (hasTargetAudience ? 25 : 0) + (hasDifferentiation ? 25 : 0);
      const status = score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail';

      return {
        checkpointId: 'S01',
        status,
        score,
        message: score >= 80 ? 'Strong positioning statement' : 'Positioning needs strengthening',
        suggestions: score < 80 ? [
          !isSubstantive ? 'Expand positioning with more detail' : '',
          !hasTargetAudience ? 'Clarify target audience' : '',
          !hasDifferentiation ? 'Articulate clear differentiation' : ''
        ].filter(Boolean) : undefined
      };
    }
  },
  {
    id: 'S02',
    category: 'strategic',
    name: 'Target Audience',
    description: 'Target audience is clearly defined and specific',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      // Check if target audience is mentioned in positioning or other fields
      const allText = JSON.stringify(strategy).toLowerCase();
      const hasTargetMention = /\b(target|audience|customers|users|segment|demographic)\b/i.test(allText);
      const hasSpecifics = /\b(age|income|profession|industry|b2b|b2c|enterprise|sme|startup)\b/i.test(allText);

      if (!hasTargetMention) {
        return {
          checkpointId: 'S02',
          status: 'fail',
          score: 0,
          message: 'Target audience not defined',
          suggestions: [
            'Define primary and secondary target audiences',
            'Include demographics, psychographics, and behaviors',
            'Be specific enough to guide decisions'
          ]
        };
      }

      return {
        checkpointId: 'S02',
        status: hasSpecifics ? 'pass' : 'warning',
        score: hasSpecifics ? 100 : 60,
        message: hasSpecifics ? 'Target audience defined' : 'Target audience lacks specificity',
        suggestions: !hasSpecifics ? [
          'Add demographic and psychographic details',
          'Specify customer segments and priorities'
        ] : undefined
      };
    }
  },
  {
    id: 'S03',
    category: 'strategic',
    name: 'Differentiation',
    description: 'Clear differentiators from competitors',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasDifferentiators = strategy.differentiators && strategy.differentiators.length > 0;
      const hasEnoughDifferentiators = strategy.differentiators && strategy.differentiators.length >= 3;
      const areSpecific = strategy.differentiators && strategy.differentiators.every(d => d.length > 20);

      if (!hasDifferentiators) {
        return {
          checkpointId: 'S03',
          status: 'fail',
          score: 0,
          message: 'No competitive differentiators defined',
          suggestions: [
            'Identify 3-5 key differentiators from competitors',
            'Make them specific and defensible',
            'Focus on unique value, not generic claims'
          ]
        };
      }

      const score = 30 + (hasEnoughDifferentiators ? 35 : 0) + (areSpecific ? 35 : 0);
      const status = score >= 80 ? 'pass' : 'warning';

      return {
        checkpointId: 'S03',
        status,
        score,
        message: score >= 80
          ? `Strong differentiation with ${strategy.differentiators!.length} unique factors`
          : 'Differentiation needs strengthening',
        evidence: strategy.differentiators,
        suggestions: score < 80 ? [
          !hasEnoughDifferentiators ? 'Add more differentiators (aim for 3-5)' : '',
          !areSpecific ? 'Make differentiators more specific and detailed' : ''
        ].filter(Boolean) : undefined
      };
    }
  },
  {
    id: 'S04',
    category: 'strategic',
    name: 'Value Proposition',
    description: 'Clear value proposition for target customers',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      // Value proposition can be in positioning or key messages
      const hasPositioning = !!strategy.positioning;
      const hasKeyMessages = strategy.keyMessages && strategy.keyMessages.length > 0;

      if (!hasPositioning && !hasKeyMessages) {
        return {
          checkpointId: 'S04',
          status: 'fail',
          score: 0,
          message: 'No value proposition articulated',
          suggestions: [
            'Define clear value proposition',
            'Answer: What unique value do customers get?',
            'Make it customer-benefit focused'
          ]
        };
      }

      const valueText = (strategy.positioning || '') + (strategy.keyMessages || []).join(' ');
      const hasBenefits = /\b(benefit|value|advantage|save|improve|increase|reduce|faster|better|easier)\b/i.test(valueText);
      const isQuantified = /\b(\d+%|\d+x|save \$|within \d+)\b/i.test(valueText);

      const score = 40 + (hasBenefits ? 40 : 0) + (isQuantified ? 20 : 0);
      const status = score >= 80 ? 'pass' : 'warning';

      return {
        checkpointId: 'S04',
        status,
        score,
        message: score >= 80 ? 'Strong value proposition' : 'Value proposition needs clarity',
        suggestions: score < 80 ? [
          !hasBenefits ? 'Articulate customer benefits clearly' : '',
          !isQuantified ? 'Consider quantifying value where possible' : ''
        ].filter(Boolean) : undefined
      };
    }
  },
  {
    id: 'S05',
    category: 'strategic',
    name: 'Strategic Priorities',
    description: 'Clear strategic priorities and focus areas',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasKeyMessages = strategy.keyMessages && strategy.keyMessages.length > 0;
      const hasDifferentiators = strategy.differentiators && strategy.differentiators.length > 0;
      const hasBoth = hasKeyMessages && hasDifferentiators;

      if (!hasBoth) {
        return {
          checkpointId: 'S05',
          status: 'warning',
          score: hasKeyMessages || hasDifferentiators ? 50 : 0,
          message: 'Strategic priorities not fully defined',
          suggestions: [
            'Define key strategic priorities',
            'Clarify focus areas for the next 12-24 months',
            'Ensure alignment with positioning and differentiation'
          ]
        };
      }

      return {
        checkpointId: 'S05',
        status: 'pass',
        score: 100,
        message: 'Strategic priorities established through key messages and differentiators'
      };
    }
  }
];

/**
 * CATEGORY 3: Market Intelligence (4 checkpoints)
 */
const marketCheckpoints: QualityCheckpoint[] = [
  {
    id: 'M01',
    category: 'market',
    name: 'Competitor Analysis',
    description: 'Competitive landscape is understood and documented',
    severity: 'high',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      // Check evolution outputs for competitor data
      const hasCompetitorData = context?.evolutionOutputs &&
        JSON.stringify(context.evolutionOutputs).includes('competitor');

      if (!hasCompetitorData) {
        return {
          checkpointId: 'M01',
          status: 'warning',
          score: 0,
          message: 'No competitor analysis found',
          suggestions: [
            'Conduct competitive analysis',
            'Identify 3-5 key competitors',
            'Document their positioning, strengths, weaknesses'
          ]
        };
      }

      return {
        checkpointId: 'M01',
        status: 'pass',
        score: 100,
        message: 'Competitor analysis conducted'
      };
    }
  },
  {
    id: 'M02',
    category: 'market',
    name: 'Market Gaps',
    description: 'Market opportunities and white space identified',
    severity: 'medium',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      const hasWhiteSpace = context?.evolutionOutputs &&
        JSON.stringify(context.evolutionOutputs).toLowerCase().includes('whitespace');

      if (!hasWhiteSpace) {
        return {
          checkpointId: 'M02',
          status: 'warning',
          score: 0,
          message: 'Market gaps not identified',
          suggestions: [
            'Identify underserved market segments',
            'Find white space opportunities',
            'Document unmet customer needs'
          ]
        };
      }

      return {
        checkpointId: 'M02',
        status: 'pass',
        score: 100,
        message: 'Market white space identified'
      };
    }
  },
  {
    id: 'M03',
    category: 'market',
    name: 'Customer Insights',
    description: 'Customer needs, pains, and desires documented',
    severity: 'high',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      const hasCustomerData = context?.evolutionOutputs &&
        (JSON.stringify(context.evolutionOutputs).includes('customer') ||
         JSON.stringify(context.evolutionOutputs).includes('pain') ||
         JSON.stringify(context.evolutionOutputs).includes('desire'));

      if (!hasCustomerData) {
        return {
          checkpointId: 'M03',
          status: 'warning',
          score: 0,
          message: 'Customer insights not documented',
          suggestions: [
            'Document customer pain points',
            'Identify customer desires and aspirations',
            'Capture customer language and terminology'
          ]
        };
      }

      return {
        checkpointId: 'M03',
        status: 'pass',
        score: 100,
        message: 'Customer insights documented'
      };
    }
  },
  {
    id: 'M04',
    category: 'market',
    name: 'Market Trends',
    description: 'Relevant market trends and inflection points identified',
    severity: 'medium',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      const hasTrends = context?.evolutionOutputs &&
        (JSON.stringify(context.evolutionOutputs).includes('trend') ||
         JSON.stringify(context.evolutionOutputs).includes('inflection'));

      if (!hasTrends) {
        return {
          checkpointId: 'M04',
          status: 'warning',
          score: 0,
          message: 'Market trends not analyzed',
          suggestions: [
            'Identify relevant market trends',
            'Document inflection points',
            'Assess impact on brand strategy'
          ]
        };
      }

      return {
        checkpointId: 'M04',
        status: 'pass',
        score: 100,
        message: 'Market trends and inflection points identified'
      };
    }
  }
];

/**
 * CATEGORY 4: Messaging & Voice (4 checkpoints)
 */
const messagingCheckpoints: QualityCheckpoint[] = [
  {
    id: 'V01',
    category: 'messaging',
    name: 'Brand Voice',
    description: 'Brand voice is clearly defined',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasVoice = strategy.voiceAndTone?.voice;
      const isSubstantive = hasVoice && strategy.voiceAndTone!.voice!.length > 50;

      if (!hasVoice) {
        return {
          checkpointId: 'V01',
          status: 'fail',
          score: 0,
          message: 'Brand voice not defined',
          suggestions: [
            'Define how the brand speaks',
            'Describe voice personality and characteristics',
            'Make it distinctive and consistent'
          ]
        };
      }

      return {
        checkpointId: 'V01',
        status: isSubstantive ? 'pass' : 'warning',
        score: isSubstantive ? 100 : 60,
        message: isSubstantive ? 'Brand voice well-defined' : 'Brand voice needs more detail',
        evidence: [strategy.voiceAndTone!.voice!]
      };
    }
  },
  {
    id: 'V02',
    category: 'messaging',
    name: 'Tone Attributes',
    description: 'Specific tone attributes documented',
    severity: 'medium',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasTone = strategy.voiceAndTone?.toneAttributes && strategy.voiceAndTone.toneAttributes.length > 0;
      const hasEnough = hasTone && strategy.voiceAndTone!.toneAttributes!.length >= 3;

      if (!hasTone) {
        return {
          checkpointId: 'V02',
          status: 'fail',
          score: 0,
          message: 'Tone attributes not defined',
          suggestions: [
            'Define 3-5 tone attributes',
            'Examples: Professional yet approachable, confident but humble',
            'Make them actionable for content creators'
          ]
        };
      }

      return {
        checkpointId: 'V02',
        status: hasEnough ? 'pass' : 'warning',
        score: hasEnough ? 100 : 60,
        message: hasEnough
          ? `${strategy.voiceAndTone!.toneAttributes!.length} tone attributes defined`
          : 'Add more tone attributes (aim for 3-5)',
        evidence: strategy.voiceAndTone!.toneAttributes
      };
    }
  },
  {
    id: 'V03',
    category: 'messaging',
    name: 'Key Messages',
    description: '3-5 core brand messages defined',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasMessages = strategy.keyMessages && strategy.keyMessages.length > 0;
      const optimalCount = hasMessages && strategy.keyMessages!.length >= 3 && strategy.keyMessages!.length <= 5;
      const areSubstantive = hasMessages && strategy.keyMessages!.every(m => m.length > 20);

      if (!hasMessages) {
        return {
          checkpointId: 'V03',
          status: 'fail',
          score: 0,
          message: 'Key messages not defined',
          suggestions: [
            'Define 3-5 core brand messages',
            'Make them memorable and repeatable',
            'Ensure they support positioning'
          ]
        };
      }

      const score = 30 + (optimalCount ? 35 : 0) + (areSubstantive ? 35 : 0);
      const status = score >= 80 ? 'pass' : 'warning';

      return {
        checkpointId: 'V03',
        status,
        score,
        message: score >= 80
          ? `Strong set of ${strategy.keyMessages!.length} key messages`
          : 'Key messages need improvement',
        evidence: strategy.keyMessages,
        suggestions: score < 80 ? [
          !optimalCount ? `Adjust message count to 3-5 (currently ${strategy.keyMessages!.length})` : '',
          !areSubstantive ? 'Make messages more substantive and detailed' : ''
        ].filter(Boolean) : undefined
      };
    }
  },
  {
    id: 'V04',
    category: 'messaging',
    name: 'Brand Personality',
    description: 'Brand personality traits defined',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasPersonality = strategy.personality && strategy.personality.length > 0;
      const hasEnough = hasPersonality && strategy.personality!.length >= 3;

      if (!hasPersonality) {
        return {
          checkpointId: 'V04',
          status: 'fail',
          score: 0,
          message: 'Brand personality not defined',
          suggestions: [
            'Define 3-5 personality traits',
            'Think: If the brand were a person, how would they behave?',
            'Make them distinctive and authentic'
          ]
        };
      }

      return {
        checkpointId: 'V04',
        status: hasEnough ? 'pass' : 'warning',
        score: hasEnough ? 100 : 60,
        message: hasEnough
          ? `${strategy.personality!.length} personality traits defined`
          : 'Add more personality traits (aim for 3-5)',
        evidence: strategy.personality
      };
    }
  }
];

/**
 * CATEGORY 5: Implementation Readiness (4 checkpoints)
 */
const implementationCheckpoints: QualityCheckpoint[] = [
  {
    id: 'I01',
    category: 'implementation',
    name: 'Completeness',
    description: 'All core strategy components present',
    severity: 'critical',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const required = [
        { field: 'purpose', label: 'Purpose' },
        { field: 'mission', label: 'Mission' },
        { field: 'vision', label: 'Vision' },
        { field: 'values', label: 'Values' },
        { field: 'positioning', label: 'Positioning' },
        { field: 'voiceAndTone', label: 'Voice & Tone' },
        { field: 'keyMessages', label: 'Key Messages' },
        { field: 'differentiators', label: 'Differentiators' }
      ];

      const missing = required.filter(r => !strategy[r.field as keyof BrandStrategy]);
      const completeness = ((required.length - missing.length) / required.length) * 100;

      if (missing.length === 0) {
        return {
          checkpointId: 'I01',
          status: 'pass',
          score: 100,
          message: 'All core components present'
        };
      }

      return {
        checkpointId: 'I01',
        status: completeness >= 75 ? 'warning' : 'fail',
        score: completeness,
        message: `${missing.length} components missing`,
        details: `Missing: ${missing.map(m => m.label).join(', ')}`,
        suggestions: missing.map(m => `Add ${m.label}`)
      };
    }
  },
  {
    id: 'I02',
    category: 'implementation',
    name: 'Consistency',
    description: 'Strategy elements are internally consistent',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      // Check for contradictions in the strategy
      const allText = JSON.stringify(strategy).toLowerCase();
      const contradictions = [];

      // Look for conflicting positioning signals
      if (allText.includes('premium') && allText.includes('affordable')) {
        contradictions.push('Premium positioning conflicts with affordability claims');
      }
      if (allText.includes('exclusive') && allText.includes('accessible')) {
        contradictions.push('Exclusive positioning conflicts with accessibility claims');
      }

      if (contradictions.length > 0) {
        return {
          checkpointId: 'I02',
          status: 'warning',
          score: 50,
          message: 'Potential contradictions detected',
          details: contradictions.join('; '),
          suggestions: ['Review strategy for internal consistency']
        };
      }

      return {
        checkpointId: 'I02',
        status: 'pass',
        score: 100,
        message: 'No obvious contradictions detected'
      };
    }
  },
  {
    id: 'I03',
    category: 'implementation',
    name: 'Actionability',
    description: 'Strategy provides clear guidance for execution',
    severity: 'high',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const hasKeyMessages = strategy.keyMessages && strategy.keyMessages.length > 0;
      const hasVoiceGuidance = strategy.voiceAndTone?.voice;
      const hasDifferentiators = strategy.differentiators && strategy.differentiators.length > 0;

      const actionableCount = [hasKeyMessages, hasVoiceGuidance, hasDifferentiators].filter(Boolean).length;
      const score = (actionableCount / 3) * 100;

      return {
        checkpointId: 'I03',
        status: score >= 80 ? 'pass' : 'warning',
        score,
        message: score >= 80
          ? 'Strategy provides clear execution guidance'
          : 'Strategy needs more actionable elements',
        suggestions: score < 80 ? [
          !hasKeyMessages ? 'Add key messages for consistent communication' : '',
          !hasVoiceGuidance ? 'Define voice guidelines for content creators' : '',
          !hasDifferentiators ? 'Clarify differentiators for positioning' : ''
        ].filter(Boolean) : undefined
      };
    }
  },
  {
    id: 'I04',
    category: 'implementation',
    name: 'Measurability',
    description: 'Strategy includes measurable elements',
    severity: 'medium',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const allText = JSON.stringify(strategy);
      const hasQuantifiableElements = /\b(\d+%|\d+x|within \d+|by \d{4}|increase|grow|achieve)\b/i.test(allText);

      if (!hasQuantifiableElements) {
        return {
          checkpointId: 'I04',
          status: 'warning',
          score: 0,
          message: 'No measurable elements found',
          suggestions: [
            'Add quantifiable goals where appropriate',
            'Define success metrics',
            'Set timeframes for achievement'
          ]
        };
      }

      return {
        checkpointId: 'I04',
        status: 'pass',
        score: 100,
        message: 'Measurable elements present'
      };
    }
  }
];

/**
 * CATEGORY 6: Data Quality (4 checkpoints)
 */
const dataQualityCheckpoints: QualityCheckpoint[] = [
  {
    id: 'D01',
    category: 'data',
    name: 'Source Quality',
    description: 'Strategy backed by credible sources',
    severity: 'high',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      const hasSources = context?.sources && context.sources.length > 0;
      const hasQualitySources = hasSources && context!.sources!.some(s => s.tier <= 2);

      if (!hasSources) {
        return {
          checkpointId: 'D01',
          status: 'warning',
          score: 0,
          message: 'No sources documented',
          suggestions: [
            'Document sources for key claims',
            'Prioritize tier 1-2 sources (official, industry reports)',
            'Add source citations for credibility'
          ]
        };
      }

      return {
        checkpointId: 'D01',
        status: hasQualitySources ? 'pass' : 'warning',
        score: hasQualitySources ? 100 : 50,
        message: hasQualitySources
          ? `Strategy backed by ${context!.sources!.length} sources`
          : 'Improve source quality (add tier 1-2 sources)',
        evidence: context!.sources!.map(s => s.url)
      };
    }
  },
  {
    id: 'D02',
    category: 'data',
    name: 'Evidence-Based',
    description: 'Claims supported by evidence',
    severity: 'medium',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      const hasEvolutionData = context?.evolutionOutputs;
      const hasAuditData = context?.auditResults;

      if (!hasEvolutionData && !hasAuditData) {
        return {
          checkpointId: 'D02',
          status: 'warning',
          score: 0,
          message: 'Limited evidence base',
          suggestions: [
            'Conduct research to support strategy',
            'Run evolution workshop for insights',
            'Validate assumptions with data'
          ]
        };
      }

      return {
        checkpointId: 'D02',
        status: 'pass',
        score: 100,
        message: 'Strategy supported by research and analysis'
      };
    }
  },
  {
    id: 'D03',
    category: 'data',
    name: 'Specificity',
    description: 'Strategy avoids generic statements',
    severity: 'medium',
    validator: (strategy: BrandStrategy): CheckpointResult => {
      const allText = JSON.stringify(strategy);
      const genericPhrases = [
        'best in class',
        'world class',
        'cutting edge',
        'innovative solutions',
        'customer focused',
        'quality products'
      ];

      const genericCount = genericPhrases.filter(phrase =>
        allText.toLowerCase().includes(phrase)
      ).length;

      if (genericCount > 3) {
        return {
          checkpointId: 'D03',
          status: 'warning',
          score: 50,
          message: `${genericCount} generic phrases detected`,
          details: 'Strategy relies too heavily on generic language',
          suggestions: [
            'Replace generic phrases with specific claims',
            'Add concrete examples and evidence',
            'Make statements more distinctive'
          ]
        };
      }

      return {
        checkpointId: 'D03',
        status: genericCount > 0 ? 'warning' : 'pass',
        score: genericCount > 0 ? 80 : 100,
        message: genericCount > 0
          ? 'Some generic phrases present but acceptable'
          : 'Strategy uses specific, distinctive language'
      };
    }
  },
  {
    id: 'D04',
    category: 'data',
    name: 'Recency',
    description: 'Data and insights are current',
    severity: 'low',
    validator: (_strategy: BrandStrategy, context?: ValidationContext): CheckpointResult => {
      // Check if we have recent data in evolution outputs or audit
      const hasRecentData = context?.evolutionOutputs || context?.auditResults;

      if (!hasRecentData) {
        return {
          checkpointId: 'D04',
          status: 'warning',
          score: 0,
          message: 'Data recency unknown',
          suggestions: [
            'Update strategy with current market data',
            'Re-run evolution workshop if data is >6 months old',
            'Validate assumptions remain accurate'
          ]
        };
      }

      return {
        checkpointId: 'D04',
        status: 'pass',
        score: 100,
        message: 'Strategy based on recent analysis'
      };
    }
  }
];

/**
 * All 26 checkpoints organized by category
 */
export const CHECKPOINT_CATEGORIES: CheckpointCategory[] = [
  {
    id: 'foundation',
    name: 'Brand Foundation',
    description: 'Core brand identity elements',
    weight: 0.25,
    checkpoints: foundationCheckpoints
  },
  {
    id: 'strategic',
    name: 'Strategic Clarity',
    description: 'Strategic positioning and differentiation',
    weight: 0.25,
    checkpoints: strategicCheckpoints
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    description: 'Market understanding and insights',
    weight: 0.15,
    checkpoints: marketCheckpoints
  },
  {
    id: 'messaging',
    name: 'Messaging & Voice',
    description: 'Communication framework',
    weight: 0.20,
    checkpoints: messagingCheckpoints
  },
  {
    id: 'implementation',
    name: 'Implementation Readiness',
    description: 'Execution preparedness',
    weight: 0.10,
    checkpoints: implementationCheckpoints
  },
  {
    id: 'data',
    name: 'Data Quality',
    description: 'Evidence and source quality',
    weight: 0.05,
    checkpoints: dataQualityCheckpoints
  }
];

/**
 * Get all checkpoints (flat list)
 */
export function getAllCheckpoints(): QualityCheckpoint[] {
  return CHECKPOINT_CATEGORIES.flatMap(cat => cat.checkpoints);
}

/**
 * Get checkpoint by ID
 */
export function getCheckpointById(id: string): QualityCheckpoint | undefined {
  return getAllCheckpoints().find(cp => cp.id === id);
}
