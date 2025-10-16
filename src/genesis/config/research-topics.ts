// Generic 77-subtopic research templates for ANY brand
// Placeholders: {brandName}, {industry}, {category}, {channels}

import type { BrandConfiguration } from '../../types/index.js';

export const GENERIC_RESEARCH_TOPICS = {
  phase1: {
    name: 'Brand Strategy & Positioning',
    topics: [
      {
        id: 'brand-audit',
        name: 'Brand Audit & Current State',
        subtopics: [
          'Current brand assets inventory for {brandName}',
          'Touchpoint analysis across {channels}',
          'Brand perception gaps in {industry}',
          'Operational vs brand maturity assessment',
        ],
      },
      {
        id: 'competitive-landscape',
        name: 'Competitive Landscape Analysis',
        subtopics: [
          'Premium competitors in {industry}',
          'Mass market players in {category}',
          'International brands entering market',
          'Channel dynamics and distribution',
          'D2C and digital-native brands',
        ],
      },
      {
        id: 'target-audience',
        name: 'Target Audience Deep Dive',
        subtopics: [
          'Customer psychographics and motivations',
          'Behavioral patterns and preferences',
          'Decision-making criteria',
          'Channel usage and preferences',
          'Price sensitivity and value perception',
        ],
      },
      {
        id: 'category-trends',
        name: 'Category Trends & Whitespace',
        subtopics: [
          'Category evolution and trends',
          'Emerging consumer needs',
          'Technology disruption impact',
          'Sustainability and ethics trends',
          'Untapped opportunities for {brandName}',
        ],
      },
      {
        id: 'pricing-analysis',
        name: 'Pricing & Value Perception',
        subtopics: [
          'Category price architecture',
          'Premium pricing opportunities',
          'Channel-specific pricing strategies',
          'Value perception drivers',
          'Competitive pricing positioning',
        ],
      },
    ],
  },
  phase2: {
    name: 'Brand Expression & Identity',
    topics: [
      {
        id: 'visual-trends',
        name: 'Visual Identity Trends',
        subtopics: [
          'Category visual aesthetics benchmarking',
          'Color psychology in {category}',
          'Typography trends and best practices',
          'Packaging and design innovation',
          'Global brand visual standards',
        ],
      },
      {
        id: 'packaging-landscape',
        name: 'Packaging & Physical Expression',
        subtopics: [
          'Sustainable packaging innovations',
          'Shelf presence optimization',
          'Premium packaging signals',
          'Unboxing experience benchmarks',
          'Practical and functional requirements',
        ],
      },
      {
        id: 'verbal-identity',
        name: 'Brand Voice & Messaging',
        subtopics: [
          'Tone of voice in {industry}',
          'Storytelling approaches',
          'Message hierarchy frameworks',
          'Cultural relevance and resonance',
          'Luxury vs accessible language',
        ],
      },
      {
        id: 'naming-strategy',
        name: 'Brand Naming & Architecture',
        subtopics: [
          'Naming conventions in {category}',
          'Brand architecture models',
          'Sub-brand naming strategies',
          'Trademark considerations',
        ],
      },
    ],
  },
  phase3: {
    name: 'Experience & Digital Strategy',
    topics: [
      {
        id: 'customer-journey',
        name: 'Customer Journey & Experience',
        subtopics: [
          'End-to-end journey mapping',
          'Touchpoint optimization',
          'Moment of truth identification',
          'Pain point resolution',
          'Delight factor opportunities',
        ],
      },
      {
        id: 'digital-presence',
        name: 'Digital & E-commerce Strategy',
        subtopics: [
          'Digital shelf best practices',
          'E-commerce experience optimization',
          'Mobile-first considerations',
          'Conversion funnel optimization',
          'Digital merchandising strategies',
        ],
      },
      {
        id: 'retail-experience',
        name: 'Retail & Physical Experience',
        subtopics: [
          'In-store experience design',
          'Visual merchandising standards',
          'Staff training and brand ambassadorship',
          'Store atmosphere and ambiance',
          'Point-of-sale optimization',
        ],
      },
      {
        id: 'social-media',
        name: 'Social Media & Community',
        subtopics: [
          'Platform strategy and selection',
          'Content strategy frameworks',
          'Community building approaches',
          'Influencer and creator partnerships',
          'Social commerce integration',
        ],
      },
      {
        id: 'content-strategy',
        name: 'Content & Storytelling',
        subtopics: [
          'Content pillars and themes',
          'Editorial calendar planning',
          'Multi-format content strategy',
          'User-generated content integration',
          'Thought leadership positioning',
        ],
      },
    ],
  },
  phase4: {
    name: 'Activation & Growth',
    topics: [
      {
        id: 'launch-strategy',
        name: 'Launch & Activation Planning',
        subtopics: [
          'Launch sequence and timing',
          'Channel activation strategies',
          'Partnership and collaboration opportunities',
          'PR and media strategy',
          'Event and experiential activation',
        ],
      },
      {
        id: 'performance-marketing',
        name: 'Performance Marketing & Growth',
        subtopics: [
          'Acquisition channel strategy',
          'Paid media optimization',
          'SEO and organic growth',
          'Conversion rate optimization',
          'Attribution and measurement',
        ],
      },
      {
        id: 'retention-loyalty',
        name: 'Retention & Loyalty Programs',
        subtopics: [
          'CRM strategy and segmentation',
          'Loyalty program design',
          'Retention marketing tactics',
          'Personalization approaches',
          'Lifetime value optimization',
        ],
      },
      {
        id: 'partnerships',
        name: 'Partnerships & Collaborations',
        subtopics: [
          'Strategic partnership opportunities',
          'Co-branding and collaboration models',
          'Distribution partnerships',
          'Technology and platform partnerships',
        ],
      },
      {
        id: 'innovation',
        name: 'Innovation & Future Growth',
        subtopics: [
          'Product innovation pipeline',
          'Market expansion opportunities',
          'Category extension potential',
          'Technology and digital innovation',
          'Sustainability and impact initiatives',
        ],
      },
    ],
  },
};

/**
 * Customizes research topics by replacing placeholders with actual brand values
 */
export function customizeResearchTopics(
  brandConfig: BrandConfiguration
): typeof GENERIC_RESEARCH_TOPICS {
  const serialized = JSON.stringify(GENERIC_RESEARCH_TOPICS);

  // Replace placeholders
  let customized = serialized
    .replace(/\{brandName\}/g, brandConfig.brandName)
    .replace(/\{industry\}/g, brandConfig.industry)
    .replace(/\{category\}/g, brandConfig.category)
    .replace(/\{channels\}/g, brandConfig.companyProfile?.channels.join(', ') || 'all channels');

  // Apply custom research topics if provided
  let result = JSON.parse(customized);

  if (brandConfig.customResearchTopics) {
    result = { ...result, ...brandConfig.customResearchTopics };
  }

  return result;
}
