import { readFile } from 'fs/promises';
import type { IAgentContext, IAgentResult } from '../agents/IAgent.js';
import { AgentFactory } from './AgentFactory.js';
import type { AgentName } from '../types/agent-results.js';
import { validateWorkflowConfig, type WorkflowConfig } from '../config/workflow-validator.js';

export class ConfigOrchestrator {
  constructor(private context: Omit<IAgentContext, 'results'>) {}

  async runFromFile(
    configPath: string,
    options?: { include?: Set<string>; overrideUseOracle?: boolean; initialResults?: Record<string, unknown> }
  ): Promise<Record<string, IAgentResult>> {
    const buf = await readFile(configPath, 'utf-8');
    const raw = JSON.parse(buf);
    const validation = validateWorkflowConfig(raw);
    if (!validation.ok) {
      const friendly = validation.errors.join('\n');
      throw new Error(`Invalid workflow configuration:\n${friendly}`);
    }
    const config: WorkflowConfig = validation.data;
    const results: Record<string, IAgentResult> = {};

    const shared: IAgentContext = {
      brandName: this.context.brandName,
      brandUrl: this.context.brandUrl,
      competitorUrls: this.context.competitorUrls ?? [],
      useOracle: options?.overrideUseOracle ?? (config.features?.useOracle ?? false),
      results: (options?.initialResults as any) || {},
    };

    for (const stage of config.stages) {
      for (const item of stage.agents) {
        if (options?.include && !options.include.has(item.name)) {
          continue; // skip execution if not included
        }
        const agent = AgentFactory.create(item.name);
        if (!agent) {
          results[item.name] = { success: false, data: null, error: `Unknown agent: ${item.name}` };
          continue;
        }

        const res = await agent.execute(shared);
        results[item.name] = res;
        if (res.success) {
          try {
            const key = item.name as AgentName;
            (shared.results as any)[key] = res.data;
          } catch {}
        }
      }
    }

    return results;
  }
}
