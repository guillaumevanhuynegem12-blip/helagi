"use client";

// "Forgot password" form. The API deliberately answers the same whether or
// not an account exists (no email enumeration), so the success state is
// phrased as "if an account exists…".

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setServerError(null);

    const emailError = validateEmail(email);
    setFieldError(emailError);
    if (emailError) return;

    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(
          data?.error ?? "Something went wrong. Please try again.",
        );
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setServerError(
        "Could not reach the server. Please check your connection and try again.",
      );
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-xl border border-leaf/40 bg-leaf/10 px-3.5 py-2.5 text-sm leading-6 text-ink"
        >
          If an account exists for{" "}
          <span className="font-medium text-forest-deep">{email.trim()}</span>,
          a reset link is on its way. It works for 30 minutes — check your spam
          folder if nothing arrives.
        </p>
        <p className="text-center text-sm text-ink/60">
          <Link
            href="/login"
            className="font-medium text-forest underline underline-offset-2"
          >
            Back to log in
          </Link>
        </p>
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
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "email-error" : undefined}
          className="input-field"
        />
        {fieldError && (
          <p id="email-error" className="mt-1.5 text-xs text-clay">
            {fieldError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary btn-md mt-1 w-full"
      >
        {busy ? "Sending the link…" : "Email me a reset link"}
      </button>

      <p className="text-center text-sm text-ink/60">
        Remembered it after all?{" "}
        <Link
          href="/login"
          className="font-medium text-forest underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
