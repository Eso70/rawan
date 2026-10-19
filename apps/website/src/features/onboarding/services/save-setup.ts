import type {
  SetupDraft,
  SetupState,
  SetupStep,
} from "@rawan/types/onboarding";
import { parseSetupState } from "../state.ts";
export class SetupSaveError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "SetupSaveError";
  }
}
const unavailable = "Your choices couldn’t be saved. Please try again.";
export async function saveSetupRequest(
  draft: SetupDraft,
  revision: number,
  step: SetupStep,
  complete = false,
  fetcher: typeof fetch = fetch,
): Promise<SetupState> {
  let response: Response;
  try {
    response = await fetcher("/api/setup", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        expectedRevision: revision,
        step,
        ...(complete ? { complete: true } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new SetupSaveError(unavailable, 0);
  }
  if (response.status === 401)
    throw new SetupSaveError(
      "Your session has expired. Sign in again to continue.",
      401,
    );
  if (response.status === 409)
    throw new SetupSaveError(
      "Setup changed in another tab. Reload before retrying.",
      409,
    );
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SetupSaveError(unavailable, response.status);
  }
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : unavailable;
    throw new SetupSaveError(
      response.status >= 500 ? unavailable : message,
      response.status,
    );
  }
  const state = parseSetupState(body);
  if (!state) throw new SetupSaveError(unavailable, 502);
  return state;
}
