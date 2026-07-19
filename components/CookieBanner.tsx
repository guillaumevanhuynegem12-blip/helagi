"use client";

// Cookie-consent banner + "Manage preferences" modal, mounted globally in
// app/layout.tsx.
//
// - Banner shows on first visit (no consent cookie yet) with Accept all /
//   Reject optional / Manage preferences.
// - The footer's "Cookie settings" link (and anything else) can reopen the
//   modal later by dispatching OPEN_COOKIE_SETTINGS_EVENT, so consent can be
//   changed or withdrawn at any time.
// - Nothing optional runs until consent exists: lib/analytics.ts checks the
//   consent cookie on every call, and /api/analytics re-checks server-side.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import { track } from "@/lib/analytics";

const CATEGORIES = [
  {
    key: "necessary" as const,
    locked: true,
    title: "Strictly necessary",
    description:
      "Login sessions, guest sessions, security, and remembering this cookie choice. The site cannot work without these.",
  },
  {
    key: "analytics" as const,
    locked: false,
    title: "Analytics",
    description:
      "First-party usage statistics (pages visited, buttons used, errors) that help us improve Helagi. Never includes what you write in the chat.",
  },
  {
    key: "preferences" as const,
    locked: false,
    title: "Performance & preferences",
    description:
      "Optional cookies that remember settings between visits. Helagi doesn't currently set any — this choice covers future ones.",
  },
];

export default function CookieBanner() {
  // undecided = no consent cookie yet → show the banner.
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(false);

  // Read the cookie only after mount — during SSR there is no document.
  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setShowBanner(true);
    } else {
      setAnalytics(existing.analytics);
      setPreferences(existing.preferences);
    }
  }, []);

  // Let the footer's "Cookie settings" link reopen the preferences modal.
  useEffect(() => {
    const open = () => {
      const existing = readConsent();
      setAnalytics(existing?.analytics ?? false);
      setPreferences(existing?.preferences ?? false);
      setShowModal(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  const decide = useCallback((acceptAnalytics: boolean, acceptPreferences: boolean) => {
    writeConsent(acceptAnalytics, acceptPreferences);
    setAnalytics(acceptAnalytics);
    setPreferences(acceptPreferences);
    setShowBanner(false);
    setShowModal(false);
    // Only ever recorded when analytics was just accepted.
    track("consent_updated", {
      analytics: acceptAnalytics,
      preferences: acceptPreferences,
    });
  }, []);

  // Esc closes the modal without saving.
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  if (!showBanner && !showModal) return null;

  return (
    <>
      {showBanner && !showModal && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4"
        >
          <div className="mx-auto max-w-3xl animate-fade-up rounded-2xl border border-forest/15 bg-white p-4 shadow-lift sm:p-5">
            {/* Phones get a one-sentence version; the full explanation is a
                tap away in the Cookie Policy or "Manage preferences". */}
            <p className="text-[13px] leading-5 text-ink sm:text-sm sm:leading-6">
              <span className="font-semibold text-forest-deep">Cookies at Helagi.</span>{" "}
              <span className="sm:hidden">
                Necessary cookies keep login working; optional first-party
                analytics help us improve — never what you write in the chat.
              </span>
              <span className="hidden sm:inline">
                We use strictly necessary cookies to make login and security work.
                With your permission we&rsquo;d also like to use first-party
                analytics to understand how Helagi is used — never the content of
                your conversations.
              </span>{" "}
              Details in our{" "}
              <Link href="/legal/cookies" className="text-forest underline underline-offset-2">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="mt-3 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => decide(true, true)}
                className="btn btn-primary btn-sm"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => decide(false, false)}
                className="btn btn-secondary btn-sm"
              >
                <span className="sm:hidden">Reject optional</span>
                <span className="hidden sm:inline">Reject optional cookies</span>
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="btn btn-ghost btn-sm col-span-2 underline underline-offset-2 sm:col-auto"
              >
                Manage preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center sm:p-4">
          {/* Backdrop click closes without saving */}
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="relative w-full max-w-lg animate-fade-up rounded-2xl border border-forest/15 bg-white p-5 shadow-lift sm:p-6"
          >
            <h2
              id="cookie-settings-title"
              className="font-display text-xl text-forest-deep"
            >
              Cookie preferences
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              Choose which cookies Helagi may use. You can change this at any
              time via &ldquo;Cookie settings&rdquo; in the footer.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {CATEGORIES.map((cat) => {
                const checked =
                  cat.key === "necessary"
                    ? true
                    : cat.key === "analytics"
                      ? analytics
                      : preferences;
                return (
                  <label
                    key={cat.key}
                    className={`flex items-start gap-3 rounded-xl border border-forest/10 p-3 ${
                      cat.locked ? "bg-cream-muted/60" : "bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={cat.locked}
                      onChange={(e) => {
                        if (cat.key === "analytics") setAnalytics(e.target.checked);
                        if (cat.key === "preferences") setPreferences(e.target.checked);
                      }}
                      className="mt-1 h-4 w-4 accent-forest"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-forest-deep">
                        {cat.title}
                        {cat.locked && (
                          <span className="ml-2 text-xs font-normal text-ink/50">
                            always on
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-5 text-ink/60">
                        {cat.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => decide(analytics, preferences)}
                className="btn btn-primary btn-sm"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
