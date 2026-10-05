import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiFailure,
  AiQueue,
  AI_TASKS,
  publishPendingAi,
  resolveAiContext,
  validateAiInput,
  type AiConfig,
} from '@rawan/backend';
import { PrismaService } from '../database/prisma.service.js';
import { CreateAiDto, AiListDto } from './ai.dto.js';
import { aiDetail, aiSummary, AI_SUMMARY_SELECT } from './ai-response.js';
@Injectable()
export class AiService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(AiService.name);
  private readonly ai: AiConfig;
  private readonly queue?: AiQueue;
  private timer?: ReturnType<typeof setInterval>;
  private publishing?: Promise<void>;
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.ai = config.getOrThrow<AiConfig>('AI_CONFIG');
    const redisUrl = config.get<string>('REDIS_URL');
    if (this.ai.provider !== 'disabled' && redisUrl)
      this.queue = new AiQueue(
        {
          redisUrl,
          prefix: config.getOrThrow('QUEUE_PREFIX'),
          cleanupIntervalMs: config.getOrThrow('MEDIA_CLEANUP_INTERVAL_MS'),
        },
        (event) => this.logger.warn({ event }),
      );
  }
  onApplicationBootstrap() {
    if (!this.queue) return;
    this.recover();
    this.timer = setInterval(() => this.recover(), 10000);
    this.timer.unref();
  }
  private recover() {
    if (!this.queue || this.publishing) return;
    this.publishing = publishPendingAi(this.prisma, this.queue)
      .catch(() => this.logger.warn({ event: 'AI_PUBLICATION_UNAVAILABLE' }))
      .finally(() => {
        this.publishing = undefined;
      });
  }
  async onApplicationShutdown() {
    clearInterval(this.timer);
    await this.publishing;
    await this.queue?.close();
  }
  private async project(userId: string, id: string) {
    if (
      !(await this.prisma.project.findFirst({
        where: { id, author: { userId } },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Project not found');
  }
  async create(userId: string, projectId: string, dto: CreateAiDto) {
    await this.project(userId, projectId);
    if (!this.queue || this.ai.provider === 'disabled')
      throw new ServiceUnavailableException('AI is not enabled');
    let input;
    try {
      input = validateAiInput(dto);
    } catch {
      throw new BadRequestException('Invalid AI request');
    }
    try {
      const row = await this.prisma.$transaction(
        async (tx) => {
          // Locks the same account across all projects and API replicas. Never a process-local throttle.
          await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
          const now = Date.now();
          const pending = await tx.aiGeneration.count({
            where: {
              requestedByUserId: userId,
              status: { in: ['QUEUED', 'RUNNING'] },
            },
          });
          const hour = await tx.aiGeneration.count({
            where: {
              requestedByUserId: userId,
              createdAt: { gte: new Date(now - 3600000) },
            },
          });
          const day = await tx.aiGeneration.count({
            where: {
              requestedByUserId: userId,
              createdAt: { gte: new Date(now - 86400000) },
            },
          });
          if (pending >= 5 || hour >= 30 || day >= 200)
            throw new HttpException('AI request limit reached', 429);
          await resolveAiContext(tx, userId, projectId, input.context);
          return tx.aiGeneration.create({
            data: {
              id: randomUUID(),
              projectId,
              requestedByUserId: userId,
              task: input.task,
              instructions: input.instructions,
              inputText: input.inputText,
              context: input.context.map((r) => ({ kind: r.kind, id: r.id })),
              provider: this.ai.provider,
              model: this.ai.model,
              promptVersion: AI_TASKS[input.task].version,
            },
          });
        },
        { maxWait: 5000, timeout: 15000 },
      );
      // Acceptance is durable even when Redis is temporarily unavailable. Recovery republishes it.
      await this.queue.enqueue(row.id).catch(() =>
        this.logger.warn({
          event: 'AI_PUBLICATION_PENDING',
          generationId: row.id,
        }),
      );
      return aiSummary(row);
    } catch (error) {
      if (error instanceof AiFailure)
        throw new NotFoundException('AI context not found in this project');
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('AI request could not be stored');
    }
  }
  async read(userId: string, id: string) {
    const row = await this.prisma.aiGeneration.findFirst({
      where: { id, requestedByUserId: userId, project: { author: { userId } } },
    });
    if (!row) throw new NotFoundException('AI generation not found');
    return aiDetail(row);
  }
  async list(userId: string, projectId: string, query: AiListDto) {
    await this.project(userId, projectId);
    const limit = query.limit ?? 50,
      offset = query.offset ?? 0;
    const rows = await this.prisma.aiGeneration.findMany({
      select: AI_SUMMARY_SELECT,
      where: {
        projectId,
        requestedByUserId: userId,
        project: { author: { userId } },
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      skip: offset,
    });
    return {
      items: rows.slice(0, limit).map(aiSummary),
      nextOffset: rows.length > limit ? offset + limit : null,
    };
  }
}
