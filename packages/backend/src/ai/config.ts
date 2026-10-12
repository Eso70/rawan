import { integerSetting } from "../queue-config.js";
export interface AiConfig {
  provider: "disabled" | "fake" | "openai";
  apiKey?: string;
  model: string;
  timeoutMs: number;
  concurrency: number;
}
export function validateAiConfig(input: Record<string, unknown>): AiConfig {
  const provider = input.AI_PROVIDER ?? "disabled";
  if (!["disabled", "fake", "openai"].includes(provider as string))
    throw Error("AI_PROVIDER must be disabled, fake or openai");
  if (provider === "fake" && input.NODE_ENV === "production")
    throw Error("Fake AI is prohibited in production");
  const model =
    input.AI_MODEL ?? (provider === "openai" ? undefined : "fake-v1");
  if (provider === "openai") {
    if (
      typeof model !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(model) ||
      model === "fake-v1"
    )
      throw Error("OpenAI requires an explicit AI_MODEL");
    if (
      typeof input.AI_API_KEY !== "string" ||
      input.AI_API_KEY.trim().length < 20
    )
      throw Error("OpenAI requires a server-side AI_API_KEY");
    if (
      input.AI_EXTERNAL_PROCESSING_ENABLED !== true &&
      input.AI_EXTERNAL_PROCESSING_ENABLED !== "true"
    )
      throw Error("OpenAI requires explicit AI_EXTERNAL_PROCESSING_ENABLED");
  } else if (model !== "fake-v1")
    throw Error("Disabled/fake AI_MODEL must be fake-v1");
  if (provider !== "openai" && input.AI_API_KEY)
    throw Error(
      "AI_API_KEY is unsupported until a real provider adapter is configured",
    );
  return {
    provider: provider as AiConfig["provider"],
    model: model as string,
    ...(provider === "openai" ? { apiKey: input.AI_API_KEY as string } : {}),
    timeoutMs: integerSetting(
      input.AI_REQUEST_TIMEOUT_MS,
      15000,
      1000,
      60000,
      "AI_REQUEST_TIMEOUT_MS",
    ),
    concurrency: integerSetting(
      input.AI_WORKER_CONCURRENCY,
      1,
      1,
      4,
      "AI_WORKER_CONCURRENCY",
    ),
  };
}
