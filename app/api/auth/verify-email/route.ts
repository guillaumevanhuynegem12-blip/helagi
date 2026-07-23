import { confirmSignup, createSession } from "@/lib/auth";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  TERMS_REQUIRED_ERROR,
  getTermsAcceptance,
  isSameOrigin,
} from "@/lib/security";

// Step 2 of registration: check the 6-digit code emailed by /api/auth/register.
// The right code creates the account and logs the visitor in. Responses with
// `expired: true` mean the signup must be restarted from step 1.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  // Terms gate: acceptance was already required at step 1 (/api/auth/register),
  // but the account is only created HERE — so re-check, and copy the
  // acceptance record onto the new user as durable proof.
  const terms = getTermsAcceptance(req);
  if (!terms) {
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

  let email: unknown, code: unknown;
  try {
    const body = await req.json();
    email = body?.email;
    code = body?.code;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code.trim())
  ) {
    return Response.json(
      { error: "Please enter the 6-digit code from the email." },
      { status: 400 },
    );
  }

  try {
    const result = await confirmSignup(email, code.trim(), terms);
    if ("error" in result) {
      return Response.json(
        { error: result.error, expired: result.expired === true },
        { status: 400 },
      );
    }
    await createSession(result.user);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[auth/verify-email] failed:", err);
    return Response.json(
      { error: "Something went wrong verifying your email. Please try again." },
      { status: 500 },
    );
  }
}
