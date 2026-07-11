// Cookie-consent model, shared by the banner, the analytics client, and the
// footer's "Cookie settings" link. Client-safe (no server imports).
//
// The consent cookie itself is strictly necessary (it stores the user's
// choice), is not httpOnly (client JS must read it to gate analytics), and
// contains no secrets. The server double-checks it in /api/analytics, so
// consent is enforced even if client code misbehaves.

export const CONSENT_COOKIE = "helagi_consent";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60; // re-ask after ~6 months

// Custom events used to coordinate the consent UI across components
// (e.g. the footer's "Cookie settings" link reopens the preferences modal).
export const OPEN_COOKIE_SETTINGS_EVENT = "helagi:open-cookie-settings";
export const CONSENT_CHANGED_EVENT = "helagi:consent-changed";

export interface Consent {
  /** Login, security, and the consent choice itself — cannot be disabled. */
  necessary: true;
  /** First-party usage analytics (never conversation content). */
  analytics: boolean;
  /** Optional performance/preference cookies (none are currently set). */
  preferences: boolean;
  updatedAt: string;
}

// Parses the consent cookie. Returns null when the user hasn't decided yet
// (or the cookie is malformed) — callers must then treat consent as denied.
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    if (
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.preferences !== "boolean"
    ) {
      return null;
    }
    return {
      necessary: true,
      analytics: parsed.analytics,
      preferences: parsed.preferences,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

// Stores the user's choice and notifies listeners. Works for granting AND
// withdrawing consent — writing {analytics: false} immediately stops tracking.
export function writeConsent(analytics: boolean, preferences: boolean): Consent {
  const consent: Consent = {
    necessary: true,
    analytics,
    preferences,
    updatedAt: new Date().toISOString(),
  };
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}` +
    `; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  return consent;
}
