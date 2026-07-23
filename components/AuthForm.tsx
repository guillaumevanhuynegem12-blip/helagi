"use client";

// Shared login/register form. Validates client-side for instant feedback
// (the API routes re-validate everything), shows clear field-level and
// server errors, and enters the chat on success.
//
// Registration is a two-step flow: credentials first, then a "verify" step
// where the visitor enters the 6-digit code we emailed them. The account only
// exists once the code checks out (see /api/auth/verify-email).

import { useState } from "react";
import Link from "next/link";
import {
  validateEmail,
  validatePassword,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation";
import { track } from "@/lib/analytics";
import { requireTermsAcceptance } from "@/lib/consent";

const inputClasses = "input-field";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Verification step (register only).
  const [step, setStep] = useState<"credentials" | "verify">("credentials");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setServerError(null);

    // Client-side validation first — friendlier than a round trip.
    const errors: typeof fieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    // On login, don't nitpick password shape — just require one.
    if (isRegister) {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
      if (confirm !== password) {
        errors.confirm = "The passwords don't match.";
      }
    } else if (password.length === 0) {
      errors.password = "Please enter your password.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Hard gate: neither login nor registration proceeds until the Terms of
    // Use are accepted. The auth API routes re-check this server-side.
    if (!(await requireTermsAcceptance())) {
      setServerError("Please accept the Terms of Use to continue.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(
          data?.error ?? "Something went wrong. Please try again.",
        );
        setBusy(false);
        return;
      }
      if (isRegister) {
        // Account not created yet — the code we just emailed does that.
        setBusy(false);
        setStep("verify");
        return;
      }
      track("login");
      // Full navigation, not a client route change: the router may still hold
      // a cached logged-out render of /chat that would bounce back to "/".
      // A real page load guarantees the server sees the fresh session cookie.
      window.location.href = "/chat";
    } catch {
      setServerError(
        "Could not reach the server. Please check your connection and try again.",
      );
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setCodeError(null);
    setCodeNotice(null);

    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError("Please enter the 6-digit code from the email.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.expired) setExpired(true);
        setCodeError(data?.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      track("registration");
      // Full page load for the same cookie-freshness reason as login above.
      window.location.href = "/chat";
    } catch {
      setCodeError(
        "Could not reach the server. Please check your connection and try again.",
      );
      setBusy(false);
    }
  }

  async function resendCode() {
    if (resending || busy) return;
    setResending(true);
    setCodeError(null);
    setCodeNotice(null);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.expired) setExpired(true);
        setCodeError(data?.error ?? "Something went wrong. Please try again.");
      } else {
        setCodeNotice("We've emailed you a new code.");
      }
    } catch {
      setCodeError(
        "Could not reach the server. Please check your connection and try again.",
      );
    }
    setResending(false);
  }

  // Back to step 1 — used both by "use a different email" and after the
  // pending signup expires.
  function startOver() {
    setStep("credentials");
    setCode("");
    setCodeError(null);
    setCodeNotice(null);
    setExpired(false);
  }

  if (isRegister && step === "verify") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-ink/70">
          We&rsquo;ve emailed a 6-digit code to{" "}
          <span className="font-medium text-forest-deep">{email.trim()}</span>.
          Enter it below to confirm this is you.
        </p>

        {codeError && (
          <p
            role="alert"
            className="rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-sm text-ink"
          >
            {codeError}
          </p>
        )}
        {codeNotice && (
          <p
            role="status"
            className="rounded-xl border border-leaf/40 bg-leaf/10 px-3.5 py-2.5 text-sm text-ink"
          >
            {codeNotice}
          </p>
        )}

        {expired ? (
          <button
            type="button"
            onClick={startOver}
            className="btn btn-primary btn-md w-full"
          >
            Start over
          </button>
        ) : (
          <form onSubmit={submitCode} noValidate className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium text-forest-deep"
              >
                Verification code
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                aria-invalid={!!codeError}
                aria-describedby={codeError ? "code-error" : undefined}
                className={`${inputClasses} text-center text-lg tracking-[0.4em]`}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-md mt-1 w-full"
            >
              {busy ? "Checking the code…" : "Confirm my email"}
            </button>

            <p className="text-center text-sm text-ink/60">
              Nothing arrived? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={resendCode}
                disabled={resending}
                className="font-medium text-forest underline underline-offset-2 disabled:opacity-50"
              >
                {resending ? "sending…" : "send a new code"}
              </button>
              .
            </p>
            <p className="text-center text-sm">
              <button
                type="button"
                onClick={startOver}
                className="text-ink/50 underline underline-offset-2"
              >
                Use a different email
              </button>
            </p>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-sm text-ink"
        >
          {serverError}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-forest-deep"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className={inputClasses}
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-clay">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-forest-deep"
          >
            Password
          </label>
          {!isRegister && (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-forest underline underline-offset-2"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <input
          id="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            isRegister ? `At least ${PASSWORD_MIN_LENGTH} characters` : "Your password"
          }
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          className={inputClasses}
        />
        {fieldErrors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-clay">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {isRegister && (
        <div>
          <label
            htmlFor="confirm"
            className="mb-1.5 block text-sm font-medium text-forest-deep"
          >
            Repeat password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Same password again"
            aria-invalid={!!fieldErrors.confirm}
            aria-describedby={fieldErrors.confirm ? "confirm-error" : undefined}
            className={inputClasses}
          />
          {fieldErrors.confirm && (
            <p id="confirm-error" className="mt-1.5 text-xs text-clay">
              {fieldErrors.confirm}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary btn-md mt-1 w-full"
      >
        {busy
          ? isRegister
            ? "Sending your code…"
            : "Signing you in…"
          : isRegister
            ? "Create account"
            : "Log in"}
      </button>

      <p className="text-center text-sm text-ink/60">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-forest underline underline-offset-2"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            New to Helagi?{" "}
            <Link
              href="/register"
              className="font-medium text-forest underline underline-offset-2"
            >
              Create a free account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
