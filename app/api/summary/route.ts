import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  TERMS_REQUIRED_ERROR,
  getTermsAcceptance,
  isSameOrigin,
} from "@/lib/security";

// Generates the printable "Make PDF" document (doctor handover, exercise plan,
// or health plan) from the conversation. Shares the same per-IP rate limits as
// /api/chat; the API key never reaches the browser.
//
// Constructed lazily for the same reason as in app/api/chat/route.ts: a
// top-level `new Anthropic()` would make `next build` fail without keys.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  return client;
}

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1200;
const MAX_TOTAL_CHARS = 40_000;
const MAX_MESSAGES = 200;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUMMARY_SYSTEM = `You turn a conversation between a user and Helagi (a medical AI assistant) into a printable document. First decide which document type fits the conversation, then produce it.

TYPE A — Doctor handover (the conversation is about symptoms, a condition, an injury, or a medical case):
# Summary for your doctor
## Reason for visit
## Reported symptoms & answers
## Most likely cause (AI suggestion — not a diagnosis)
## Urgency assessment
## Red flags to rule out
## Suggested points to discuss with the doctor

TYPE B — Exercise plan (the conversation built or discussed a training/exercise program):
# Your exercise plan
## Goal & profile
## Weekly schedule
## Warm-up & cool-down
## How to progress
## Nutrition tips
## Safety notes

TYPE C — Health/nutrition plan (diet, weight management, or another health plan without a training focus):
# Your health plan
## Goal & profile
## The plan
## Practical tips
## Safety notes

Rules:
- Pick exactly ONE type. If the conversation contains both a medical case and a plan, choose the type matching the user's most recent focus.
- The first line of your output must be the "# " title of the chosen type.
- Write in the same language the user used in the conversation.
- Be strictly factual: include only what the conversation actually says. Never invent symptoms, answers, exercises, or numbers.
- Skip a "## " section entirely if the conversation contains nothing for it.
- Under each heading use short "- " bullet points. "**bold**" is allowed. No tables, no other markdown.
- Keep it under 450 words.
- Mention ICD-11 codes only if they appeared in the conversation.
- No preamble, no closing text, nothing outside the structure.
- If the conversation contains too little content to build a document, output exactly: NOT_ENOUGH_INFO`;

type IncomingMessage = { role: "user" | "assistant"; content: string };

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

  // Terms gate: same server-side backstop as /api/chat — the summary also
  // sends conversation content to the AI provider.
  if (!getTermsAcceptance(req)) {
    return Response.json({ error: TERMS_REQUIRED_ERROR }, { status: 403 });
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

  let messages: IncomingMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    !messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
  ) {
    return Response.json(
      { error: "Body must be { messages: {role, content}[] }." },
      { status: 400 },
    );
  }

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return Response.json(
      { error: "This conversation is too large to summarize." },
      { status: 413 },
    );
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Patient" : "Helagi"}: ${m.content}`)
    .join("\n\n");

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SUMMARY_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Here is the conversation to summarize:\n\n${transcript}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text || text.includes("NOT_ENOUGH_INFO")) {
      return Response.json(
        {
          error:
            "There isn't enough medical information in this chat to build a summary yet.",
        },
        { status: 422 },
      );
    }

    // The summary contains health details — never let it be cached.
    return Response.json(
      { summary: text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[summary] failed:", err);
    const msg =
      err instanceof Anthropic.APIError
        ? `Model error (${err.status}).`
        : "Failed to generate the summary.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
