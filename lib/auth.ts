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
// - Registration is a two-step flow: the account is only created after the
//   visitor proves they own the email by entering a 6-digit code we sent to
//   it. Until then only a short-lived "pending signup" record exists.
// - Password resets use single-use 32-byte tokens emailed as a link. Only a
//   SHA-256 hash of the token is stored, so a leaked store can't reset
//   passwords.
//
// NOTE: cookie WRITES (createSession, destroySession, ensureGuestSession) are
// only legal inside Route Handlers / Server Actions. getIdentity() is
// read-only and safe to call from Server Components too.

import {
  createHash,
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
} from "crypto";
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
  // Durable proof of Terms of Use acceptance, copied from the consent cookie
  // at account creation (see lib/security.ts getTermsAcceptance). Survives
  // cleared cookies; absent only on accounts predating the terms gate.
  termsAcceptedAt?: string;
  termsVersion?: string;
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

// Exported for lib/chatStore.ts (chat-history deletion), like storeGet/storeSet.
export async function storeDelete(key: string): Promise<void> {
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

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

// ── Registration with email verification ────────────────────────────────────
//
// Step 1 (beginSignup): store a pending record with the hashed password and a
// hashed 6-digit code — no account yet, so a typo'd or abandoned signup never
// squats an email address. Step 2 (confirmSignup): the right code creates the
// real account. The pending record expires after 15 minutes and allows 5
// wrong guesses in total (a fresh code from resendSignupCode does NOT reset
// the guess budget, so the code can't be brute-forced via resends).

interface PendingSignup {
  email: string;
  passwordHash: string;
  codeHash: string;
  attemptsLeft: number;
  createdAt: string; // anchors the original expiry when the record is rewritten
}

const signupKey = (email: string) =>
  `signup:email:${email.trim().toLowerCase()}`;
const SIGNUP_TTL_SECONDS = 15 * 60;
const SIGNUP_MAX_ATTEMPTS = 5;
const SIGNUP_EXPIRED_ERROR =
  "This verification code has expired. Please start over to get a new one.";

// crypto.randomInt is uniform, so every 6-digit code is equally likely.
const generateSignupCode = () =>
  randomInt(0, 1_000_000).toString().padStart(6, "0");

function pendingTtlRemaining(pending: PendingSignup): number {
  const elapsed = Math.floor((Date.now() - Date.parse(pending.createdAt)) / 1000);
  return SIGNUP_TTL_SECONDS - elapsed;
}

// Starts (or restarts — latest attempt wins) a signup. Returns the plain code
// so the caller can email it; only its hash is stored.
export async function beginSignup(
  email: string,
  password: string,
): Promise<{ code: string } | { error: string }> {
  const normalized = email.trim().toLowerCase();
  const existing = await storeGet<User>(userKey(normalized));
  if (existing) return { error: "An account with this email already exists." };

  const code = generateSignupCode();
  const pending: PendingSignup = {
    email: normalized,
    passwordHash: await hashPassword(password),
    codeHash: sha256(code),
    attemptsLeft: SIGNUP_MAX_ATTEMPTS,
    createdAt: new Date().toISOString(),
  };
  await storeSet(signupKey(normalized), pending, {
    ttlSeconds: SIGNUP_TTL_SECONDS,
  });
  return { code };
}

// Issues a fresh code for an in-progress signup (old code stops working).
// The 15-minute window restarts — but attemptsLeft is carried over.
export async function resendSignupCode(
  email: string,
): Promise<{ code: string } | { error: string }> {
  const key = signupKey(email);
  const pending = await storeGet<PendingSignup>(key);
  if (!pending) return { error: SIGNUP_EXPIRED_ERROR };

  const code = generateSignupCode();
  await storeSet(
    key,
    { ...pending, codeHash: sha256(code), createdAt: new Date().toISOString() },
    { ttlSeconds: SIGNUP_TTL_SECONDS },
  );
  return { code };
}

// Checks the code and, when right, creates the account. `expired: true` tells
// the UI the whole signup must be restarted (record gone, guesses used up, or
// the email got registered some other way in the meantime).
export async function confirmSignup(
  email: string,
  code: string,
  terms?: { acceptedAt: string; version: string },
): Promise<{ user: User } | { error: string; expired?: boolean }> {
  const key = signupKey(email);
  const pending = await storeGet<PendingSignup>(key);
  if (!pending) return { error: SIGNUP_EXPIRED_ERROR, expired: true };

  // The in-memory fallback honors TTLs, but recompute anyway so a rewritten
  // record can never outlive its original window by much.
  const remaining = pendingTtlRemaining(pending);
  if (remaining <= 0) {
    await storeDelete(key);
    return { error: SIGNUP_EXPIRED_ERROR, expired: true };
  }

  const expected = Buffer.from(pending.codeHash, "hex");
  const actual = Buffer.from(sha256(code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const attemptsLeft = pending.attemptsLeft - 1;
    if (attemptsLeft <= 0) {
      await storeDelete(key);
      return {
        error: "Too many incorrect codes. Please start over.",
        expired: true,
      };
    }
    await storeSet(key, { ...pending, attemptsLeft }, { ttlSeconds: remaining });
    return {
      error: `That code isn't right — please check the email and try again. ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} left.`,
    };
  }

  const user: User = {
    id: `u_${randomBytes(12).toString("hex")}`, // permanent user ID
    email: pending.email,
    passwordHash: pending.passwordHash,
    createdAt: new Date().toISOString(),
    ...(terms
      ? { termsAcceptedAt: terms.acceptedAt, termsVersion: terms.version }
      : {}),
  };
  // SET NX is atomic, so a simultaneous signup (e.g. via Google) can't be
  // overwritten.
  const created = await storeSet(userKey(user.email), user, {
    ifNotExists: true, // accounts are permanent — no TTL
  });
  await storeDelete(key);
  if (!created) {
    return {
      error: "An account with this email already exists. Try logging in.",
      expired: true,
    };
  }
  return { user };
}

// ── Password reset ───────────────────────────────────────────────────────────
//
// A reset token proves email ownership, so it also works for Google-only
// accounts — completing a reset simply gives such an account a password
// (linking both login methods, like findOrCreateGoogleUser does in reverse).

interface PasswordReset {
  email: string;
  createdAt: string;
}

const resetKey = (tokenHash: string) => `pwreset:${tokenHash}`;
const RESET_TTL_SECONDS = 30 * 60;
const RESET_INVALID_ERROR =
  "This password reset link is invalid or has expired. Please request a new one.";

// Returns the plain token for the email link, or null when no account exists
// for this address. IMPORTANT: callers must respond identically in both cases
// so the endpoint can't be used to probe which emails have accounts.
export async function createPasswordReset(
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const user = await storeGet<User>(userKey(normalized));
  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  const record: PasswordReset = {
    email: normalized,
    createdAt: new Date().toISOString(),
  };
  await storeSet(resetKey(sha256(token)), record, {
    ttlSeconds: RESET_TTL_SECONDS,
  });
  return token;
}

// Consumes the token (single-use, valid or not) and sets the new password.
export async function resetPassword(
  token: string,
  password: string,
): Promise<{ user: User } | { error: string }> {
  if (!/^[0-9a-f]{64}$/.test(token)) return { error: RESET_INVALID_ERROR };

  const key = resetKey(sha256(token));
  const record = await storeGet<PasswordReset>(key);
  if (!record) return { error: RESET_INVALID_ERROR };
  await storeDelete(key);

  const user = await storeGet<User>(userKey(record.email));
  if (!user) return { error: RESET_INVALID_ERROR };

  const updated: User = {
    ...user,
    passwordHash: await hashPassword(password),
  };
  await storeSet(userKey(record.email), updated);
  return { user: updated };
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
  terms?: { acceptedAt: string; version: string },
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
    ...(terms
      ? { termsAcceptedAt: terms.acceptedAt, termsVersion: terms.version }
      : {}),
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

// ── Account deletion ─────────────────────────────────────────────────────────

// Removes the user record itself. Chats are deleted separately by the caller
// (lib/chatStore.ts). Sessions need no cleanup: getIdentity() re-checks that
// the user record still exists, so every session of a deleted account — on
// any device — dies on its next request.
export async function deleteUserAccount(email: string): Promise<void> {
  await storeDelete(userKey(email));
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
      // The user record must still exist: this is what makes "delete my
      // account" total — sessions on other devices stop working immediately
      // instead of lingering until their TTL.
      const user = await storeGet<User>(userKey(session.email));
      if (user) {
        await storeExpire(sessionKey(token), SESSION_TTL_SECONDS);
        return { type: "user", id: session.userId, email: session.email };
      }
      await storeDelete(sessionKey(token)); // orphaned session — remove it
    }
  }

  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (guestId && /^g_[0-9a-f]{24}$/.test(guestId)) {
    return { type: "guest", id: guestId };
  }

  return null;
}
