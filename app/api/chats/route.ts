import { getIdentity } from "@/lib/auth";
import { loadChats, saveChats, sanitizeConversations, MAX_TOTAL_CHARS } from "@/lib/chatStore";
import { isSameOrigin } from "@/lib/security";

// Chat history for logged-in accounts: GET returns your conversations, PUT
// replaces them. The user ID comes from the session cookie — the client never
// says whose history it wants, so accounts are isolated by construction.
// Guests get 401: their chats intentionally never touch the server.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getIdentity();
  if (identity?.type !== "user") {
    return Response.json({ error: "Sign in to sync chats." }, { status: 401 });
  }
  try {
    return Response.json({ conversations: await loadChats(identity.id) });
  } catch (err) {
    console.error("[chats] load failed:", err);
    return Response.json({ error: "Could not load your chats." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  const identity = await getIdentity();
  if (identity?.type !== "user") {
    return Response.json({ error: "Sign in to sync chats." }, { status: 401 });
  }

  // Cheap pre-check before parsing; sanitizeConversations enforces the real cap.
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_TOTAL_CHARS * 2) {
    return Response.json({ error: "Chat history too large." }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = (await req.json())?.conversations;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    await saveChats(identity.id, sanitizeConversations(raw));
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[chats] save failed:", err);
    return Response.json({ error: "Could not save your chats." }, { status: 500 });
  }
}
