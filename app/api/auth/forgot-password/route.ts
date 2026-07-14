import { createPasswordReset } from "@/lib/auth";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/googleAuth";
import { validateEmail } from "@/lib/validation";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// "Forgot password": emails a single-use reset link (valid 30 minutes).
//
// ANTI-ENUMERATION: this endpoint answers { ok: true } whether or not an
// account exists for the address — otherwise it would be a free oracle for
// probing which emails have Helagi accounts. Failures after the lookup are
// only logged, never surfaced, for the same reason.

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

  // Shape-only check — rejecting malformed input reveals nothing about
  // which addresses have accounts.
  const emailError = validateEmail(email);
  if (emailError) return Response.json({ error: emailError }, { status: 400 });

  try {
    const token = await createPasswordReset(email as string);
    if (token) {
      const link = `${getBaseUrl(req)}/reset-password?token=${token}`;
      const sent = await sendEmail(
        (email as string).trim().toLowerCase(),
        passwordResetEmail(link),
      );
      if (!sent) console.error("[auth/forgot-password] email send failed");
    }
  } catch (err) {
    console.error("[auth/forgot-password] failed:", err);
  }

  return Response.json({ ok: true });
}
