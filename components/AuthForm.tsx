"use client";

// Shared login/register form. Validates client-side for instant feedback
// (the API routes re-validate everything), shows clear field-level and
// server errors, and enters the chat on success.

import { useState } from "react";
import Link from "next/link";
import {
  validateEmail,
  validatePassword,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation";
import { track } from "@/lib/analytics";

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
      track(isRegister ? "registration" : "login");
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
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-forest-deep"
        >
          Password
        </label>
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
            ? "Creating your account…"
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
