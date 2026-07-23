import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  GOOGLE_STATE_COOKIE,
  buildGoogleAuthUrl,
  getBaseUrl,
  getGoogleRedirectUri,
  isGoogleConfigured,
} from "@/lib/googleAuth";
import { getTermsAcceptance } from "@/lib/security";

// Step 1 of "Sign in with Google": remember a random state token in a
// short-lived cookie, then send the visitor to Google's consent screen.
// The callback route (./callback) finishes the flow.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isGoogleConfigured()) {
    return Response.redirect(new URL("/login?error=google", getBaseUrl(req)), 302);
  }

  // Terms gate: this is a top-level navigation, so redirect back to the login
  // page (which shows the message and the consent banner) instead of JSON.
  if (!getTermsAcceptance(req)) {
    return Response.redirect(new URL("/login?error=terms", getBaseUrl(req)), 302);
  }

  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax", // must survive the top-level redirect back from Google
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // the round trip to Google should take minutes, not more
  });

  return Response.redirect(buildGoogleAuthUrl(getGoogleRedirectUri(req), state), 302);
}
