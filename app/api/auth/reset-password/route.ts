import { resetPassword, createSession } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  TERMS_REQUIRED_ERROR,
  getTermsAcceptance,
  isSameOrigin,
} from "@/lib/security";

// Completes a password reset: the emailed token proves email ownership, the
// new password replaces the old one, and the visitor is logged straight in.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  // Terms gate: completing a reset logs the visitor straight in, so it is a
  // session-creating path like login and must require acceptance too.
  if (!getTermsAcceptance(req)) {
    return Response.json({ error: TERMS_REQUIRED_ERROR }, { status: 403 });
  }

  const verdict = await checkAuthRateLimit(getClientIp(req));
  if (!verdict.ok) {
    return Response.json(
      { error: verdict.message },
      {
        status: 429,
        headers: { "Retry-After": String(verdict.retryAfterSeconds ?? 60) },
      },
    );
  }

  let token: unknown, password: unknown;
  try {
    const body = await req.json();
    token = body?.token;
    password = body?.password;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof token !== "string" || token.length === 0) {
    return Response.json(
      {
        error:
          "This password reset link is invalid or has expired. Please request a new one.",
      },
      { status: 400 },
    );
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  try {
    const result = await resetPassword(token, password as string);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    await createSession(result.user);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset-password] failed:", err);
    return Response.json(
      { error: "Something went wrong resetting your password. Please try again." },
      { status: 500 },
    );
  }
}
