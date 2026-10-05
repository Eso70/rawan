import type { AiGeneration, Prisma } from '@rawan/database';
import type { AiGenerationDetail, AiGenerationSummary } from '@rawan/types';
export const AI_SUMMARY_SELECT = {
  id: true,
  projectId: true,
  task: true,
  status: true,
  provider: true,
  model: true,
  promptVersion: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
} as const satisfies Prisma.AiGenerationSelect;
export function aiSummary(
  row: Prisma.AiGenerationGetPayload<{ select: typeof AI_SUMMARY_SELECT }>,
): AiGenerationSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    task: row.task,
    status: row.status,
    provider: row.provider,
    model: row.model,
    promptVersion: row.promptVersion,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}
export function aiDetail(row: AiGeneration): AiGenerationDetail {
  return {
    ...aiSummary(row),
    result:
      row.status === 'COMPLETED'
        ? (row.result as AiGenerationDetail['result'])
        : null,
    usage: {
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      estimatedCost: null,
    },
    error:
      row.status === 'FAILED'
        ? {
            code: row.errorCode ?? 'GENERATION_FAILED',
            message: 'AI generation failed. Review your request and try again.',
          }
        : null,
  };
}
