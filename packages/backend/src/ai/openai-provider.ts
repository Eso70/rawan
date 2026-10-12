import {
  AiFailure,
  validateProviderOutput,
  type AiProvider,
  type AiProviderRequest,
  type AiProviderOutput,
} from "./provider.js";

/** Fixed HTTPS origin, text only, no tools, no stored conversations or redirects. */
export class OpenAiProvider implements AiProvider {
  readonly id = "openai";
  constructor(
    private readonly apiKey: string,
    private readonly request: typeof fetch = fetch,
  ) {}
  async generate(
    input: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<AiProviderOutput> {
    let response: Response;
    try {
      response = await this.request("https://api.openai.com/v1/responses", {
        method: "POST",
        redirect: "error",
        signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          input: input.messages.map((message) => ({
            role: message.role,
            content: [{ type: "input_text", text: message.content }],
          })),
          max_output_tokens: input.maxOutputTokens,
          store: false,
          tools: [],
          stream: false,
        }),
      });
    } catch {
      throw new AiFailure("PROVIDER_UNAVAILABLE");
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 429) throw new AiFailure("PROVIDER_RATE_LIMIT");
      throw new AiFailure(
        response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED",
      );
    }
    if (!response.body) throw new AiFailure("INVALID_OUTPUT");
    const reader = response.body.getReader(),
      chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 256 * 1024) throw new AiFailure("INVALID_OUTPUT");
        chunks.push(chunk.value);
      }
    } finally {
      await reader.cancel();
    }
    let value: unknown;
    try {
      value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new AiFailure("INVALID_OUTPUT");
    }
    if (!value || typeof value !== "object")
      throw new AiFailure("INVALID_OUTPUT");
    const output = value as {
      status?: string;
      output?: unknown[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    if (output.status !== "completed" || !Array.isArray(output.output))
      throw new AiFailure("INVALID_OUTPUT");
    const text = output.output
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const message = item as {
          type?: string;
          role?: string;
          content?: unknown[];
        };
        if (
          message.type !== "message" ||
          message.role !== "assistant" ||
          !Array.isArray(message.content)
        )
          return [];
        return message.content.flatMap((content) => {
          if (!content || typeof content !== "object") return [];
          const part = content as { type?: string; text?: unknown };
          return part.type === "output_text" && typeof part.text === "string"
            ? [part.text]
            : [];
        });
      })
      .join("\n");
    return validateProviderOutput({
      text,
      inputTokens: output.usage?.input_tokens ?? null,
      outputTokens: output.usage?.output_tokens ?? null,
    });
  }
}
