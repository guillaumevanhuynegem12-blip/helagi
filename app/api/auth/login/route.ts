import { verifyCredentials, createSession } from "@/lib/auth";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// Login. Deliberately answers wrong-email and wrong-password identically
// ("Invalid email or password.") so the endpoint can't be used to probe which
// emails have accounts.

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

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return Response.json(
      { error: "Please enter your email and password." },
      { status: 400 },
    );
  }

  try {
    const user = await verifyCredentials(email, password);
    if (!user) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }
    await createSession(user);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[auth/login] failed:", err);
    return Response.json(
      { error: "Something went wrong signing you in. Please try again." },
      { status: 500 },
    );
  }
}
