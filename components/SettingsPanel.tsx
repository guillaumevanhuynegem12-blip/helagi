"use client";

// Interactive part of /settings: cookie preferences (reopens the global
// consent modal), deleting all chats, and deleting the whole account.
// Destructive actions confirm first and report what happened.

import { useState } from "react";
import Link from "next/link";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";
import { track } from "@/lib/analytics";

export type SettingsIdentity =
  | { type: "user"; email: string }
  | { type: "guest" };

const sectionCard = "card px-6 py-6 sm:px-7";
const sectionTitle = "text-[15px] font-semibold text-forest-deep";
const sectionText = "mt-1.5 text-sm leading-6 text-ink/65";

export default function SettingsPanel({
  identity,
}: {
  identity: SettingsIdentity;
}) {
  const isAccount = identity.type === "user";

  const [chatsBusy, setChatsBusy] = useState(false);
  const [chatsNotice, setChatsNotice] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  async function deleteAllChats() {
    if (chatsBusy) return;
    if (
      !window.confirm(
        "Delete ALL your saved conversations? This can't be undone.",
      )
    ) {
      return;
    }
    setChatsBusy(true);
    setChatsNotice(null);
    try {
      const res = await fetch("/api/chats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations: [] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setChatsNotice(
          data?.error ?? "Something went wrong. Please try again.",
        );
      } else {
        track("chats_deleted");
        setChatsNotice("All your conversations have been deleted.");
      }
    } catch {
      setChatsNotice(
        "Could not reach the server. Please check your connection and try again.",
      );
    }
    setChatsBusy(false);
  }

  async function deleteAccount() {
    if (accountBusy) return;
    if (
      !window.confirm(
        "Permanently delete your account?\n\nThis removes your account AND all saved conversations, on every device. This can't be undone.",
      )
    ) {
      return;
    }
    setAccountBusy(true);
    setAccountError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setAccountError(
          data?.error ?? "Something went wrong. Please try again.",
        );
        setAccountBusy(false);
        return;
      }
      track("account_deleted");
      // Full navigation: the session cookie is gone, so the landing page
      // renders logged-out.
      window.location.href = "/";
    } catch {
      setAccountError(
        "Could not reach the server. Please check your connection and try again.",
      );
      setAccountBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Who you are */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Your account</h2>
        {isAccount ? (
          <p className={sectionText}>
            Signed in as{" "}
            <span className="font-medium text-forest-deep">
              {identity.email}
            </span>
            . Your account is just this email and a password — Helagi never
            stores personal or medical details about you.
          </p>
        ) : (
          <p className={sectionText}>
            You&rsquo;re browsing as a <strong>guest</strong>. There is no
            account, and your chats never touch our servers — they live in
            your browser tab and vanish when you leave. Want to keep your
            conversations?{" "}
            <Link
              href="/register"
              className="font-medium text-forest underline underline-offset-2"
            >
              Create a free account
            </Link>
            .
          </p>
        )}
      </section>

      {/* Cookies */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Cookies</h2>
        <p className={sectionText}>
          Choose which cookies Helagi may use. Strictly necessary cookies
          (login and security) are always on; analytics is up to you and never
          includes what you write in the chat.
        </p>
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
          }
          className="btn btn-secondary btn-md mt-4"
        >
          Manage cookie preferences
        </button>
      </section>

      {/* Your data */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Your data</h2>
        {isAccount ? (
          <>
            <p className={sectionText}>
              Your conversations are saved privately to your account so you can
              pick up where you left off. Deleting them removes every saved
              chat from our servers, permanently.
            </p>
            {chatsNotice && (
              <p
                role="status"
                className="mt-3 rounded-xl border border-forest/15 bg-white px-3.5 py-2.5 text-sm text-ink"
              >
                {chatsNotice}
              </p>
            )}
            <button
              type="button"
              onClick={deleteAllChats}
              disabled={chatsBusy}
              className="btn btn-secondary btn-md mt-4"
            >
              {chatsBusy ? "Deleting…" : "Delete all my chats"}
            </button>
          </>
        ) : (
          <p className={sectionText}>
            Nothing to delete: as a guest, your chats are never stored on our
            servers in the first place. Closing the tab removes everything.
          </p>
        )}
      </section>

      {/* Danger zone */}
      {isAccount && (
        <section className="rounded-2xl border border-clay/40 bg-clay/[0.06] px-6 py-6 sm:px-7">
          <h2 className="text-[15px] font-semibold text-clay">
            Delete your account
          </h2>
          <p className={sectionText}>
            This permanently removes your account and all saved conversations,
            and signs you out everywhere. It cannot be undone.
          </p>
          {accountError && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-sm text-ink"
            >
              {accountError}
            </p>
          )}
          <button
            type="button"
            onClick={deleteAccount}
            disabled={accountBusy}
            className="btn btn-md mt-4 border border-clay bg-clay text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            {accountBusy ? "Deleting your account…" : "Delete my account"}
          </button>
        </section>
      )}
    </div>
  );
}
