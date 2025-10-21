import { z } from 'zod';

const AgentRefSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
});

const StageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  agents: z.array(AgentRefSchema).min(1, 'Each stage must include at least one agent'),
});

export const WorkflowSchema = z.object({
  features: z
    .object({ useOracle: z.boolean().optional() })
    .partial()
    .optional(),
  stages: z.array(StageSchema).min(1, 'At least one stage is required'),
});

export type WorkflowConfig = z.infer<typeof WorkflowSchema>;

export function validateWorkflowConfig(config: unknown): { ok: true; data: WorkflowConfig } | { ok: false; errors: string[] } {
  const result = WorkflowSchema.safeParse(config);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors = result.error.issues.map(issue => {
    const path = issue.path.length ? `$.${issue.path.join('.')}` : '$';
    return `${path}: ${issue.message}`;
  });
  return { ok: false, errors };
}

