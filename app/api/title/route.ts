import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// Names a conversation: given the first user message (and the assistant's
// first reply, for context), returns a short human title like "Knee pain when
// running". Called once per new conversation by the chat UI; the truncated
// first message stays as the fallback if this fails, so errors here are never
// user-visible. Uses Haiku — titles are tiny and latency matters more than
// depth. Shares the same per-IP rate limits as /api/chat.
//
// Constructed lazily for the same reason as in app/api/chat/route.ts: a
// top-level `new Anthropic()` would make `next build` fail without keys.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  return client;
}

const MODEL = "claude-haiku-4-5-20251001";
const MAX_INPUT_CHARS = 4000;
const MAX_TITLE_CHARS = 60;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TITLE_SYSTEM = `You name conversations for Helagi, a medical AI assistant. You are given the user's first message and possibly the assistant's reply.

Output ONLY a title for the conversation:
- 2 to 5 words, in the same language the user wrote in.
- Describe the topic ("Headache and fever", "Knee pain when running").
- No quotes, no trailing punctuation, no emoji, no explanations.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Server is not configured (missing ANTHROPIC_API_KEY)." },
      { status: 500 },
    );
  }

  // Block other websites from spending our tokens via visitors' browsers.
  if (!isSameOrigin(req)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  const verdict = await checkRateLimit(getClientIp(req));
  if (!verdict.ok) {
    return Response.json(
      { error: verdict.message },
      {
        status: 429,
        headers: { "Retry-After": String(verdict.retryAfterSeconds ?? 60) },
      },
    );
  }

  let user: unknown, assistant: unknown;
  try {
    const body = await req.json();
    user = body?.user;
    assistant = body?.assistant;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof user !== "string" || user.trim().length === 0) {
    return Response.json(
      { error: "Body must be { user: string, assistant?: string }." },
      { status: 400 },
    );
  }

  const userText = user.slice(0, MAX_INPUT_CHARS);
  const assistantText =
    typeof assistant === "string" ? assistant.slice(0, MAX_INPUT_CHARS) : "";

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 30,
      system: TITLE_SYSTEM,
      messages: [
        {
          role: "user",
          content:
            `User's first message:\n${userText}` +
            (assistantText ? `\n\nAssistant's reply:\n${assistantText}` : ""),
        },
      ],
    });

    const title = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      // Models occasionally wrap titles in quotes or end them with a period
      // despite instructions — strip both.
      .replace(/["'«»„“”]/g, "")
      .replace(/\s+/g, " ")
      .replace(/[.。]$/u, "")
      .trim()
      .slice(0, MAX_TITLE_CHARS);

    if (!title) {
      return Response.json({ error: "No title produced." }, { status: 502 });
    }

    // Titles can hint at health details — never let them be cached.
    return Response.json(
      { title },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[title] failed:", err);
    const msg =
      err instanceof Anthropic.APIError
        ? `Model error (${err.status}).`
        : "Failed to generate a title.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
