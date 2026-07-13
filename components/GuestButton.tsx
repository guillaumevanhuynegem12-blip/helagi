"use client";

// "Continue as guest": asks the server for an anonymous session cookie, then
// enters the chat. Used on the landing page and the auth pages.

import { useState } from "react";
import { track } from "@/lib/analytics";

export default function GuestButton({
  className,
  variant = "light",
}: {
  className?: string;
  /** "light" for cream/white pages, "onDark" for the forest CTA panel */
  variant?: "light" | "onDark";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startAsGuest() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not start a guest session.");
      }
      track("guest_session_started");
      // Full navigation for the same reason as AuthForm: a cached logged-out
      // render of /chat would bounce straight back to "/".
      window.location.href = "/chat";
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not start a guest session. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={startAsGuest}
        disabled={busy}
        className={
          variant === "onDark"
            ? "btn btn-lg w-full border border-cream/30 text-cream hover:bg-white/10 focus-visible:outline-cream"
            : "btn btn-secondary btn-md w-full"
        }
      >
        {busy ? "Starting…" : "Continue as guest"}
      </button>
      {error && (
        <p
          role="alert"
          className={`mt-2 text-xs ${variant === "onDark" ? "text-cream/80" : "text-clay"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
