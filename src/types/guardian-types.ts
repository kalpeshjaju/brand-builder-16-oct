export interface SourceTierCount {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
}

export interface SourceQualityOutput {
  brandName: string;
  generatedAt: string;
  totalSources: number;
  tiers: SourceTierCount;
  tier12Ratio: number; // 0-1
  samples: Array<{ url: string; tier: 1|2|3|4 }>; // up to N examples
}

export interface RecencyItem {
  source: string;
  year?: number; // parsed year if any
  isRecent?: boolean;
}

export interface RecencyOutput {
  brandName: string;
  generatedAt: string;
  items: RecencyItem[];
  recentRatio: number; // 0-1
  thresholdYear: number; // e.g., last 3 years
}

export interface ReadinessOutput {
  brandName: string;
  generatedAt: string;
  sections: Array<{ name: string; present: boolean; details?: string }>; // e.g., positioning, messaging
  ready: boolean;
}

