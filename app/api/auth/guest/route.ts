import { ensureGuestSession } from "@/lib/auth";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  TERMS_REQUIRED_ERROR,
  getTermsAcceptance,
  isSameOrigin,
} from "@/lib/security";

// "Continue as guest": hands out an anonymous session ID (httpOnly cookie) so
// activity can be associated with one session without an account. Idempotent —
// repeat calls keep the existing guest ID.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  // Server-side terms gate: no session of any kind without accepting the
  // Terms of Use first (the client gates too, but can't be trusted).
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

  try {
    await ensureGuestSession();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[auth/guest] failed:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
