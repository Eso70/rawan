import { bounded } from "../queue-config.js";
export type AiErrorCode =
  | "INVALID_CONTEXT"
  | "INVALID_INPUT"
  | "INVALID_OUTPUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_REJECTED"
  | "CONFIGURATION_CHANGED"
  | "ATTEMPTS_EXHAUSTED";
export class AiFailure extends Error {
  constructor(
    readonly code: AiErrorCode,
    readonly transient = false,
  ) {
    super("AI generation failed");
  }
}
export interface AiProviderRequest {
  model: string;
  messages: { role: "system" | "user"; content: string }[];
  maxOutputTokens: number;
}
export interface AiProviderOutput {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}
export interface AiProvider {
  readonly id: string;
  generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<AiProviderOutput>;
}
export function validateProviderOutput(value: unknown): AiProviderOutput {
  if (!value || typeof value !== "object")
    throw new AiFailure("INVALID_OUTPUT");
  const output = value as Record<string, unknown>;
  const token = (v: unknown) =>
    v === null ||
    (typeof v === "number" &&
      Number.isSafeInteger(v) &&
      v >= 0 &&
      v <= 2147483647);
  if (
    typeof output.text !== "string" ||
    !output.text.trim() ||
    output.text.includes("\u0000") ||
    output.text.length > 12000 ||
    !token(output.inputTokens) ||
    !token(output.outputTokens)
  )
    throw new AiFailure("INVALID_OUTPUT");
  return {
    text: output.text,
    inputTokens: output.inputTokens as number | null,
    outputTokens: output.outputTokens as number | null,
  };
}
export async function invokeProvider(
  provider: AiProvider,
  request: AiProviderRequest,
  timeoutMs: number,
) {
  const abort = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abort.abort();
  }, timeoutMs);
  try {
    return validateProviderOutput(
      await bounded(provider.generate(request, abort.signal), timeoutMs),
    );
  } catch (error) {
    if (timedOut) throw new AiFailure("PROVIDER_TIMEOUT", true);
    if (error instanceof AiFailure) throw error;
    throw new AiFailure("PROVIDER_UNAVAILABLE", true);
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
}
/** Explicit development simulator. Does not claim to summarize or rewrite intelligently. */
export class FakeAiProvider implements AiProvider {
  readonly id = "fake";
  async generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<AiProviderOutput> {
    signal.throwIfAborted();
    const data = JSON.parse(request.messages[1]!.content) as {
      task: string;
      inputText: string;
      context: { resources: { text: string }[] };
    };
    const sample = (
      data.inputText || data.context.resources.map((r) => r.text).join("\n")
    ).slice(0, 1200);
    return {
      text: `[Development fake provider: ${data.task} proposal; no real AI call]\n${sample || "Select content or connect a real provider to receive authored suggestions."}`,
      inputTokens: null,
      outputTokens: null,
    };
  }
}
