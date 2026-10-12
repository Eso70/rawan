import { describe, expect, it, vi } from "vitest";
import { OpenAiProvider } from "./openai-provider.js";
import { validateAiConfig } from "./config.js";
const request = {
  model: "configured-model",
  messages: [
    { role: "system" as const, content: "Instructions" },
    { role: "user" as const, content: "Selected private text" },
  ],
  maxOutputTokens: 1000,
};
const output = {
  status: "completed",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: "A proposal" }],
    },
  ],
  usage: { input_tokens: 10, output_tokens: 4 },
};
describe("OpenAI production adapter without external calls", () => {
  it("requires explicit model, secret and external-processing enablement", () => {
    expect(() => validateAiConfig({ AI_PROVIDER: "openai" })).toThrow();
    expect(() =>
      validateAiConfig({
        AI_PROVIDER: "openai",
        AI_MODEL: request.model,
        AI_API_KEY: "a".repeat(30),
      }),
    ).toThrow();
    expect(
      validateAiConfig({
        NODE_ENV: "production",
        AI_PROVIDER: "openai",
        AI_MODEL: request.model,
        AI_API_KEY: "a".repeat(30),
        AI_EXTERNAL_PROCESSING_ENABLED: "true",
      }).provider,
    ).toBe("openai");
  });
  it("sends bounded text to the fixed origin with storage and tools disabled", async () => {
    const http = vi.fn(async () => new Response(JSON.stringify(output)));
    const provider = new OpenAiProvider("test-secret", http as typeof fetch);
    expect(
      await provider.generate(request, new AbortController().signal),
    ).toEqual({ text: "A proposal", inputTokens: 10, outputTokens: 4 });
    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.redirect).toBe("error");
    expect(JSON.parse(init.body as string)).toMatchObject({
      store: false,
      stream: false,
      tools: [],
      max_output_tokens: 1000,
    });
  });
  it.each([401, 429, 500])(
    "returns safe failures for HTTP %s without echoing provider bodies",
    async (status) => {
      const provider = new OpenAiProvider(
        "test",
        (async () =>
          new Response("private provider diagnostics", {
            status,
          })) as typeof fetch,
      );
      await expect(
        provider.generate(request, new AbortController().signal),
      ).rejects.toThrow("AI generation failed");
    },
  );
  it("rejects incomplete and excessive output", async () => {
    for (const payload of [
      { ...output, status: "incomplete" },
      {
        ...output,
        output: [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "x".repeat(12001) }],
          },
        ],
      },
      { ...output, padding: "x".repeat(300000) },
    ]) {
      const provider = new OpenAiProvider(
        "test",
        (async () => new Response(JSON.stringify(payload))) as typeof fetch,
      );
      await expect(
        provider.generate(request, new AbortController().signal),
      ).rejects.toThrow("AI generation failed");
    }
  });
});
