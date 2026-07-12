// "Sign in with Google" via the standard OAuth 2.0 authorization-code flow —
// implemented directly against Google's endpoints, so no extra dependencies
// and no changes to the existing session system (lib/auth.ts).
//
// The feature is optional: the button and routes only activate when both
// GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set (see .env.example for how
// to create them in the Google Cloud console).
//
// Flow:
//   1. GET /api/auth/google           → sets a random `state` cookie and
//                                       redirects to Google's consent screen.
//   2. Google redirects back to
//      GET /api/auth/google/callback  → checks `state` (CSRF), exchanges the
//                                       one-time code for an ID token, reads
//                                       the verified email, then logs the
//                                       visitor in with a normal session.
//
// Only the "openid email" scopes are requested — no profile, contacts, or
// anything else. That matches the app's promise: an account is an email,
// nothing more.

// Short-lived CSRF token that ties the callback to the browser that started
// the flow.
export const GOOGLE_STATE_COOKIE = "helagi_google_state";

export function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

// Public base URL of this deployment, proxy-aware (same header logic as
// lib/security.ts). Needed because the redirect URI sent to Google must be
// absolute and must exactly match one registered in the Google console.
export function getBaseUrl(req: Request): string {
  const rawHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const host = rawHost.split(",")[0]!.trim();
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]!.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

export function getGoogleRedirectUri(req: Request): string {
  return `${getBaseUrl(req)}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    // Always show the account chooser — friendlier than silently reusing
    // whichever Google account happens to be signed in.
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export interface GoogleProfile {
  sub: string; // Google's stable account ID
  email: string; // verified by Google (email_verified checked below)
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const payload = jwt.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// Exchanges the one-time authorization code for tokens and returns the
// visitor's verified Google identity, or null if anything doesn't check out.
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<GoogleProfile | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    console.error(
      "[google-auth] token exchange failed:",
      res.status,
      await res.text().catch(() => ""),
    );
    return null;
  }

  const data = (await res.json().catch(() => null)) as {
    id_token?: string;
  } | null;
  if (!data?.id_token) return null;

  // The ID token arrives straight from Google over TLS, so per Google's docs
  // its signature needs no verification here — but the claims do.
  const claims = decodeJwtPayload(data.id_token);
  if (!claims) return null;
  if (
    claims.iss !== "https://accounts.google.com" &&
    claims.iss !== "accounts.google.com"
  ) {
    return null;
  }
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) return null;
  if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;
  if (typeof claims.email !== "string" || claims.email.length === 0) return null;
  // Never trust an address Google itself hasn't verified — it would let
  // someone log into another person's Helagi account.
  if (claims.email_verified !== true) return null;

  return { sub: claims.sub, email: claims.email };
}
