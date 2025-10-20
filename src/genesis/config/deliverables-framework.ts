/**
 * Generic 64-Deliverable Framework
 *
 * Universal deliverables for ANY brand type (B2C, B2B, SaaS, E-commerce, Luxury, etc.)
 * Uses placeholder: {brandName}
 *
 * FROM: Horizon Brand Builder
 */

import type { BrandConfiguration } from '../../types/brand-types.js';
import type { ProjectTimeline } from '../../types/genesis-types.js';

/**
 * 64 Generic Deliverables across 5 phases
 */
export const GENERIC_DELIVERABLES: Record<string, string[]> = {
  phase1: [
    '{brandName} Brand Audit Report',
    'Competitive Landscape Analysis',
    'Target Audience Research',
    'Market Trends Analysis',
    'Brand Positioning Strategy',
    'Brand Architecture Framework',
    'Value Proposition Development',
    'Competitor Benchmarking',
    'Category Trends Report',
    'Pricing Strategy Analysis',
    'Channel Strategy Report',
    'Brand Gap Analysis',
  ],
  phase2: [
    'Visual Identity System',
    'Brand Naming Guidelines',
    'Logo Design Concepts',
    'Color Palette Strategy',
    'Typography System',
    'Iconography & Graphic Elements',
    'Photography Style Guide',
    'Illustration Guidelines',
    'Packaging Design System',
    'Brand Voice & Tone Guidelines',
    'Messaging Framework',
    'Tagline Development',
    'Brand Story Narrative',
  ],
  phase3: [
    'Customer Journey Map',
    'Touchpoint Audit',
    'Digital Shelf Strategy',
    'E-commerce Experience Guidelines',
    'Retail Experience Blueprint',
    'Quick Commerce Optimization',
    'Social Media Strategy',
    'Content Strategy Framework',
    'Community Building Plan',
    'Influencer Strategy',
    'Partnership Guidelines',
    'Brand Activation Plan',
  ],
  phase4: [
    'Launch Communication Strategy',
    'Channel Activation Plan',
    'Sales Enablement Materials',
    'Trade Marketing Guidelines',
    'Performance Marketing Strategy',
    'CRM & Retention Strategy',
    'Gifting Strategy',
    'B2B Communication Framework',
    'Internal Brand Launch Plan',
    'Brand Training Materials',
    'Brand Governance Guidelines',
  ],
  phase5: [
    'Complete Brand Guidelines Document',
    'Digital Asset Library',
    'Vendor Onboarding Guide',
    'Brand Compliance Checklist',
    'Launch Roadmap',
    'Success Metrics Dashboard',
    'Post-Launch Monitoring Framework',
    'Brand Evolution Roadmap',
    'Future Innovation Pipeline',
  ],
};

/**
 * Project timeline for 5 phases
 */
export const GENERIC_PROJECT_TIMELINE: ProjectTimeline = {
  totalDuration: '16 weeks',
  phases: [
    { phase: 1, name: 'Brand Strategy & Positioning', duration: '3 weeks' },
    { phase: 2, name: 'Brand Expression & Identity', duration: '4 weeks' },
    { phase: 3, name: 'Experience & Digital Strategy', duration: '4 weeks' },
    { phase: 4, name: 'Activation & Growth', duration: '3 weeks' },
    { phase: 5, name: 'Delivery & Implementation', duration: '2 weeks' },
  ],
};

/**
 * Deliverable categories for organization
 */
export const DELIVERABLE_CATEGORIES = {
  strategy: [
    'Brand Positioning Strategy',
    'Brand Architecture Framework',
    'Value Proposition Development',
    'Pricing Strategy Analysis',
    'Channel Strategy Report',
  ],
  research: [
    'Brand Audit Report',
    'Competitive Landscape Analysis',
    'Target Audience Research',
    'Market Trends Analysis',
    'Competitor Benchmarking',
    'Category Trends Report',
    'Brand Gap Analysis',
  ],
  identity: [
    'Visual Identity System',
    'Logo Design Concepts',
    'Color Palette Strategy',
    'Typography System',
    'Iconography & Graphic Elements',
    'Photography Style Guide',
    'Illustration Guidelines',
    'Packaging Design System',
  ],
  verbal: [
    'Brand Naming Guidelines',
    'Brand Voice & Tone Guidelines',
    'Messaging Framework',
    'Tagline Development',
    'Brand Story Narrative',
  ],
  experience: [
    'Customer Journey Map',
    'Touchpoint Audit',
    'Digital Shelf Strategy',
    'E-commerce Experience Guidelines',
    'Retail Experience Blueprint',
    'Quick Commerce Optimization',
  ],
  marketing: [
    'Social Media Strategy',
    'Content Strategy Framework',
    'Community Building Plan',
    'Influencer Strategy',
    'Partnership Guidelines',
    'Brand Activation Plan',
    'Launch Communication Strategy',
    'Channel Activation Plan',
    'Performance Marketing Strategy',
  ],
  operations: [
    'Sales Enablement Materials',
    'Trade Marketing Guidelines',
    'CRM & Retention Strategy',
    'Gifting Strategy',
    'B2B Communication Framework',
    'Internal Brand Launch Plan',
    'Brand Training Materials',
    'Brand Governance Guidelines',
    'Vendor Onboarding Guide',
    'Brand Compliance Checklist',
  ],
  management: [
    'Complete Brand Guidelines Document',
    'Digital Asset Library',
    'Launch Roadmap',
    'Success Metrics Dashboard',
    'Post-Launch Monitoring Framework',
    'Brand Evolution Roadmap',
    'Future Innovation Pipeline',
  ],
};

export type DeliverableStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface DeliverableTrackerEntry {
  status: DeliverableStatus;
  assignee: string | null;
  startDate: string | null;
  completedDate: string | null;
  notes: string;
}

export type DeliverableTracker = Record<string, Record<string, DeliverableTrackerEntry>>;

/**
 * Customizes deliverables by replacing {brandName} placeholder
 */
export function customizeDeliverables(
  brandConfig: BrandConfiguration
): Record<string, string[]> {
  const customized: Record<string, string[]> = {};

  // Replace {brandName} in all deliverables
  Object.entries(GENERIC_DELIVERABLES).forEach(([phase, items]) => {
    customized[phase] = items.map((item) =>
      item.replace(/\{brandName\}/g, brandConfig.brandName)
    );
  });

  // Merge with custom deliverables if provided
  if (brandConfig.customDeliverables) {
    Object.entries(brandConfig.customDeliverables).forEach(([phase, items]) => {
      if (customized[phase]) {
        customized[phase] = [...customized[phase], ...items];
      } else {
        customized[phase] = items;
      }
    });
  }

  return customized;
}

/**
 * Gets deliverables by category
 */
export function getDeliverablesByCategory(category: keyof typeof DELIVERABLE_CATEGORIES): string[] {
  return DELIVERABLE_CATEGORIES[category] || [];
}

/**
 * Gets all deliverables as flat array
 */
export function getAllDeliverables(): string[] {
  const deliverables: string[] = [];
  Object.values(GENERIC_DELIVERABLES).forEach(phase => {
    deliverables.push(...phase);
  });
  return deliverables;
}

/**
 * Counts total deliverables
 */
export function countDeliverables(): number {
  return getAllDeliverables().length;
}

/**
 * Gets deliverables by phase number
 */
export function getDeliverablesByPhase(phaseNumber: number): string[] {
  const phaseKey = `phase${phaseNumber}`;
  return GENERIC_DELIVERABLES[phaseKey] || [];
}

/**
 * Creates deliverable status tracker
 */
export function createDeliverableTracker(deliverables: Record<string, string[]>): DeliverableTracker {
  const tracker: DeliverableTracker = {};

  Object.entries(deliverables).forEach(([phase, items]) => {
    tracker[phase] = {};
    items.forEach(item => {
      tracker[phase]![item] = {
        status: 'pending',
        assignee: null,
        startDate: null,
        completedDate: null,
        notes: '',
      };
    });
  });

  return tracker;
}
