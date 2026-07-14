import { getIdentity, deleteUserAccount, destroySession } from "@/lib/auth";
import { deleteChats } from "@/lib/chatStore";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// Permanent account deletion (settings page). Removes the chat history and
// the user record, then ends the current session. Sessions on other devices
// die on their own next request — getIdentity() requires the user record to
// still exist.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
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

  const identity = await getIdentity();
  if (identity?.type !== "user") {
    return Response.json(
      { error: "Sign in to delete an account." },
      { status: 401 },
    );
  }

  try {
    // Chats first: if anything fails midway, the account still exists and
    // deletion can simply be retried. The user record goes second — from that
    // moment every session is dead — and the local cookies are cleared last.
    await deleteChats(identity.id);
    await deleteUserAccount(identity.email);
    await destroySession();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[account] delete failed:", err);
    return Response.json(
      { error: "Something went wrong deleting your account. Please try again." },
      { status: 500 },
    );
  }
}
