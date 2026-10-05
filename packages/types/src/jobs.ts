// Internal contracts: deliberately separate from the public API entry point.
export const MAINTENANCE_QUEUE = "maintenance";
export const MEDIA_CLEANUP_JOB = "media-cleanup";
export const MEDIA_CLEANUP_SCHEDULER = MEDIA_CLEANUP_JOB;
export interface MediaCleanupPayload {
  version: 1;
}
export interface MediaCleanupResult {
  removed: number;
}
export type MaintenanceJobName = typeof MEDIA_CLEANUP_JOB;
export class InvalidMaintenanceJob extends Error {
  constructor() {
    super("Unsupported maintenance job or payload");
  }
}
export function parseMaintenanceJob(
  name: unknown,
  data: unknown,
): MediaCleanupPayload {
  if (
    name !== MEDIA_CLEANUP_JOB ||
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "version") ||
    (data as Record<string, unknown>).version !== 1
  )
    throw new InvalidMaintenanceJob();
  return { version: 1 };
}
export const AI_QUEUE = "ai";
export const AI_GENERATION_JOB = "generation";
export interface AiGenerationPayload {
  version: 1;
  generationId: string;
}
export function parseAiJob(name: string, data: unknown): AiGenerationPayload {
  if (
    name !== AI_GENERATION_JOB ||
    typeof data !== "object" ||
    !data ||
    Array.isArray(data)
  )
    throw Error("Invalid AI job");
  const value = data as Record<string, unknown>;
  if (
    Object.keys(value).sort().join(",") !== "generationId,version" ||
    value.version !== 1 ||
    typeof value.generationId !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      value.generationId,
    )
  )
    throw Error("Invalid AI job");
  return { version: 1, generationId: value.generationId };
}
