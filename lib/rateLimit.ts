import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Tune your abuse/cost limits here ────────────────────────────────────────
export const REQUESTS_PER_MINUTE = 10; // burst limit per IP (chat/summary)
export const REQUESTS_PER_DAY = 50; // daily cap per IP (chat/summary)
export const AUTH_REQUESTS_PER_MINUTE = 5; // login/register/guest attempts per IP
// ────────────────────────────────────────────────────────────────────────────

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazily constructed so the app still runs locally without Upstash configured.
let minuteLimiter: Ratelimit | null = null;
let dayLimiter: Ratelimit | null = null;
let authLimiter: Ratelimit | null = null;

if (hasUpstash) {
  const redis = Redis.fromEnv();
  minuteLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(REQUESTS_PER_MINUTE, "1 m"),
    prefix: "helagi:rl:minute",
  });
  dayLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(REQUESTS_PER_DAY, "1 d"),
    prefix: "helagi:rl:day",
  });
  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AUTH_REQUESTS_PER_MINUTE, "1 m"),
    prefix: "helagi:rl:auth",
  });
}

export interface RateLimitVerdict {
  ok: boolean;
  message?: string;
  retryAfterSeconds?: number;
}

// Checks both windows for the given IP. If Upstash is not configured, allows
// the request but warns loudly — do NOT ship to production in that state.
export async function checkRateLimit(ip: string): Promise<RateLimitVerdict> {
  if (!minuteLimiter || !dayLimiter) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED. " +
        "Configure Upstash before deploying publicly.",
    );
    return { ok: true };
  }

  try {
    const minute = await minuteLimiter.limit(ip);
    if (!minute.success) {
      return {
        ok: false,
        message:
          "You're sending messages too fast. Please wait a moment and try again.",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((minute.reset - Date.now()) / 1000),
        ),
      };
    }

    const day = await dayLimiter.limit(ip);
    if (!day.success) {
      return {
        ok: false,
        message:
          "You've reached today's message limit. Please come back tomorrow.",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((day.reset - Date.now()) / 1000),
        ),
      };
    }

    return { ok: true };
  } catch (err) {
    // Redis unreachable → fail CLOSED: an Upstash outage must not turn into an
    // unlimited free-for-all on the Anthropic key. (Trade-off: the chat is
    // unavailable while Redis is down; that beats an unbounded API bill.)
    console.error("[rate-limit] Upstash error — failing closed:", err);
    return {
      ok: false,
      message:
        "The assistant is very busy right now. Please try again in a moment.",
      retryAfterSeconds: 30,
    };
  }
}

// Stricter limiter for the auth endpoints: slows down credential stuffing and
// signup spam. Same fail-closed policy as the chat limiter.
export async function checkAuthRateLimit(ip: string): Promise<RateLimitVerdict> {
  if (!authLimiter) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — auth rate limiting is DISABLED. " +
        "Configure Upstash before deploying publicly.",
    );
    return { ok: true };
  }

  try {
    const attempt = await authLimiter.limit(ip);
    if (!attempt.success) {
      return {
        ok: false,
        message: "Too many attempts. Please wait a minute and try again.",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((attempt.reset - Date.now()) / 1000),
        ),
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("[rate-limit] Upstash error — failing closed:", err);
    return {
      ok: false,
      message: "Sign-in is very busy right now. Please try again in a moment.",
      retryAfterSeconds: 30,
    };
  }
}

// Best-effort client IP extraction. On Vercel, x-forwarded-for is set by the
// platform and the first entry is the real client.
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
