// LLM Service - Anthropic Claude integration

import { createHash, randomUUID } from 'crypto';
import type { LLMConfig, LLMMetadata } from '../types/index.js';
import type { PromptRenderContext } from '../types/prompt-types.js';
import { Logger } from '../utils/index.js';
import { ClaudeLLMService } from '../services/llm-service.js';
import { PromptRegistry } from './prompt-registry.js';

const logger = new Logger('LLMService');

export interface LLMResponse {
  content: string;
  metadata: LLMMetadata;
}

export class LLMService {
  private llmClient: ClaudeLLMService | null = null;
  private config: LLMConfig;
  private promptRegistry: PromptRegistry;
  private offline: boolean;

  constructor(config?: Partial<LLMConfig>) {
    this.offline = (process.env['BRANDOS_OFFLINE'] || '').toLowerCase() === 'true' ||
      process.env['BRANDOS_OFFLINE'] === '1';

    const model = config?.model || process.env['DEFAULT_MODEL'] || 'claude-sonnet-4-5-20250929';
    const temperature = config?.temperature ?? parseFloat(process.env['LLM_TEMPERATURE'] || '0.0');
    const maxTokens = config?.maxTokens ?? parseInt(process.env['LLM_MAX_TOKENS'] || '8000');

    this.config = {
      provider: 'anthropic',
      model,
      temperature,
      maxTokens,
      seed: config?.seed,
      ...config,
    };

    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!this.offline) {
      if (!apiKey) {
        throw new Error(
          'ANTHROPIC_API_KEY is not set in environment variables.\n' +
          'Fix: Set ANTHROPIC_API_KEY in your .env file or environment.\n' +
          'Alternatively, set BRANDOS_OFFLINE=true to run with local stubs.'
        );
      }
      this.llmClient = new ClaudeLLMService({
        apiKey,
        model,
        temperature,
        maxTokens,
      });
    }

    this.promptRegistry = new PromptRegistry();

    logger.info('LLM Service initialized', { model: this.offline ? 'offline-local' : this.config.model });
  }

  /**
   * Generate metadata for LLM call (for audit trail)
   */
  private generateMetadata(
    promptText: string,
    config: Partial<LLMConfig>,
    promptId?: string
  ): LLMMetadata {
    const promptHash = createHash('sha256').update(promptText).digest('hex');

    return {
      model: config.model || this.config.model,
      modelVersion: config.model || this.config.model,
      promptId,
      promptTextHash: promptHash,
      temperature: config.temperature ?? this.config.temperature,
      seed: config.seed ?? this.config.seed,
      runId: randomUUID(),
      timestamp: new Date().toISOString(),
      provider: 'anthropic',
    };
  }

  /**
   * Send a prompt and get a response with metadata (with retry logic)
   */
  async promptWithMetadata(
    userMessage: string,
    systemPrompt?: string,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    if (this.offline) {
      const offlineText = this.buildOfflineResponse(userMessage, systemPrompt);
      return {
        content: offlineText,
        metadata: {
          model: 'offline-local',
          modelVersion: 'offline-local',
          promptId: undefined,
          promptTextHash: createHash('sha256').update(userMessage + (systemPrompt || '')).digest('hex'),
          temperature: 0,
          seed: 42,
          runId: randomUUID(),
          timestamp: new Date().toISOString(),
          provider: 'anthropic',
        },
      };
    }
    const startTime = Date.now();
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userMessage}` : userMessage;
    const metadata = this.generateMetadata(fullPrompt, options || {});

    if (!this.llmClient) {
      throw new Error('LLM client not initialized');
    }

    try {
      const response = await this.llmClient.prompt(userMessage, {
        model: options?.model || this.config.model,
        maxTokens: options?.maxTokens || this.config.maxTokens,
        temperature: options?.temperature ?? this.config.temperature,
        systemPrompt,
      });

      const duration = Date.now() - startTime;
      logger.debug('LLM response received', {
        duration: `${duration}ms`,
        runId: metadata.runId,
      });

      return { content: response.content, metadata };
    } catch (error) {
      logger.error('LLM request failed', { runId: metadata.runId, error });
      throw new Error(
        `Failed to get LLM response\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check your API key, network connection, and API quota.`
      );
    }
  }

  /**
   * Send a prompt and get a response (with retry logic)
   */
  async prompt(
    userMessage: string,
    systemPrompt?: string,
    options?: Partial<LLMConfig>
  ): Promise<string> {
    const response = await this.promptWithMetadata(userMessage, systemPrompt, options);
    return response.content;
  }

  /**
   * Send a structured prompt with examples
   */
  async structuredPrompt(params: {
    task: string;
    context: string;
    examples?: string[];
    format?: string;
    constraints?: string[];
  }): Promise<string> {
    const { task, context, examples, format, constraints } = params;

    let prompt = `Task: ${task}\n\nContext:\n${context}`;

    if (examples && examples.length > 0) {
      prompt += `\n\nExamples:\n${examples.join('\n\n')}`;
    }

    if (format) {
      prompt += `\n\nOutput Format:\n${format}`;
    }

    if (constraints && constraints.length > 0) {
      prompt += `\n\nConstraints:\n${constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    }

    return this.prompt(prompt);
  }

  /**
   * Deterministic prompt (temperature = 0, fixed seed)
   */
  async deterministicPrompt(
    userMessage: string,
    systemPrompt?: string
  ): Promise<string> {
    return this.prompt(userMessage, systemPrompt, {
      temperature: 0,
      seed: 42,
    });
  }

  /**
   * Use a registered prompt template
   */
  async promptFromRegistry(
    promptId: string,
    context: PromptRenderContext,
    options?: { version?: string; confidence?: number }
  ): Promise<LLMResponse> {
    // Initialize registry if needed
    await this.promptRegistry.initialize();

    // Get the prompt template
    const template = await this.promptRegistry.getPrompt(promptId, options?.version);

    // Validate that all required variables are provided
    const validation = this.promptRegistry.validatePrompt(template, context);
    if (!validation.valid) {
      const errors = [
        ...validation.errors,
        ...(validation.missingVariables || []).map(v => `Missing required variable: ${v}`)
      ];
      throw new Error(
        `Cannot use prompt template "${template.name}":\n` +
        errors.map(e => `  • ${e}`).join('\n') +
        `\nFix: Provide all required variables in the context.`
      );
    }

    // Render the user prompt with context
    const userPrompt = this.promptRegistry.renderPrompt(template.userPromptTemplate, context);

    // Use template configuration (or override with options)
    const llmOptions: Partial<LLMConfig> = {
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      seed: template.seed,
    };

    // Call LLM with rendered prompt
    const fullPrompt = `${template.systemPrompt}\n\n${userPrompt}`;
    const metadata = this.generateMetadata(fullPrompt, llmOptions, template.id);

    try {
      if (this.offline) {
        // Minimal deterministic stub for offline mode
        const content = this.buildOfflineRegistryResponse(template.id, context);
        await this.promptRegistry.trackUsage(promptId, options?.version, options?.confidence);
        return {
          content,
          metadata: {
            model: 'offline-local',
            modelVersion: 'offline-local',
            promptId: template.id,
            promptTextHash: createHash('sha256').update(userPrompt).digest('hex'),
            temperature: 0,
            seed: 42,
            runId: randomUUID(),
            timestamp: new Date().toISOString(),
            provider: 'anthropic',
          },
        };
      }
      if (!this.llmClient) {
        throw new Error('LLM client not initialized');
      }

      const response = await this.llmClient.prompt(userPrompt, {
        systemPrompt: template.systemPrompt,
        model: this.config.model,
        maxTokens: llmOptions.maxTokens || this.config.maxTokens,
        temperature: llmOptions.temperature ?? this.config.temperature,
      });

      const content = response.content;

      // Track usage in registry
      await this.promptRegistry.trackUsage(promptId, options?.version, options?.confidence);

      logger.info('Prompt from registry executed', {
        promptId,
        version: template.version,
        runId: metadata.runId
      });

      return { content, metadata };

    } catch (error) {
      logger.error('Prompt from registry failed', { promptId, runId: metadata.runId, error });
      throw new Error(
        `Failed to execute prompt "${template.name}"\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check your API key and network connection.`
      );
    }
  }

  /**
   * Offline response builder for freeform prompts
   */
  private buildOfflineResponse(userMessage: string, _systemPrompt?: string): string {
    const header = 'OFFLINE MODE: This is a deterministic local stub.\n';
    const preview = (userMessage || '').slice(0, 240);
    return `${header}${preview}`;
  }

  /**
   * Offline response builder for prompt registry calls
   * Provides structured JSON for known prompts used by the CLI.
   */
  private buildOfflineRegistryResponse(promptId: string, context: PromptRenderContext): string {
    if (promptId === 'brand-strategy-gen') {
      const brand = (context as any)?.brandName || 'Unknown Brand';
      const industry = (context as any)?.industry || 'general';
      const strategy = {
        brandStrategy: {
          brandName: brand,
          purpose: `Make a positive impact in ${industry}.`,
          mission: `Help ${brand} customers succeed through simplicity and speed.`,
          vision: `${brand} becomes the most loved ${industry} brand for creators.`,
          values: ['Simplicity', 'Trust', 'Speed'],
          positioning: `${brand} is the fastest way to create and share.`,
          personality: ['Helpful', 'Confident', 'Friendly'],
          voiceAndTone: { voice: 'Clear and direct', toneAttributes: ['Warm', 'Practical'] },
          keyMessages: [
            `${brand} saves you time so you can focus on work that matters.`,
            `${brand} gives you professional results with minimal effort.`,
            `${brand} grows with your needs.`
          ],
          differentiators: ['Exceptional speed', 'Thoughtful defaults', 'Integrated workflows'],
          proofPoints: ['Used by teams worldwide', 'Consistent uptime', 'Strong security practices']
        }
      };
      return JSON.stringify(strategy, null, 2);
    }

    return JSON.stringify({
      message: 'offline-stub',
      promptId,
      contextPreview: String(context).slice(0, 120)
    });
  }

  /**
   * Get the prompt registry instance
   */
  getPromptRegistry(): PromptRegistry {
    return this.promptRegistry;
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
