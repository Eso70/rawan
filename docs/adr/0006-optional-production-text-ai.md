# ADR 0006: explicitly enabled production text proposals

Date: 12 October 2026. Status: Accepted and implemented with mocked transport validation; no live provider call. Covers A11 and originally H2 N24.

Keep AI disabled by default and prohibit the simulator in production. OpenAI is an optional real text adapter requiring an explicit server-side model, secret and external-processing enablement. Credentials stay in process configuration, never generation records or responses. Existing ownership checks, context allowlists, durable jobs, account limits and proposal-only behavior remain in force. No automatic canonical edits, recommender, visual provider or access to another account's context is introduced.

Requests go only to the fixed HTTPS Responses API origin, with redirects rejected, text input, bounded output tokens, no tools, no streaming and `store: false`. Responses are byte-bounded, parsed defensively, validated against the existing output/token limits and reduced to text proposals. Diagnostics/provider response bodies are not exposed in failures. Production calls get one submission attempt: a timeout or crashed execution may already have been billed, so automatic resubmission is prohibited. An author may deliberately request a new proposal after reviewing a failure.

Configured provider/model must match the durable job. Deployments must configure API/worker consistently, understand the provider's data policy and choose a model available to their account. This implementation does not claim live account eligibility, latency, quality or billing validation. `store: false` disables response storage for retrieval; it is not a zero-retention guarantee.

Primary references: [OpenAI text generation](https://developers.openai.com/api/docs/guides/text), [conversation state](https://developers.openai.com/api/docs/guides/conversation-state). Artwork/export processing follows [Sharp constructor limits](https://sharp.pixelplumbing.com/api-constructor/), [output metadata behavior](https://sharp.pixelplumbing.com/api-output/), and [EPUB 3.3](https://www.w3.org/TR/epub-33/).
