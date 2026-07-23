import { Redis } from "@upstash/redis";
import { getIdentity } from "@/lib/auth";
import { checkAuthRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/security";

// End-of-session feedback survey (see components/SurveyModal.tsx). Responses
// land in the same Upstash Redis as analytics:
// - survey:responses          — capped list of full responses (newest first)
// - survey:ratings:{day}      — daily counters per rating, for trends
// - survey:answered:{day}     — daily counters for "did you get your answer"
// - survey:purpose:{day}      — daily counters for what the visit was for
// - survey:again:{day}        — daily counters for "would you use it again"
//
// Privacy: no consent gate is needed — submitting a survey is itself the
// consent. But like analytics, responses are stored WITHOUT any identifier
// that could join them back to an account: only a coarse "account or guest"
// flag. Free-text answers are capped and the form asks people not to include
// personal or medical details.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasUpstash ? Redis.fromEnv() : null;

const RETENTION_SECONDS = 90 * 24 * 60 * 60; // match analytics retention
const MAX_RESPONSES_KEPT = 2000;
const MAX_TEXT_CHARS = 500;

const ANSWERED_VALUES = ["yes", "partly", "no"] as const;
type Answered = (typeof ANSWERED_VALUES)[number];

const PURPOSE_VALUES = ["symptoms", "condition", "doctor_visit", "general"] as const;
type Purpose = (typeof PURPOSE_VALUES)[number];

const AGAIN_VALUES = ["yes", "maybe", "no"] as const;
type Again = (typeof AGAIN_VALUES)[number];

const REASON_VALUES = ["finished", "summary"] as const;
type Reason = (typeof REASON_VALUES)[number];

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_TEXT_CHARS);
}

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

  let purpose: unknown,
    rating: unknown,
    answered: unknown,
    again: unknown,
    liked: unknown,
    improve: unknown,
    reason: unknown,
    messageCount: unknown;
  try {
    const body = await req.json();
    purpose = body?.purpose;
    rating = body?.rating;
    answered = body?.answered;
    again = body?.again;
    liked = body?.liked;
    improve = body?.improve;
    reason = body?.reason;
    messageCount = body?.messageCount;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!PURPOSE_VALUES.includes(purpose as Purpose)) {
    return Response.json(
      { error: "Please tell us what you used Helagi for today." },
      { status: 400 },
    );
  }
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return Response.json(
      { error: "Please pick a rating from 1 to 5." },
      { status: 400 },
    );
  }
  if (!ANSWERED_VALUES.includes(answered as Answered)) {
    return Response.json(
      { error: "Please tell us whether you got the answer you needed." },
      { status: 400 },
    );
  }
  if (!AGAIN_VALUES.includes(again as Again)) {
    return Response.json(
      { error: "Please tell us whether you would use Helagi again." },
      { status: 400 },
    );
  }

  const identity = await getIdentity().catch(() => null);
  const response = {
    ts: new Date().toISOString(),
    purpose: purpose as Purpose,
    rating,
    answered: answered as Answered,
    again: again as Again,
    liked: cleanText(liked),
    improve: cleanText(improve),
    userType: identity?.type === "user" ? "account" : "guest",
    // Analysis context (no message content): why the survey appeared and how
    // long the conversation was. Optional and clamped — never trusted blindly.
    reason: REASON_VALUES.includes(reason as Reason) ? (reason as Reason) : null,
    messageCount:
      typeof messageCount === "number" && Number.isInteger(messageCount)
        ? Math.max(0, Math.min(messageCount, 1000))
        : null,
  };

  try {
    if (redis) {
      const day = response.ts.slice(0, 10);
      const pipeline = redis.pipeline();
      pipeline.lpush("survey:responses", JSON.stringify(response));
      pipeline.ltrim("survey:responses", 0, MAX_RESPONSES_KEPT - 1);
      pipeline.hincrby(`survey:ratings:${day}`, String(rating), 1);
      pipeline.expire(`survey:ratings:${day}`, RETENTION_SECONDS);
      pipeline.hincrby(`survey:answered:${day}`, response.answered, 1);
      pipeline.expire(`survey:answered:${day}`, RETENTION_SECONDS);
      pipeline.hincrby(`survey:purpose:${day}`, response.purpose, 1);
      pipeline.expire(`survey:purpose:${day}`, RETENTION_SECONDS);
      pipeline.hincrby(`survey:again:${day}`, response.again, 1);
      pipeline.expire(`survey:again:${day}`, RETENTION_SECONDS);
      await pipeline.exec();
    } else {
      // Local dev without Upstash — at least make the response visible.
      console.log("[survey] response (not stored, no Redis):", response);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[survey] store failed:", err);
    return Response.json(
      { error: "Something went wrong saving your feedback. Please try again." },
      { status: 500 },
    );
  }
}
