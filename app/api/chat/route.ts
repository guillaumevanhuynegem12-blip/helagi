import Anthropic from "@anthropic-ai/sdk";
import { searchIcd } from "@/lib/icd";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// The Claude call happens ONLY here, on the server. Both the Anthropic key and
// the WHO ICD credentials are read from server-side env vars and never reach
// the browser.
//
// Constructed lazily (inside POST) rather than at module level: the SDK throws
// without ANTHROPIC_API_KEY, and `next build` evaluates route modules — so a
// top-level `new Anthropic()` would break builds on machines without keys.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  return client;
}

// ── Cost & abuse protection knobs ───────────────────────────────────────────
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2500; // cap on response length per turn (clinical differentials and exercise programs need the headroom)
const MAX_TOOL_TURNS = 4; // safety cap on the tool-use loop
const MAX_HISTORY_MESSAGES = 24; // only the most recent turns are sent to the model
const MAX_MESSAGE_CHARS = 4000; // per-message input cap (mirrors the UI limit)
const MAX_TOTAL_CHARS = 40_000; // whole-payload cap against absurd pastes
const MAX_MESSAGES = 200; // cap on the number of entries in the history array
const MAX_TOOL_QUERY_CHARS = 200; // cap on the ICD search term the model sends
// Per-IP request limits (10/min, 50/day) live in lib/rateLimit.ts.
// ────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = SYSTEM_PROMPT;

const tools: Anthropic.Tool[] = [
  {
    name: "search_icd",
    description:
      "Search the WHO ICD-11 classification for official disease/condition names and their ICD-11 codes. Call this whenever the user asks about a disease, symptom, condition, or diagnosis, so you can ground your answer in authoritative WHO terminology and cite the correct ICD-11 code. Returns up to 8 matching entries, each with its code and title.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The condition, symptom, or disease term to look up, e.g. 'type 2 diabetes'.",
        },
      },
      required: ["query"],
    },
  },
];

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

  // Per-IP rate limiting (burst + daily) — the main cost shield.
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

  // Input guards: reject absurdly long messages/payloads before touching the API.
  const newestMessage = messages[messages.length - 1];
  if (newestMessage.content.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      {
        error: `Your message is too long (max ${MAX_MESSAGE_CHARS.toLocaleString()} characters). Please shorten it.`,
      },
      { status: 413 },
    );
  }
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return Response.json(
      {
        error:
          "This conversation has grown too large. Please start a new chat.",
      },
      { status: 413 },
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The model can occasionally spend every turn on tool calls (or stop
      // without emitting text), which would stream nothing and leave the user
      // staring at an empty bubble. Track streamed text so we can fall back.
      let streamedChars = 0;
      // Last character streamed to the browser. Text from consecutive tool
      // turns would otherwise be glued together ("…your situation.## What
      // this most likely is"), which breaks markdown headings — they only
      // render at the start of a line.
      let tailChar = "";
      try {
        let recent = messages.slice(-MAX_HISTORY_MESSAGES);
        // The API requires the first message to be a user turn; if trimming cut
        // mid-conversation, drop leading assistant messages.
        while (recent.length > 0 && recent[0].role !== "user") {
          recent = recent.slice(1);
        }
        const convo: Anthropic.MessageParam[] = recent.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Agentic loop: stream text, run any tool calls, repeat until the model
        // finishes without requesting another tool.
        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const stream = getClient().messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM,
            tools,
            messages: convo,
          });

          // Stream the assistant's text to the browser as it arrives.
          let turnHasText = false;
          stream.on("text", (delta) => {
            if (delta.length === 0) return;
            // The model resumed after a tool call: if the previous turn's
            // text didn't end its line, force a paragraph break so markdown
            // starting this turn (e.g. "## Heading") renders correctly.
            if (!turnHasText && streamedChars > 0 && tailChar !== "\n") {
              controller.enqueue(encoder.encode("\n\n"));
              tailChar = "\n";
            }
            turnHasText = true;
            streamedChars += delta.length;
            tailChar = delta[delta.length - 1];
            controller.enqueue(encoder.encode(delta));
          });

          const final = await stream.finalMessage();

          if (final.stop_reason !== "tool_use") break;

          // Preserve the assistant turn (text + tool_use blocks), then run tools.
          convo.push({ role: "assistant", content: final.content });

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            let resultText: string;
            let isError = false;
            try {
              if (tu.name === "search_icd") {
                const query = String(
                  (tu.input as { query?: unknown })?.query ?? "",
                ).slice(0, MAX_TOOL_QUERY_CHARS);
                const items = await searchIcd(query);
                resultText = items.length
                  ? items
                      .map((r) => `${r.code || "(no code)"} — ${r.title}`)
                      .join("\n")
                  : "No ICD-11 matches found for that term.";
              } else {
                resultText = `Unknown tool: ${tu.name}`;
                isError = true;
              }
            } catch (e) {
              // Graceful degradation: tell the model the lookup failed so it
              // can answer from general knowledge without inventing a code.
              // Details stay in the server log — WHO error bodies must not
              // travel toward the client.
              console.error("[chat] search_icd failed:", e);
              resultText =
                "ICD lookup unavailable. Answer from general medical knowledge and do not cite a specific ICD-11 code.";
              isError = true;
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: resultText,
              is_error: isError,
            });
          }

          convo.push({ role: "user", content: toolResults });
        }

        if (streamedChars === 0) {
          console.error(
            "[chat] model produced no text (tool-only turns or empty reply) — sending fallback",
          );
          controller.enqueue(
            encoder.encode(
              "Sorry, something went wrong and I couldn't produce an answer. Please send your message again.",
            ),
          );
        }
      } catch (err) {
        // Keep the details server-side; the raw API message can reveal
        // account/billing state to visitors.
        console.error("[chat] stream failed:", err);
        const msg =
          err instanceof Anthropic.APIError
            ? `Error: the model request failed (${err.status}). Please try again.`
            : "Error: failed to reach the model.";
        controller.enqueue(encoder.encode(`\n\n[${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
