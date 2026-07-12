"use client";

// "Continue as guest": asks the server for an anonymous session cookie, then
// enters the chat. Used on the landing page and the auth pages.

import { useState } from "react";
import { track } from "@/lib/analytics";

export default function GuestButton({ className }: { className?: string }) {
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
        className="w-full rounded-xl border border-forest/25 bg-white px-4 py-2.5 text-sm font-medium text-forest transition enabled:hover:bg-cream-muted disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
      >
        {busy ? "Starting…" : "Continue as guest"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
