"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loginErrors } from "../../lib/login-errors";

export function useGooglePopup(onNotice: (message: string) => void) {
  const [pending, setPending] = useState(false);
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const stop = useCallback(() => {
    const current = cleanup.current;
    cleanup.current = undefined;
    current?.();
  }, []);
  useEffect(() => stop, [stop]);
  const cancel = useCallback(() => {
    stop();
    setPending(false);
    onNotice("");
  }, [stop, onNotice]);
  const start = useCallback(() => {
    if (cleanup.current) return;
    onNotice("");
    if (window.location.origin !== "http://localhost:3000") {
      onNotice("Open http://localhost:3000/login to use Google sign-in.");
      return;
    }
    const popupId = crypto.randomUUID();
    const width = Math.min(500, Math.max(320, window.outerWidth - 40));
    const height = Math.min(680, Math.max(480, window.outerHeight - 60));
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      "about:blank",
      `rawan-google-${popupId}`,
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (!popup) {
      onNotice("Allow popups for Rawan in your browser, then try again.");
      return;
    }
    try {
      // The provider cannot navigate the original page through window.opener.
      popup.opener = null;
      popup.location.replace(`/auth/google?popupId=${popupId}`);
      popup.focus();
    } catch {
      popup.close();
      onNotice(loginErrors.google);
      return;
    }
    setPending(true);
    const controller = new AbortController();
    const deadline = Date.now() + 600000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    cleanup.current = () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
      try {
        popup.close();
      } catch {
        /* The provider may isolate its browsing context. */
      }
    };
    const finish = (error?: string) => {
      stop();
      setPending(false);
      if (error) onNotice(error);
      else window.location.assign("/workspace");
    };
    const poll = async () => {
      if (stopped) return;
      if (Date.now() >= deadline) {
        finish(loginErrors.state);
        return;
      }
      try {
        const response = await fetch(`/auth/google/result?popupId=${popupId}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(8000),
          ]),
        });
        const result = await response.json();
        if (stopped) return;
        if (response.ok && result.status === "success") {
          finish();
          return;
        }
        if (result.status === "error") {
          finish(
            Object.hasOwn(loginErrors, result.error)
              ? loginErrors[result.error]
              : loginErrors.google,
          );
          return;
        }
      } catch {
        /* A temporary connection failure does not abandon the popup. */
      }
      if (!stopped)
        timer = setTimeout(() => {
          void poll();
        }, 1500);
    };
    // Completion uses a signed HttpOnly cookie, not tokens or cross-window messages.
    // Polling also works when Google's opener policy severs the window reference.
    timer = setTimeout(() => {
      void poll();
    }, 1500);
  }, [stop, onNotice]);
  return { pending, start, cancel };
}
