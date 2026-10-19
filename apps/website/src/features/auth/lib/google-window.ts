import { safeReturnTo } from "../../onboarding/routing.ts";

export function googleStartUrl(returnTo: unknown, popupId?: string) {
  return (
    "/auth/google?" +
    new URLSearchParams({
      returnTo: safeReturnTo(returnTo),
      ...(popupId ? { popupId } : {}),
    })
  );
}

/** Keep older/mobile browsers usable without depending on randomUUID or popup support. */
export function googlePopupId(
  source: Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">>,
) {
  if (typeof source.randomUUID === "function") return source.randomUUID();
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function openGoogleWindow(
  browser: Window,
  returnTo: unknown,
  popupId: string,
) {
  const width = Math.min(500, Math.max(320, browser.outerWidth - 40));
  const height = Math.min(680, Math.max(480, browser.outerHeight - 60));
  const left = Math.round(browser.screenX + (browser.outerWidth - width) / 2);
  const top = Math.round(browser.screenY + (browser.outerHeight - height) / 2);
  let popup: Window | null = null;
  try {
    popup = browser.open(
      googleStartUrl(returnTo, popupId),
      `rawan-google-${popupId}`,
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (popup) {
      popup.opener = null;
      popup.focus();
      return popup;
    }
  } catch {
    try {
      popup?.close();
    } catch {
      /* Provider isolation. */
    }
  }
  // Still in the click event: ordinary OAuth navigation works when popups are blocked.
  browser.location.assign(googleStartUrl(returnTo));
  return null;
}
