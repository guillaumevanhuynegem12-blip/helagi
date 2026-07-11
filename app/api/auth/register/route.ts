import { registerUser, createSession } from "@/lib/auth";
import { validateEmail, validatePassword } from "@/lib/validation";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// Account registration: email + password only (no personal or medical data).
// On success the user is logged in immediately (session cookie set).

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
    const result = await registerUser(email as string, password as string);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 409 });
    }
    await createSession(result.user);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[auth/register] failed:", err);
    return Response.json(
      { error: "Something went wrong creating your account. Please try again." },
      { status: 500 },
    );
  }
}
