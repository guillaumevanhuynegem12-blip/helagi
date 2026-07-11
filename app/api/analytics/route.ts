import { Redis } from "@upstash/redis";
import { isSameOrigin } from "@/lib/security";
import { CONSENT_COOKIE } from "@/lib/consent";
import { SESSION_COOKIE, GUEST_COOKIE } from "@/lib/auth";
import { createHash } from "crypto";

// First-party, privacy-conscious analytics sink. Counters live in the same
// Upstash Redis that backs rate limiting; there are no third-party tools.
//
// Consent is enforced HERE, server-side, on every event: no analytics cookie
// consent → the event is discarded. This holds even if client code forgets to
// check.
//
// What gets stored:
// - daily event counters (event name → count)
// - daily coarse device info ("Chrome on Windows" → count) from the UA header
// - session-duration totals for averaging
// - a capped list of recent events (event, pseudonymous session id, path)
// - a capped list of recent client-reported errors
// What is deliberately NOT stored: IP addresses, emails, message text, or any
// free-text values (props are dropped unless they're short scalars).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasUpstash ? Redis.fromEnv() : null;

const RETENTION_SECONDS = 90 * 24 * 60 * 60; // keep daily counters ~90 days
const MAX_BODY_BYTES = 2048;
const EVENT_NAME_RE = /^[a-z][a-z0-9_]{0,39}$/i;

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split("; ")) {
    const eq = part.indexOf("=");
    if (eq > 0) out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

function hasAnalyticsConsent(cookies: Record<string, string>): boolean {
  const raw = cookies[CONSENT_COOKIE];
  if (!raw) return false;
  try {
    const consent = JSON.parse(decodeURIComponent(raw)) as {
      analytics?: unknown;
    };
    return consent.analytics === true;
  } catch {
    return false;
  }
}

// Pseudonymous per-session ID for event correlation. Guests already have a
// random ID; for logged-in users we hash the session token instead of looking
// up the account, so analytics data can't be joined back to an email.
function sessionIdFrom(cookies: Record<string, string>): string {
  const guest = cookies[GUEST_COOKIE];
  if (guest && /^g_[0-9a-f]{24}$/.test(guest)) return guest;
  const token = cookies[SESSION_COOKIE];
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    return "s_" + createHash("sha256").update(token).digest("hex").slice(0, 16);
  }
  return "anon";
}

// Coarse-only device info — enough for "what do people use", nothing more.
function coarseUserAgent(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Other";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Other";
  return `${browser} on ${os}`;
}

// Keep only short scalar props — a hard backstop against free text (and thus
// medical content) ending up in analytics, whatever the caller sends.
function sanitizeProps(raw: unknown): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  if (typeof raw !== "object" || raw === null) return clean;
  let kept = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (kept >= 8) break;
    if (!/^[a-z][a-z0-9_]{0,29}$/i.test(key)) continue;
    if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) {
      clean[key] = value;
      kept++;
    } else if (typeof value === "string" && value.length <= 80) {
      clean[key] = value;
      kept++;
    }
  }
  return clean;
}

export async function POST(req: Request) {
  // Always answer 204: analytics is fire-and-forget and must never surface
  // errors or information to the client.
  const done = () => new Response(null, { status: 204 });

  try {
    if (!isSameOrigin(req)) return new Response(null, { status: 403 });

    const cookies = parseCookies(req.headers.get("cookie"));
    if (!redis || !hasAnalyticsConsent(cookies)) return done();

    const raw = await req.text();
    if (!raw || raw.length > MAX_BODY_BYTES) return done();

    const body = JSON.parse(raw) as {
      event?: unknown;
      props?: unknown;
      path?: unknown;
    };
    const event = typeof body.event === "string" ? body.event : "";
    if (!EVENT_NAME_RE.test(event)) return done();

    const props = sanitizeProps(body.props);
    const path =
      typeof body.path === "string" && /^\/[a-z0-9\-/_]{0,60}$/i.test(body.path)
        ? body.path
        : "";
    const day = new Date().toISOString().slice(0, 10);
    const ua = coarseUserAgent(req.headers.get("user-agent") ?? "");
    const sessionId = sessionIdFrom(cookies);

    const pipeline = redis.pipeline();
    pipeline.hincrby(`analytics:events:${day}`, event, 1);
    pipeline.expire(`analytics:events:${day}`, RETENTION_SECONDS);
    pipeline.hincrby(`analytics:device:${day}`, ua, 1);
    pipeline.expire(`analytics:device:${day}`, RETENTION_SECONDS);

    // Session duration: totals per day so averages can be computed later.
    if (event === "session_end" && typeof props.durationMs === "number") {
      const ms = Math.max(0, Math.min(props.durationMs, 24 * 60 * 60 * 1000));
      pipeline.hincrby(`analytics:duration:${day}`, "total_ms", Math.round(ms));
      pipeline.hincrby(`analytics:duration:${day}`, "count", 1);
      pipeline.expire(`analytics:duration:${day}`, RETENTION_SECONDS);
    }

    // Recent-events ring buffer (pseudonymous), for eyeballing user journeys.
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      sessionId,
      path,
      props,
    });
    pipeline.lpush("analytics:recent", entry);
    pipeline.ltrim("analytics:recent", 0, 499);

    // Errors get their own ring buffer so failures are easy to spot.
    if (event.endsWith("_error")) {
      pipeline.lpush("analytics:recent_errors", entry);
      pipeline.ltrim("analytics:recent_errors", 0, 199);
    }

    await pipeline.exec();
    return done();
  } catch (err) {
    console.error("[analytics] failed:", err);
    return done();
  }
}
