// Client-side analytics: tiny, first-party, and consent-gated.
//
// track() silently does nothing until the visitor has accepted analytics
// cookies (checked on every call, so withdrawing consent stops tracking
// immediately). Events go to our own /api/analytics route — no third-party
// tools, no cookies of its own.
//
// PRIVACY RULE: only send event names and small technical values (counts,
// durations, HTTP status codes, route names). Never pass message text,
// symptoms, email addresses, or anything a user typed.

import { readConsent } from "./consent";

type EventProps = Record<string, string | number | boolean>;

export function track(event: string, props?: EventProps): void {
  if (typeof window === "undefined") return;
  if (readConsent()?.analytics !== true) return;

  try {
    const body = JSON.stringify({
      event,
      props,
      path: window.location.pathname,
    });
    // sendBeacon survives page unloads (needed for session_end); fall back to
    // a keepalive fetch where it's unavailable or refuses the payload.
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon?.("/api/analytics", blob);
    if (!sent) {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never break the app.
  }
}
