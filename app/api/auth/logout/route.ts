import { destroySession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";

// Logout: deletes the server-side session and clears the identity cookies
// (both the account session and any guest ID).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  try {
    await destroySession();
  } catch (err) {
    // Even if the store hiccups, still clear cookies client-side by finishing
    // normally — destroySession clears cookies before/regardless of Redis.
    console.error("[auth/logout] failed:", err);
  }
  return Response.json({ ok: true });
}
