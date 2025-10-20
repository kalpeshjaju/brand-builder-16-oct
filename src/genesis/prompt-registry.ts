// Prompt Registry - Version control for LLM prompts

import type {
  PromptTemplate,
  PromptVersion,
  PromptRegistry as PromptRegistryData,
  PromptRenderContext,
  PromptValidationResult,
  UsageStats,
  PromptCategory
} from '../types/prompt-types.js';
import { FileSystemUtils, Logger } from '../utils/index.js';
import { z } from 'zod';

const logger = new Logger('PromptRegistry');

const promptCategorySchema = z.enum(['generation', 'analysis', 'qa', 'audit', 'research', 'synthesis']);

const promptVariableSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  required: z.boolean(),
  default: z.string().optional(),
  example: z.string().optional(),
  type: z.enum(['string', 'number', 'array', 'object']),
});

const promptTemplateInputSchema = z.object({
  id: z.string().trim().min(1).regex(/^[a-z0-9][a-z0-9._:-]*$/i, 'Invalid prompt id'),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: promptCategorySchema,
  version: z.string().trim().min(1).regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\w.-]+)?$/, 'Version must follow semver'),
  systemPrompt: z.string().min(1),
  userPromptTemplate: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
  seed: z.number().int().nonnegative().optional(),
  tags: z.array(z.string().trim()).optional().default([]),
  author: z.string().trim().min(1),
  changelog: z.array(z.string().trim()).optional().default([]),
  variables: z.array(promptVariableSchema).optional(),
  active: z.boolean().optional().default(false),
}).strict();

export class PromptRegistry {
  private registryPath: string;
  private versionsPath: string;
  private cache: Map<string, PromptTemplate> = new Map();
  private registry: PromptRegistryData | null = null;

  constructor() {
    this.registryPath = FileSystemUtils.resolvePath('.brandos/prompts/registry.json');
    this.versionsPath = FileSystemUtils.resolvePath('.brandos/prompts/versions');
  }

  private validateTemplateInput(
    template: Omit<PromptTemplate, 'createdAt' | 'updatedAt' | 'usageCount'>
  ) {
    return promptTemplateInputSchema.parse({
      ...template,
      tags: template.tags ?? [],
      changelog: template.changelog ?? [],
      active: false,
    });
  }

  /**
   * Initialize registry (load from disk or create new)
   */
  async initialize(): Promise<void> {
    logger.info('Initializing prompt registry');

    // Ensure directories exist
    await FileSystemUtils.ensureDir(FileSystemUtils.resolvePath('.brandos/prompts'));
    await FileSystemUtils.ensureDir(this.versionsPath);

    // Load or create registry
    if (await FileSystemUtils.fileExists(this.registryPath)) {
      this.registry = await FileSystemUtils.readJSON<PromptRegistryData>(this.registryPath);
      logger.info('Registry loaded', { promptCount: Object.keys(this.registry!.prompts).length });
    } else {
      this.registry = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        prompts: {},
        activeVersions: {}
      };
      await this.save();
      logger.info('New registry created');
    }

    // Populate cache
    for (const [id, prompt] of Object.entries(this.registry.prompts)) {
      this.cache.set(id, prompt);
    }
  }

  /**
   * Register a new prompt or update existing
   */
  async registerPrompt(template: Omit<PromptTemplate, 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<void> {
    if (!this.registry) await this.initialize();

    const validated = this.validateTemplateInput(template);

    const fullId = this.generateFullId(validated.id, validated.version);
    const baseId = validated.id;

    // Check if prompt with this full ID already exists
    if (this.registry!.prompts[fullId]) {
      throw new Error(`Prompt ${fullId} already exists. Use updatePrompt() to modify.`);
    }

    // Create full template
    const now = new Date().toISOString();
    const fullTemplate: PromptTemplate = {
      ...validated,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      active: false // Will be set if made active
    };

    // Add to registry
    this.registry!.prompts[fullId] = fullTemplate;
    this.cache.set(fullId, fullTemplate);

    // Save version file
    await this.saveVersion(fullTemplate);

    // If this is the first version, make it active
    if (!this.registry!.activeVersions[baseId]) {
      await this.setActive(baseId, template.version);
    }

    await this.save();

    logger.info('Prompt registered', { id: fullId, version: template.version });
  }

  /**
   * Get a prompt by ID (optionally specific version)
   */
  async getPrompt(id: string, version?: string): Promise<PromptTemplate> {
    if (!this.registry) await this.initialize();

    const fullId = version ? this.generateFullId(id, version) : this.getActiveFullId(id);
    const prompt = this.cache.get(fullId);

    if (!prompt) {
      throw new Error(`Prompt not found: ${fullId}`);
    }

    return prompt;
  }

  /**
   * Get the active version of a prompt
   */
  async getActivePrompt(idOrCategory: string): Promise<PromptTemplate> {
    if (!this.registry) await this.initialize();

    // If it's a category, find the first active prompt in that category
    const prompts = await this.listPrompts(idOrCategory as PromptCategory);
    if (prompts.length > 0 && prompts[0]) {
      return prompts[0];
    }

    // Otherwise treat as ID
    return this.getPrompt(idOrCategory);
  }

  /**
   * Update an existing prompt (creates new version)
   */
  async updatePrompt(
    id: string,
    updates: Partial<Omit<PromptTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>>
  ): Promise<string> {
    if (!this.registry) await this.initialize();

    // Get current active version
    const currentPrompt = await this.getPrompt(id);

    // Generate new version number
    const newVersion = this.incrementVersion(currentPrompt.version);

    const changelog = updates.changelog
      ? [...currentPrompt.changelog, ...updates.changelog]
      : [...currentPrompt.changelog, `Updated to ${newVersion}`];

    const templateInput: Omit<PromptTemplate, 'createdAt' | 'updatedAt' | 'usageCount'> = {
      id: currentPrompt.id,
      name: updates.name ?? currentPrompt.name,
      description: updates.description ?? currentPrompt.description,
      category: updates.category ?? currentPrompt.category,
      version: newVersion,
      systemPrompt: updates.systemPrompt ?? currentPrompt.systemPrompt,
      userPromptTemplate: updates.userPromptTemplate ?? currentPrompt.userPromptTemplate,
      temperature: updates.temperature ?? currentPrompt.temperature,
      maxTokens: updates.maxTokens ?? currentPrompt.maxTokens,
      seed: updates.seed ?? currentPrompt.seed,
      tags: updates.tags ?? currentPrompt.tags,
      author: updates.author ?? currentPrompt.author,
      changelog,
      variables: updates.variables ?? currentPrompt.variables,
      active: false,
    };

    // Register the new version
    await this.registerPrompt(templateInput);

    logger.info('Prompt updated', { id, oldVersion: currentPrompt.version, newVersion });

    return newVersion;
  }

  /**
   * Create a new version of a prompt with explicit changes
   */
  async createVersion(id: string, changes: string, author: string): Promise<string> {
    if (!this.registry) await this.initialize();

    // Update prompt with new version (updatePrompt automatically increments version)
    return this.updatePrompt(id, {
      changelog: [changes],
      author
    });
  }

  /**
   * Set a specific version as active
   */
  async setActive(id: string, version: string): Promise<void> {
    if (!this.registry) await this.initialize();

    const fullId = this.generateFullId(id, version);
    const prompt = this.cache.get(fullId);

    if (!prompt) {
      throw new Error(`Prompt not found: ${fullId}`);
    }

    // Deactivate current active version
    const currentActiveVersion = this.registry!.activeVersions[id];
    if (currentActiveVersion) {
      const currentActiveFullId = this.generateFullId(id, currentActiveVersion);
      const currentActivePrompt = this.cache.get(currentActiveFullId);
      if (currentActivePrompt) {
        currentActivePrompt.active = false;
      }
    }

    // Activate new version
    prompt.active = true;
    this.registry!.activeVersions[id] = version;

    await this.save();

    logger.info('Active version changed', { id, version });
  }

  /**
   * List all prompts (optionally filter by category)
   */
  async listPrompts(category?: PromptCategory): Promise<PromptTemplate[]> {
    if (!this.registry) await this.initialize();

    let prompts = Array.from(this.cache.values());

    if (category) {
      prompts = prompts.filter(p => p.category === category);
    }

    // Only return active versions
    prompts = prompts.filter(p => p.active);

    return prompts.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get version history for a prompt
   */
  async getVersionHistory(id: string): Promise<PromptVersion[]> {
    if (!this.registry) await this.initialize();

    const historyPath = `${this.versionsPath}/${id}/history.json`;

    if (await FileSystemUtils.fileExists(historyPath)) {
      return FileSystemUtils.readJSON<PromptVersion[]>(historyPath);
    }

    return [];
  }

  /**
   * Rollback to a previous version
   */
  async rollback(id: string, toVersion: string): Promise<void> {
    if (!this.registry) await this.initialize();

    const fullId = this.generateFullId(id, toVersion);
    const prompt = this.cache.get(fullId);

    if (!prompt) {
      throw new Error(`Version not found: ${fullId}`);
    }

    await this.setActive(id, toVersion);

    logger.info('Rolled back to version', { id, version: toVersion });
  }

  /**
   * Render a prompt template with variables
   */
  renderPrompt(template: string, context: PromptRenderContext): string {
    let rendered = template;

    // Replace {{variable}} with context values
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      const replacement = Array.isArray(value) ? value.join(', ') :
                         typeof value === 'object' ? JSON.stringify(value) :
                         String(value);

      rendered = rendered.replace(new RegExp(placeholder, 'g'), replacement);
    }

    // Check for unresolved placeholders
    const unresolvedMatches = rendered.match(/\{\{[^}]+\}\}/g);
    if (unresolvedMatches) {
      logger.warn('Unresolved placeholders in prompt', { placeholders: unresolvedMatches });
    }

    return rendered;
  }

  /**
   * Validate a prompt template
   */
  validatePrompt(prompt: PromptTemplate, context?: PromptRenderContext): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingVariables: string[] = [];

    // Check required fields
    if (!prompt.id) errors.push('Prompt ID is required');
    if (!prompt.name) errors.push('Prompt name is required');
    if (!prompt.systemPrompt && !prompt.userPromptTemplate) {
      errors.push('Either systemPrompt or userPromptTemplate is required');
    }

    // Check version format (semver)
    if (!/^\d+\.\d+\.\d+$/.test(prompt.version)) {
      errors.push('Version must be in semver format (e.g., 1.0.0)');
    }

    // Check temperature range
    if (prompt.temperature < 0 || prompt.temperature > 1) {
      errors.push('Temperature must be between 0 and 1');
    }

    // Check for required variables if context provided
    if (context && prompt.variables) {
      for (const variable of prompt.variables) {
        if (variable.required && !(variable.name in context)) {
          missingVariables.push(variable.name);
        }
      }
    }

    // Extract variables from template
    const templateVars = this.extractVariables(prompt.userPromptTemplate);
    if (templateVars.length > 0 && !prompt.variables) {
      warnings.push(`Template has ${templateVars.length} variables but none declared`);
    }

    return {
      valid: errors.length === 0 && missingVariables.length === 0,
      errors,
      warnings,
      missingVariables: missingVariables.length > 0 ? missingVariables : undefined
    };
  }

  /**
   * Track usage of a prompt
   */
  async trackUsage(id: string, version?: string, confidence?: number): Promise<void> {
    if (!this.registry) await this.initialize();

    const fullId = version ? this.generateFullId(id, version) : this.getActiveFullId(id);
    const prompt = this.cache.get(fullId);

    if (!prompt) return;

    prompt.usageCount++;
    prompt.lastUsed = new Date().toISOString();

    if (confidence !== undefined) {
      // Update average confidence
      const currentAvg = prompt.avgConfidence || 0;
      const count = prompt.usageCount;
      prompt.avgConfidence = ((currentAvg * (count - 1)) + confidence) / count;
    }

    await this.save();
  }

  /**
   * Get usage statistics for a prompt
   */
  async getUsageStats(id: string): Promise<UsageStats> {
    if (!this.registry) await this.initialize();

    const prompt = await this.getPrompt(id);

    return {
      promptId: id,
      totalUsages: prompt.usageCount,
      averageConfidence: prompt.avgConfidence || 0,
      lastUsed: prompt.lastUsed || 'Never',
      usageByDate: {} // TODO: Implement if needed
    };
  }

  /**
   * Delete a prompt version (careful!)
   */
  async deleteVersion(id: string, version: string): Promise<void> {
    if (!this.registry) await this.initialize();

    const fullId = this.generateFullId(id, version);

    // Don't allow deleting active version
    if (this.registry!.activeVersions[id] === version) {
      throw new Error('Cannot delete active version. Set a different version as active first.');
    }

    delete this.registry!.prompts[fullId];
    this.cache.delete(fullId);

    await this.save();

    logger.info('Prompt version deleted', { id, version });
  }

  // Private helper methods

  private generateFullId(id: string, version: string): string {
    return `${id}-v${version}`;
  }

  private getActiveFullId(id: string): string {
    if (!this.registry) throw new Error('Registry not initialized');

    const activeVersion = this.registry.activeVersions[id];
    if (!activeVersion) {
      throw new Error(`No active version for prompt: ${id}`);
    }

    return this.generateFullId(id, activeVersion);
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major || 0}.${minor || 0}.${(patch || 0) + 1}`;
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    return matches.map(m => m.replace(/\{\{|\}\}/g, '').trim());
  }

  private async save(): Promise<void> {
    if (!this.registry) return;

    this.registry.lastUpdated = new Date().toISOString();
    await FileSystemUtils.writeJSON(this.registryPath, this.registry);
  }

  private async saveVersion(prompt: PromptTemplate): Promise<void> {
    const versionDir = `${this.versionsPath}/${prompt.id}`;
    await FileSystemUtils.ensureDir(versionDir);

    const versionFile = `${versionDir}/v${prompt.version}.json`;
    await FileSystemUtils.writeJSON(versionFile, prompt);
  }
}
