import { CONSENT_COOKIE, TERMS_VERSION, parseConsentValue } from "./consent";

// Defense-in-depth origin check for the API routes.
//
// Browsers always attach an Origin header to cross-site POSTs, so if one is
// present and doesn't match the host serving the app, another website is
// trying to spend our Anthropic tokens through a visitor's browser — reject.
// Requests without an Origin header (curl, scripts) are allowed through:
// they can forge any header anyway, and per-IP rate limiting is the shield
// against those.
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  // Behind Vercel's proxy the public hostname is in x-forwarded-host.
  const rawHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!rawHost) return false;
  const host = rawHost.split(",")[0]!.trim();

  try {
    return new URL(origin).host === host;
  } catch {
    // Unparseable or "null" origin (sandboxed frames etc.) — not our page.
    return false;
  }
}

// ── Terms-of-Use acceptance (server-side re-check) ──────────────────────────
//
// The consent banner records acceptance of the current terms version in the
// consent cookie (lib/consent.ts). The client gates every entry point, but
// clients can't be trusted: the session-creating routes and /api/chat verify
// the cookie again here. Returns the acceptance record, or null when the
// visitor has not accepted the CURRENT terms version.

export interface TermsAcceptance {
  acceptedAt: string;
  version: string;
}

export function getTermsAcceptance(req: Request): TermsAcceptance | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  const raw = header
    .split(/;\s*/)
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  const consent = parseConsentValue(raw);
  if (!consent?.termsAcceptedAt || consent.termsVersion !== TERMS_VERSION) {
    return null;
  }
  return { acceptedAt: consent.termsAcceptedAt, version: consent.termsVersion };
}

// Shared 403 body for routes that require terms acceptance first.
export const TERMS_REQUIRED_ERROR =
  "Please accept the Terms of Use and confirm you have read the Privacy Policy before using Helagi.";
