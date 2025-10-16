// Core 20 deliverables framework (streamlined from 64 for efficiency)

import type { BrandConfiguration } from '../../types/index.js';

export const CORE_DELIVERABLES = {
  phase1: {
    name: 'Discovery & Research',
    deliverables: [
      'Brand Audit Report',
      'Competitive Analysis',
      'Target Audience Personas',
      'Market Research Summary',
    ],
  },
  phase2: {
    name: 'Strategy & Positioning',
    deliverables: [
      'Brand Positioning Statement',
      'Value Proposition Framework',
      'Messaging Architecture',
      'Brand Story & Narrative',
    ],
  },
  phase3: {
    name: 'Creative Development',
    deliverables: [
      'Visual Identity Guidelines',
      'Brand Voice & Tone Guide',
      'Content Strategy Framework',
      'Social Media Guidelines',
    ],
  },
  phase4: {
    name: 'Implementation',
    deliverables: [
      'Launch Strategy & Timeline',
      'Channel Activation Plan',
      'Marketing Campaign Brief',
      'Performance Metrics Dashboard',
    ],
  },
  phase5: {
    name: 'Optimization & Growth',
    deliverables: [
      'Performance Analytics Report',
      'Customer Feedback Analysis',
      'Growth Roadmap',
      'Brand Health Scorecard',
    ],
  },
};

/**
 * Customize deliverables with brand-specific names
 */
export function customizeDeliverables(
  brandConfig: BrandConfiguration
): typeof CORE_DELIVERABLES {
  const serialized = JSON.stringify(CORE_DELIVERABLES);

  let customized = serialized
    .replace(/Brand/g, brandConfig.brandName);

  let result = JSON.parse(customized);

  // Merge custom deliverables if provided
  if (brandConfig.customDeliverables) {
    Object.keys(brandConfig.customDeliverables).forEach((phase) => {
      if (result[phase]) {
        const customDels = brandConfig.customDeliverables?.[phase] || [];
        result[phase].deliverables.push(...customDels);
      }
    });
  }

  return result;
}

/**
 * Get all deliverables as flat list
 */
export function getAllDeliverables(): string[] {
  return Object.values(CORE_DELIVERABLES).flatMap(
    (phase) => phase.deliverables
  );
}

/**
 * Get deliverables by phase
 */
export function getDeliverablesByPhase(phaseId: string): string[] {
  const phase = CORE_DELIVERABLES[phaseId as keyof typeof CORE_DELIVERABLES];
  return phase ? phase.deliverables : [];
}
