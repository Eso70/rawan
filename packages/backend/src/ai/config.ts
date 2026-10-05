import { integerSetting } from "../queue-config.js";
export interface AiConfig {
  provider: "disabled" | "fake";
  model: string;
  timeoutMs: number;
  concurrency: number;
}
export function validateAiConfig(input: Record<string, unknown>): AiConfig {
  const provider = input.AI_PROVIDER ?? "disabled";
  if (provider !== "disabled" && provider !== "fake")
    throw Error("AI_PROVIDER must be disabled or fake");
  if (provider === "fake" && input.NODE_ENV === "production")
    throw Error("Fake AI is prohibited in production");
  const model = input.AI_MODEL ?? "fake-v1";
  if (model !== "fake-v1")
    throw Error("AI_MODEL must be fake-v1 for the initial adapter");
  if (input.AI_API_KEY)
    throw Error(
      "AI_API_KEY is unsupported until a real provider adapter is configured",
    );
  return {
    provider,
    model,
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
