"use client";

// Sets the new password using the single-use token from the reset email.
// On success the API also logs the visitor in, so we go straight to the chat.

import { useState } from "react";
import Link from "next/link";
import { validatePassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { track } from "@/lib/analytics";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setServerError(null);

    const errors: typeof fieldErrors = {};
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (confirm !== password) errors.confirm = "The passwords don't match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(
          data?.error ?? "Something went wrong. Please try again.",
        );
        setBusy(false);
        return;
      }
      track("password_reset");
      // Full page load so the server sees the fresh session cookie.
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
        <div
          role="alert"
          className="rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-sm leading-6 text-ink"
        >
          {serverError}{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-forest underline underline-offset-2"
          >
            Request a new link
          </Link>
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-forest-deep"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          className="input-field"
        />
        {fieldErrors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-clay">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="mb-1.5 block text-sm font-medium text-forest-deep"
        >
          Repeat new password
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
          className="input-field"
        />
        {fieldErrors.confirm && (
          <p id="confirm-error" className="mt-1.5 text-xs text-clay">
            {fieldErrors.confirm}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary btn-md mt-1 w-full"
      >
        {busy ? "Saving your new password…" : "Set new password"}
      </button>
    </form>
  );
}
