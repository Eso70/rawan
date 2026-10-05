import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@rawan/database";
import {
  AiFailure,
  AI_TASKS,
  buildAiPrompt,
  invokeProvider,
  resolveAiContext,
  validateAiInput,
  bounded,
  UnrecoverableError,
  type AiProvider,
  type AiConfig,
} from "@rawan/backend";

export function aiGenerationProcessor(
  prisma: PrismaClient,
  provider: AiProvider,
  config: AiConfig,
) {
  return async (id: string): Promise<void> => {
    const token = randomUUID();
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      UPDATE "AiGeneration" SET status='RUNNING', "leaseToken"=${token},
      "leaseUntil"=CURRENT_TIMESTAMP + ${config.timeoutMs + 30000} * INTERVAL '1 millisecond',
      "startedAt"=coalesce("startedAt", CURRENT_TIMESTAMP), "updatedAt"=CURRENT_TIMESTAMP,
      attempts=attempts+1, "errorCode"=NULL
      WHERE id=${id} AND attempts < 3 AND (status='QUEUED' OR (status='RUNNING' AND "leaseUntil" < CURRENT_TIMESTAMP)) RETURNING id`);
    if (!rows.length) {
      const row = await prisma.aiGeneration.findUnique({
        where: { id },
        select: { status: true, attempts: true, leaseUntil: true },
      });
      if (!row || row.status === "COMPLETED" || row.status === "FAILED") return;
      if (row.attempts >= 3) {
        await prisma.aiGeneration.updateMany({
          where: {
            id,
            status: { in: ["QUEUED", "RUNNING"] },
            OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
          },
          data: {
            status: "FAILED",
            errorCode: "ATTEMPTS_EXHAUSTED",
            completedAt: new Date(),
            leaseToken: null,
            leaseUntil: null,
          },
        });
      }
      // Never overwrite an active execution or charge twice for an overlapping delivery.
      throw new UnrecoverableError("AI execution already claimed or exhausted");
    }
    const fence = { id, status: "RUNNING" as const, leaseToken: token };
    try {
      const generation = await prisma.aiGeneration.findUniqueOrThrow({
        where: { id },
      });
      if (
        config.provider !== provider.id ||
        generation.provider !== provider.id ||
        generation.model !== config.model
      )
        throw new AiFailure("CONFIGURATION_CHANGED");
      const input = validateAiInput({
        task: generation.task,
        instructions: generation.instructions,
        inputText: generation.inputText,
        context: generation.context,
      });
      if (generation.promptVersion !== AI_TASKS[input.task].version)
        throw new AiFailure("CONFIGURATION_CHANGED");
      const context = await bounded(
        resolveAiContext(
          prisma,
          generation.requestedByUserId,
          generation.projectId,
          input.context,
        ),
        10000,
      );
      const output = await invokeProvider(
        provider,
        buildAiPrompt(input, context, config.model),
        config.timeoutMs,
      );
      await prisma.aiGeneration.updateMany({
        where: fence,
        data: {
          status: "COMPLETED",
          result: {
            type: "text",
            text: output.text,
            proposal: true,
            contextTruncated: context.truncated,
          },
          inputTokens: output.inputTokens,
          outputTokens: output.outputTokens,
          completedAt: new Date(),
          errorCode: null,
          leaseToken: null,
          leaseUntil: null,
        },
      });
    } catch (error) {
      const failure =
        error instanceof AiFailure
          ? error
          : new AiFailure("PROVIDER_UNAVAILABLE", true);
      const row = await prisma.aiGeneration.findUnique({
        where: { id },
        select: { attempts: true },
      });
      const retry = failure.transient && (row?.attempts ?? 3) < 3;
      await prisma.aiGeneration.updateMany({
        where: fence,
        data: {
          status: retry ? "QUEUED" : "FAILED",
          errorCode: failure.code,
          completedAt: retry ? null : new Date(),
          leaseToken: null,
          leaseUntil: null,
        },
      });
      if (!retry) throw new UnrecoverableError("AI generation failed");
      throw Error("AI generation temporarily unavailable");
    }
  };
}
