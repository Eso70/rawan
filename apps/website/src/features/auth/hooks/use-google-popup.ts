"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loginErrors } from "../lib/login-errors";
import { safeReturnTo } from "../../onboarding/routing";
import {
  googlePopupId,
  googleStartUrl,
  openGoogleWindow,
} from "../lib/google-window";

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
    const returnTo = safeReturnTo(
      new URLSearchParams(window.location.search).get("returnTo"),
    );
    let popupId: string;
    try {
      popupId = googlePopupId(window.crypto);
    } catch {
      window.location.assign(googleStartUrl(returnTo));
      return;
    }
    const popup = openGoogleWindow(window, returnTo, popupId);
    if (!popup) return;
    setPending(true);
    const deadline = Date.now() + 600000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    let stopped = false;
    cleanup.current = () => {
      stopped = true;
      clearTimeout(timer);
      request?.abort();
      try {
        popup.close();
      } catch {
        /* Google may isolate its window. */
      }
    };
    const finish = (error?: string) => {
      stop();
      setPending(false);
      if (error) onNotice(error);
      else window.location.replace(returnTo);
    };
    const poll = async () => {
      if (stopped) return;
      if (Date.now() >= deadline) {
        finish(loginErrors.state);
        return;
      }
      request = new AbortController();
      const timeout = setTimeout(() => request?.abort(), 8000);
      try {
        const response = await fetch(`/auth/google/result?popupId=${popupId}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: request.signal,
        });
        const result = await response.json();
        if (stopped) return;
        if (response.ok && result.status === "success") {
          finish();
          return;
        }
        if (result.status === "error") {
          finish(loginErrors[result.error] ?? loginErrors.google);
          return;
        }
      } catch {
        /* A temporary connection failure does not discard the sign-in. */
      } finally {
        clearTimeout(timeout);
      }
      if (!stopped)
        timer = setTimeout(() => {
          void poll();
        }, 1500);
    };
    // Signed HttpOnly results survive provider opener isolation; no tokens cross windows.
    timer = setTimeout(() => {
      void poll();
    }, 1000);
  }, [stop, onNotice]);
  return { pending, start, cancel };
}
