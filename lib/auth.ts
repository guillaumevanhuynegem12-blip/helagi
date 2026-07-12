// Server-only authentication: email+password accounts, opaque session tokens,
// and anonymous guest sessions.
//
// Storage reuses the project's existing Upstash Redis instance (the same one
// that backs rate limiting), so auth needs no new services or env vars. If
// Upstash is not configured, a process-local in-memory store keeps local dev
// working — accounts and sessions then vanish on restart and the server logs
// a loud warning. Never deploy publicly in that state.
//
// Security model:
// - Passwords are hashed with Node's built-in scrypt (random 16-byte salt per
//   user, constant-time comparison). Only the salted hash is stored.
// - Sessions are 32-byte random tokens stored server-side with a sliding
//   30-day TTL ("persistent login"). The browser holds only the opaque token
//   in an httpOnly cookie, so neither passwords nor durable secrets are ever
//   readable by client-side JavaScript.
// - Guests get a random anonymous ID in an httpOnly cookie — enough to
//   associate activity with one session without an account.
//
// NOTE: cookie WRITES (createSession, destroySession, ensureGuestSession) are
// only legal inside Route Handlers / Server Actions. getIdentity() is
// read-only and safe to call from Server Components too.

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { Redis } from "@upstash/redis";

const scrypt = promisify(scryptCb);

export const SESSION_COOKIE = "helagi_session";
export const GUEST_COOKIE = "helagi_guest";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days, slid on activity

export interface User {
  id: string;
  email: string;
  // Absent for accounts created via "Sign in with Google" — those have no
  // password, so password login is rejected for them.
  passwordHash?: string;
  // Google's stable account ID ("sub" claim), set once the user has signed in
  // with Google at least once.
  googleId?: string;
  createdAt: string;
}

interface SessionData {
  userId: string;
  email: string;
  createdAt: string;
}

export type Identity =
  | { type: "user"; id: string; email: string }
  | { type: "guest"; id: string };

// ── Storage: Upstash Redis, with an in-memory fallback for local dev ────────

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

// The fallback lives on globalThis so it survives Next.js dev-mode module
// reloads within one server process.
type MemoryEntry = { value: unknown; expiresAt: number | null };
const memory: Map<string, MemoryEntry> = ((
  globalThis as { __helagiAuthMemory?: Map<string, MemoryEntry> }
).__helagiAuthMemory ??= new Map());

let warnedMemory = false;
function warnMemory() {
  if (warnedMemory) return;
  warnedMemory = true;
  console.warn(
    "[auth] UPSTASH_REDIS_REST_URL/TOKEN not set — using an IN-MEMORY store. " +
      "Accounts and sessions are lost on restart. Never deploy publicly in this state.",
  );
}

// Exported for reuse by other server-side stores (lib/chatStore.ts) so the
// Redis/in-memory fallback logic lives in one place.
export async function storeGet<T>(key: string): Promise<T | null> {
  if (redis) return (await redis.get<T>(key)) ?? null;
  warnMemory();
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value as T;
}

// Returns false when ifNotExists is set and the key already existed.
export async function storeSet(
  key: string,
  value: unknown,
  opts?: { ttlSeconds?: number; ifNotExists?: boolean },
): Promise<boolean> {
  if (redis) {
    // Upstash types SET options as a strict union, so pick the exact shape.
    const result =
      opts?.ttlSeconds && opts?.ifNotExists
        ? await redis.set(key, value, { ex: opts.ttlSeconds, nx: true })
        : opts?.ttlSeconds
          ? await redis.set(key, value, { ex: opts.ttlSeconds })
          : opts?.ifNotExists
            ? await redis.set(key, value, { nx: true })
            : await redis.set(key, value);
    return result !== null; // NX miss → null
  }
  warnMemory();
  if (opts?.ifNotExists && (await storeGet(key)) !== null) return false;
  memory.set(key, {
    value,
    expiresAt: opts?.ttlSeconds ? Date.now() + opts.ttlSeconds * 1000 : null,
  });
  return true;
}

async function storeDelete(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  memory.delete(key);
}

async function storeExpire(key: string, ttlSeconds: number): Promise<void> {
  if (redis) {
    await redis.expire(key, ttlSeconds);
    return;
  }
  const entry = memory.get(key);
  if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
}

// ── Password hashing (scrypt, constant-time verify) ─────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = (await scrypt(password, Buffer.from(saltHex, "hex"), 64)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

// ── Users ────────────────────────────────────────────────────────────────────

const userKey = (email: string) => `user:email:${email.trim().toLowerCase()}`;

// Creates the account, or reports that the email is taken. The SET NX write is
// atomic, so two simultaneous registrations can't both win.
export async function registerUser(
  email: string,
  password: string,
): Promise<{ user: User } | { error: string }> {
  const user: User = {
    id: `u_${randomBytes(12).toString("hex")}`, // permanent user ID
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const created = await storeSet(userKey(user.email), user, {
    ifNotExists: true, // accounts are permanent — no TTL
  });
  if (!created) return { error: "An account with this email already exists." };
  return { user };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await storeGet<User>(userKey(email));
  if (!user || !user.passwordHash) {
    // No account, or a Google-only account without a password. Burn roughly
    // the same time as a real check so response timing doesn't reveal which.
    await hashPassword(password);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

// "Sign in with Google": returns the existing account for this (verified)
// email, or creates a password-less one. An existing email+password account is
// simply reused — Google verified that the visitor owns the address, so this
// links the two login methods to one account.
export async function findOrCreateGoogleUser(
  email: string,
  googleId: string,
): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const existing = await storeGet<User>(userKey(normalized));
  if (existing) {
    if (existing.googleId !== googleId) {
      const linked = { ...existing, googleId };
      await storeSet(userKey(normalized), linked);
      return linked;
    }
    return existing;
  }
  const user: User = {
    id: `u_${randomBytes(12).toString("hex")}`,
    email: normalized,
    googleId,
    createdAt: new Date().toISOString(),
  };
  const created = await storeSet(userKey(normalized), user, {
    ifNotExists: true, // accounts are permanent — no TTL
  });
  if (!created) {
    // Lost a race against a simultaneous registration — use that account.
    const raced = await storeGet<User>(userKey(normalized));
    if (raced) return raced;
  }
  return user;
}

// ── Sessions & identity ──────────────────────────────────────────────────────

const sessionKey = (token: string) => `session:${token}`;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

// Logs the user in: stores a session server-side and hands the browser the
// opaque token. Any guest cookie is dropped — the account identity replaces it.
export async function createSession(user: User): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const session: SessionData = {
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
  };
  await storeSet(sessionKey(token), session, {
    ttlSeconds: SESSION_TTL_SECONDS,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
  jar.delete(GUEST_COOKIE);
}

// Logs out: clears both identity cookies, then deletes the server-side
// session. Cookies go first so the browser is logged out even if the store
// delete fails (the orphaned session still expires via its TTL).
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  jar.delete(GUEST_COOKIE);
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    await storeDelete(sessionKey(token));
  }
}

// Gives the visitor an anonymous session ID (idempotent — an existing valid
// guest cookie is kept so one visitor stays one session).
export async function ensureGuestSession(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing && /^g_[0-9a-f]{24}$/.test(existing)) return existing;
  const id = `g_${randomBytes(12).toString("hex")}`;
  jar.set(GUEST_COOKIE, id, cookieOptions(SESSION_TTL_SECONDS));
  return id;
}

// Who is making this request? Logged-in user beats guest; null means neither
// (send them to the landing page). Validating a session slides its TTL, which
// is what makes logins persistent.
export async function getIdentity(): Promise<Identity | null> {
  const jar = await cookies();

  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    const session = await storeGet<SessionData>(sessionKey(token));
    if (session) {
      await storeExpire(sessionKey(token), SESSION_TTL_SECONDS);
      return { type: "user", id: session.userId, email: session.email };
    }
  }

  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (guestId && /^g_[0-9a-f]{24}$/.test(guestId)) {
    return { type: "guest", id: guestId };
  }

  return null;
}
