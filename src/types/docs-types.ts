export interface NarrativeSection {
  id: string; // e.g., act1-origin
  title: string;
  content: string; // markdown-compatible
}

export interface NarrativePackage {
  brandName: string;
  generatedAt: string;
  toc: Array<{ id: string; title: string }>;
  sections: NarrativeSection[];
}

export interface TeardownSWOT {
  brandName: string;
  generatedAt: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  score: number; // 0-10 overall
  summary: string;
}

export interface ProductCatalogItem {
  sku: string;
  name: string;
  category: string;
  specs: Record<string, string>;
  nutrition?: Record<string, string>;
  priceRange?: string;
}

export interface ProductCatalog {
  brandName: string;
  generatedAt: string;
  items: ProductCatalogItem[];
}

export interface PricingEntry {
  category: string;
  product: string;
  sizes: Array<{ size: string; mrp: number; currency: string }>;
}

export interface PricingGuide {
  brandName: string;
  generatedAt: string;
  entries: PricingEntry[];
  notes?: string[];
}

export interface CorporateCatalogEntry {
  name: string;
  price: string;
  description: string;
  useCases: string[];
}

export interface CorporateCatalog {
  brandName: string;
  generatedAt: string;
  entries: CorporateCatalogEntry[];
}

export interface TrainingTopic {
  topic: string;
  points: string[];
}

export interface TrainingGuide {
  brandName: string;
  generatedAt: string;
  topics: TrainingTopic[];
}

export interface AssetMapItem {
  type: 'visual' | 'digital' | 'service' | 'packaging' | 'other';
  name: string;
  location?: string;
  status?: 'present' | 'missing' | 'outdated';
}

export interface AssetMap {
  brandName: string;
  generatedAt: string;
  items: AssetMapItem[];
}
