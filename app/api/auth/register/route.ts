import { beginSignup } from "@/lib/auth";
import { sendEmail, verificationCodeEmail } from "@/lib/email";
import { validateEmail, validatePassword } from "@/lib/validation";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  TERMS_REQUIRED_ERROR,
  getTermsAcceptance,
  isSameOrigin,
} from "@/lib/security";

// Step 1 of registration: validate email + password, then email a 6-digit
// verification code. No account (and no session) exists until the visitor
// confirms the code at /api/auth/verify-email.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  // Server-side terms gate: registration requires accepting the Terms of Use
  // first (the client gates too, but can't be trusted).
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

  let email: unknown, password: unknown;
  try {
    const body = await req.json();
    email = body?.email;
    password = body?.password;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Same checks the form runs client-side — repeated here because the client
  // can't be trusted.
  const emailError = validateEmail(email);
  if (emailError) return Response.json({ error: emailError }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  try {
    const result = await beginSignup(email as string, password as string);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 409 });
    }
    const sent = await sendEmail(
      (email as string).trim().toLowerCase(),
      verificationCodeEmail(result.code),
    );
    if (!sent) {
      return Response.json(
        { error: "We couldn't send the verification email. Please try again." },
        { status: 500 },
      );
    }
    // The form now switches to its "enter the code" step.
    return Response.json({ ok: true, verify: true });
  } catch (err) {
    console.error("[auth/register] failed:", err);
    return Response.json(
      { error: "Something went wrong creating your account. Please try again." },
      { status: 500 },
    );
  }
}
