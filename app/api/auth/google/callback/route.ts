import { cookies } from "next/headers";
import { createSession, findOrCreateGoogleUser } from "@/lib/auth";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  GOOGLE_STATE_COOKIE,
  exchangeGoogleCode,
  getBaseUrl,
  getGoogleRedirectUri,
  isGoogleConfigured,
} from "@/lib/googleAuth";
import { getTermsAcceptance } from "@/lib/security";

// Step 2 of "Sign in with Google": Google sends the visitor back here with a
// one-time code. Verify the state cookie (CSRF), exchange the code for the
// verified email, and log the visitor in with a normal session. Any failure
// lands on the login page with a friendly error rather than a broken screen.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const base = getBaseUrl(req);
  const fail = () => Response.redirect(new URL("/login?error=google", base), 302);

  if (!isGoogleConfigured()) return fail();

  const jar = await cookies();
  const expectedState = jar.get(GOOGLE_STATE_COOKIE)?.value;
  jar.delete(GOOGLE_STATE_COOKIE); // single use, success or not

  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  // Covers "visitor clicked Cancel on Google" (error param, no code) too.
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail();
  }

  const verdict = await checkAuthRateLimit(getClientIp(req));
  if (!verdict.ok) return fail();

  // Terms gate: the start route already required acceptance, but the session
  // is only created HERE — re-check, and copy the acceptance record onto a
  // newly created account as durable proof.
  const terms = getTermsAcceptance(req);
  if (!terms) {
    return Response.redirect(new URL("/login?error=terms", base), 302);
  }

  try {
    const profile = await exchangeGoogleCode(code, getGoogleRedirectUri(req));
    if (!profile) return fail();
    const user = await findOrCreateGoogleUser(profile.email, profile.sub, terms);
    await createSession(user);
    return Response.redirect(new URL("/chat", base), 302);
  } catch (err) {
    console.error("[auth/google] callback failed:", err);
    return fail();
  }
}
