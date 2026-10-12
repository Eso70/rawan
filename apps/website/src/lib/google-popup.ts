import { createHmac, timingSafeEqual } from "node:crypto";

export const POPUP_RESULT_COOKIE = "rawan_google_result";
export const POPUP_RESULT_LIFETIME = 300;
export function isPopupId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      value,
    )
  );
}
export type PopupResult = {
  popupId: string;
  status: "success" | "error";
  error?: string;
  expires: number;
};
export function encodePopupResult(result: PopupResult, secret: string) {
  const payload = Buffer.from(JSON.stringify(result)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function decodePopupResult(
  value: string | undefined,
  secret: string,
  popupId: string,
): PopupResult | null {
  try {
    if (!value || value.length > 1024 || !isPopupId(popupId)) return null;
    const parts = value.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const result: PopupResult = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    if (
      result.popupId !== popupId ||
      !Number.isFinite(result.expires) ||
      result.expires <= Date.now() ||
      !["success", "error"].includes(result.status) ||
      (result.error !== undefined &&
        (typeof result.error !== "string" || result.error.length > 30)) ||
      Object.keys(result).some(
        (key) => !["popupId", "status", "error", "expires"].includes(key),
      )
    )
      return null;
    return result;
  } catch {
    return null;
  }
}
