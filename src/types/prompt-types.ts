// Prompt Registry Types - Version control for LLM prompts

export type PromptCategory = 'generation' | 'analysis' | 'qa' | 'audit' | 'research' | 'synthesis';

export interface PromptTemplate {
  // Identity
  id: string;                     // "brand-strategy-v1"
  name: string;                   // "Brand Strategy Generation"
  description: string;            // What this prompt does
  category: PromptCategory;
  version: string;                // "1.0.0" (semver)

  // Timestamps
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
  active: boolean;                // Current active version for this ID

  // Prompt content
  systemPrompt: string;           // System-level instructions
  userPromptTemplate: string;     // User prompt with {{placeholders}}

  // LLM configuration
  temperature: number;            // 0.0 for deterministic
  maxTokens: number;              // Token limit
  seed?: number;                  // Random seed for reproducibility

  // Metadata
  tags: string[];                 // ["strategy", "comprehensive"]
  author: string;                 // Creator name
  changelog: string[];            // Version history notes

  // Usage tracking
  usageCount: number;             // Times this prompt was used
  avgConfidence?: number;         // Average confidence of outputs
  lastUsed?: string;              // Last usage timestamp

  // Variables
  variables?: PromptVariable[];   // Required template variables
}

export interface PromptVariable {
  name: string;                   // "brandName"
  description: string;            // What this variable is for
  required: boolean;              // Must be provided?
  default?: string;               // Default value
  example?: string;               // Example value
  type: 'string' | 'number' | 'array' | 'object';
}

export interface PromptVersion {
  promptId: string;               // Base ID without version
  version: string;                // Version number
  timestamp: string;              // When this version was created
  changes: string;                // What changed
  previousVersion?: string;       // Previous version number
  author: string;                 // Who made this version
}

export interface PromptRegistry {
  version: string;                // Registry version
  lastUpdated: string;            // Last registry update
  prompts: Record<string, PromptTemplate>; // All prompts by full ID
  activeVersions: Record<string, string>;  // Base ID -> active version
}

export interface UsageStats {
  promptId: string;
  totalUsages: number;
  averageConfidence: number;
  lastUsed: string;
  usageByDate: Record<string, number>;    // Date -> count
  averageDuration?: number;               // Avg execution time (ms)
}

export interface PromptRenderContext {
  [key: string]: string | number | string[] | Record<string, any>;
}

export interface PromptValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingVariables?: string[];
}
