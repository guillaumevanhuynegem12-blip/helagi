// Cookie-consent model, shared by the banner, the analytics client, and the
// footer's "Cookie settings" link. Client-safe (no server imports).
//
// The consent cookie itself is strictly necessary (it stores the user's
// choice), is not httpOnly (client JS must read it to gate analytics), and
// contains no secrets. The server double-checks it in /api/analytics, so
// consent is enforced even if client code misbehaves.

export const CONSENT_COOKIE = "helagi_consent";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60; // re-ask after ~6 months

// Version of the Terms of Use / Privacy Policy the banner asks visitors to
// accept. Bump this date when the legal documents materially change — the
// banner then reappears for everyone and a fresh acceptance is recorded.
export const TERMS_VERSION = "2026-07-23";

// Custom events used to coordinate the consent UI across components
// (e.g. the footer's "Cookie settings" link reopens the preferences modal).
export const OPEN_COOKIE_SETTINGS_EVENT = "helagi:open-cookie-settings";
export const CONSENT_CHANGED_EVENT = "helagi:consent-changed";
// Fired by the preferences modal when it closes WITHOUT a decision (cancel,
// backdrop, Esc) so requireTermsAcceptance() can stop waiting.
export const CONSENT_UI_CLOSED_EVENT = "helagi:consent-ui-closed";

export interface Consent {
  /** Login, security, and the consent choice itself — cannot be disabled. */
  necessary: true;
  /** First-party usage analytics (never conversation content). */
  analytics: boolean;
  /** Optional performance/preference cookies (none are currently set). */
  preferences: boolean;
  updatedAt: string;
  /**
   * When the visitor agreed to the Terms of Use (and acknowledged the
   * Privacy Policy / Medical Disclaimer) via the consent banner. Kept
   * separate from the cookie choice: ANY banner action records it, so
   * agreeing to the terms never depends on accepting optional cookies
   * (GDPR consent must stay freely given and unbundled).
   */
  termsAcceptedAt?: string;
  /** TERMS_VERSION at the moment of acceptance. */
  termsVersion?: string;
}

// True when the visitor has agreed to the CURRENT terms version. The banner
// re-shows (and re-asks) whenever this is false — including for visitors
// whose consent cookie predates the terms-acceptance feature.
export function hasAcceptedTerms(): boolean {
  const consent = readConsent();
  return (
    !!consent?.termsAcceptedAt && consent.termsVersion === TERMS_VERSION
  );
}

// Parses the RAW value of the consent cookie (URL-encoded JSON). Pure — safe
// on both client and server; the API routes use it to re-check consent and
// terms acceptance server-side. Returns null for missing/malformed values —
// callers must then treat consent as denied and terms as not accepted.
export function parseConsentValue(
  raw: string | undefined | null,
): Consent | null {
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
      ...(typeof parsed.termsAcceptedAt === "string"
        ? { termsAcceptedAt: parsed.termsAcceptedAt }
        : {}),
      ...(typeof parsed.termsVersion === "string"
        ? { termsVersion: parsed.termsVersion }
        : {}),
    };
  } catch {
    return null;
  }
}

// Parses the consent cookie from the browser. Returns null when the user
// hasn't decided yet (or the cookie is malformed).
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  return parseConsentValue(raw);
}

// Hard gate used by every entry point (guest button, login/register forms,
// Google sign-in, and sending a chat message). Resolves true immediately when
// the current terms are already accepted; otherwise opens the consent
// preferences modal and resolves once the visitor decides (true) or dismisses
// it (false). Callers must abort their action on false.
export function requireTermsAcceptance(): Promise<boolean> {
  if (hasAcceptedTerms()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const settle = () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, settle);
      window.removeEventListener(CONSENT_UI_CLOSED_EVENT, settle);
      resolve(hasAcceptedTerms());
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, settle);
    window.addEventListener(CONSENT_UI_CLOSED_EVENT, settle);
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  });
}

// Stores the user's choice and notifies listeners. Works for granting AND
// withdrawing consent — writing {analytics: false} immediately stops tracking.
//
// Every write also records agreement to the current Terms of Use: the only
// callers are the banner and the preferences modal, both of which display the
// acceptance notice next to their buttons. The FIRST acceptance timestamp for
// a given terms version is preserved across later cookie-preference changes,
// so it remains usable as proof of when the visitor originally agreed.
export function writeConsent(analytics: boolean, preferences: boolean): Consent {
  const prior = readConsent();
  const termsAcceptedAt =
    prior?.termsVersion === TERMS_VERSION && prior.termsAcceptedAt
      ? prior.termsAcceptedAt
      : new Date().toISOString();
  const consent: Consent = {
    necessary: true,
    analytics,
    preferences,
    updatedAt: new Date().toISOString(),
    termsAcceptedAt,
    termsVersion: TERMS_VERSION,
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
