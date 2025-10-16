// LLM Service - Anthropic Claude integration

import Anthropic from '@anthropic-ai/sdk';
import { createHash, randomUUID } from 'crypto';
import type { LLMConfig, LLMMetadata } from '../types/index.js';
import { Logger } from '../utils/index.js';

const logger = new Logger('LLMService');

export interface LLMResponse {
  content: string;
  metadata: LLMMetadata;
}

export class LLMService {
  private client: Anthropic;
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set in environment variables.\n' +
        'Fix: Set ANTHROPIC_API_KEY in your .env file or environment.'
      );
    }

    this.client = new Anthropic({ apiKey });
    this.config = {
      provider: 'anthropic',
      model: process.env['DEFAULT_MODEL'] || 'claude-sonnet-4-5-20250929',
      temperature: config?.temperature ?? parseFloat(process.env['LLM_TEMPERATURE'] || '0.0'),
      maxTokens: config?.maxTokens ?? parseInt(process.env['LLM_MAX_TOKENS'] || '8000'),
      seed: config?.seed,
      ...config,
    };

    logger.info('LLM Service initialized', { model: this.config.model });
  }

  /**
   * Generate metadata for LLM call (for audit trail)
   */
  private generateMetadata(
    promptText: string,
    config: Partial<LLMConfig>
  ): LLMMetadata {
    const promptHash = createHash('sha256').update(promptText).digest('hex');

    return {
      model: config.model || this.config.model,
      modelVersion: config.model || this.config.model,
      promptTextHash: promptHash,
      temperature: config.temperature ?? this.config.temperature,
      seed: config.seed ?? this.config.seed,
      runId: randomUUID(),
      timestamp: new Date().toISOString(),
      provider: 'anthropic',
    };
  }

  /**
   * Send a prompt and get a response with metadata
   */
  async promptWithMetadata(
    userMessage: string,
    systemPrompt?: string,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userMessage}` : userMessage;
    const metadata = this.generateMetadata(fullPrompt, options || {});

    try {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: userMessage },
      ];

      const response = await this.client.messages.create({
        model: options?.model || this.config.model,
        max_tokens: options?.maxTokens || this.config.maxTokens,
        temperature: options?.temperature ?? this.config.temperature,
        system: systemPrompt,
        messages,
      });

      const duration = Date.now() - startTime;
      logger.debug('LLM response received', {
        duration: `${duration}ms`,
        runId: metadata.runId
      });

      const content = response.content[0];
      if (content?.type === 'text') {
        return { content: content.text, metadata };
      }

      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      logger.error('LLM request failed', { runId: metadata.runId, error });
      throw new Error(
        `Failed to get LLM response\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check your API key and network connection.`
      );
    }
  }

  /**
   * Send a prompt and get a response (legacy, returns string only)
   */
  async prompt(
    userMessage: string,
    systemPrompt?: string,
    options?: Partial<LLMConfig>
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: userMessage },
      ];

      const response = await this.client.messages.create({
        model: options?.model || this.config.model,
        max_tokens: options?.maxTokens || this.config.maxTokens,
        temperature: options?.temperature ?? this.config.temperature,
        system: systemPrompt,
        messages,
      });

      const duration = Date.now() - startTime;
      logger.debug('LLM response received', { duration: `${duration}ms` });

      const content = response.content[0];
      if (content?.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      logger.error('LLM request failed', error);
      throw new Error(
        `Failed to get LLM response\n` +
        `Reason: ${(error as Error).message}\n` +
        `Fix: Check your API key and network connection.`
      );
    }
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
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
