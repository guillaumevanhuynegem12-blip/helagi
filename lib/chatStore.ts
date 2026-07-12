// Server-side chat history — for logged-in accounts ONLY.
//
// Each account's conversations are stored under its own permanent user ID
// (`chats:u_…`), so history follows the account across devices and browsers,
// and no account can ever read another account's chats: the key is derived
// from the session cookie server-side, never from anything the client sends.
//
// Guests are deliberately NOT stored here: their chats live only in the
// browser tab's memory and vanish when they leave — that is the product
// promise for guest mode.
//
// Everything the client uploads is re-validated and size-capped here, because
// the payload is attacker-controllable (it's an authenticated POST body).

import type { Conversation, Message, Role } from "@/lib/types";
import { storeGet, storeSet } from "@/lib/auth";

const chatsKey = (userId: string) => `chats:${userId}`;

// Caps keep one account from filling Redis: at most this many conversations
// (newest first — the UI prepends new chats), and the serialized whole must
// stay under MAX_TOTAL_CHARS (oldest conversations are dropped first).
export const MAX_CONVERSATIONS = 30;
export const MAX_TOTAL_CHARS = 400_000;
const MAX_TITLE_CHARS = 80;
const MAX_MESSAGE_CHARS = 40_000;
const MAX_MESSAGES_PER_CONVERSATION = 200;

const isRole = (v: unknown): v is Role => v === "user" || v === "assistant";

function sanitizeMessage(raw: unknown): Message | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.id !== "string" || !isRole(m.role) || typeof m.content !== "string") {
    return null;
  }
  return {
    id: m.id.slice(0, 64),
    role: m.role,
    content: m.content.slice(0, MAX_MESSAGE_CHARS),
  };
}

function sanitizeConversation(raw: unknown): Conversation | null {
  if (typeof raw !== "object" || raw === null) return null;
  const c = raw as Record<string, unknown>;
  if (
    typeof c.id !== "string" ||
    typeof c.title !== "string" ||
    !Array.isArray(c.messages)
  ) {
    return null;
  }
  const messages = c.messages
    .slice(0, MAX_MESSAGES_PER_CONVERSATION)
    .map(sanitizeMessage)
    .filter((m): m is Message => m !== null);
  return {
    id: c.id.slice(0, 64),
    title: c.title.slice(0, MAX_TITLE_CHARS),
    messages,
  };
}

// Turns an untrusted payload into a clean, capped Conversation[] (never
// throws — junk entries are simply dropped).
export function sanitizeConversations(raw: unknown): Conversation[] {
  if (!Array.isArray(raw)) return [];
  const conversations = raw
    .slice(0, MAX_CONVERSATIONS)
    .map(sanitizeConversation)
    .filter((c): c is Conversation => c !== null);
  // Enforce the total-size cap by dropping from the end (oldest chats — the
  // UI keeps the list newest-first).
  while (
    conversations.length > 0 &&
    JSON.stringify(conversations).length > MAX_TOTAL_CHARS
  ) {
    conversations.pop();
  }
  return conversations;
}

export async function loadChats(userId: string): Promise<Conversation[]> {
  return (await storeGet<Conversation[]>(chatsKey(userId))) ?? [];
}

// History is part of the account, so like the account it has no TTL.
export async function saveChats(
  userId: string,
  conversations: Conversation[],
): Promise<void> {
  await storeSet(chatsKey(userId), conversations);
}
