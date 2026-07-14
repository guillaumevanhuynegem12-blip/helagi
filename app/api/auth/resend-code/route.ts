import { resendSignupCode } from "@/lib/auth";
import { sendEmail, verificationCodeEmail } from "@/lib/email";
import { validateEmail } from "@/lib/validation";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// Emails a fresh verification code for an in-progress signup (the previous
// code stops working). Only meaningful while the pending-signup record from
// /api/auth/register still exists — afterwards the visitor must start over.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
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

  let email: unknown;
  try {
    email = (await req.json())?.email;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const emailError = validateEmail(email);
  if (emailError) return Response.json({ error: emailError }, { status: 400 });

  try {
    const result = await resendSignupCode(email as string);
    if ("error" in result) {
      return Response.json(
        { error: result.error, expired: true },
        { status: 400 },
      );
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
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[auth/resend-code] failed:", err);
    return Response.json(
      { error: "Something went wrong sending a new code. Please try again." },
      { status: 500 },
    );
  }
}
