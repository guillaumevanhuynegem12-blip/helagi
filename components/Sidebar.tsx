"use client";

// Conversation list + "New chat" button. Permanent on desktop; on mobile it
// slides in over a backdrop (open/onClose controlled by the page).
//
// Each conversation can be renamed (inline input — Enter saves, Escape
// cancels) and deleted (with a confirm). Both actions are hidden behind
// hover/focus on desktop and always visible on the active item, so they're
// reachable on touch screens too.
//
// The profile block at the bottom is a menu button: Settings, Help, Log out.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Conversation } from "@/lib/types";
import { HelagiLockup } from "./Logo";

// Who is using the chat — drives the account block at the bottom.
export type SidebarIdentity =
  | { type: "user"; email: string }
  | { type: "guest" };

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  busy,
  open,
  onClose,
  identity,
  onLogout,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  // True while a reply is streaming — the active chat can't be deleted or
  // renamed mid-stream (the stream is writing into it).
  busy: boolean;
  open: boolean;
  onClose: () => void;
  identity: SidebarIdentity;
  onLogout: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // Profile menu (Settings / Help / Log out). Closes on outside click and Esc.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const displayName = identity.type === "user" ? identity.email : "Guest";
  const initial =
    identity.type === "user" && identity.email.length > 0
      ? identity.email[0]!.toUpperCase()
      : "G";

  function startRename(c: Conversation) {
    setEditingId(c.id);
    setDraft(c.title);
  }

  function commitRename(id: string) {
    onRename(id, draft); // empty/whitespace drafts keep the old title
    setEditingId(null);
  }

  function confirmDelete(c: Conversation) {
    if (
      window.confirm(`Delete "${c.title}"? This can't be undone.`)
    ) {
      onDelete(c.id);
    }
  }

  const actionButtonClasses =
    "flex h-7 w-7 items-center justify-center rounded-lg text-cream/60 transition hover:bg-white/15 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sage disabled:opacity-30";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-ink/40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-forest-deep text-cream transition-transform duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand — links back to the homepage (session stays, so the visitor
            remains logged in and can return via "Open Helagi") */}
        <div className="px-4 py-4">
          <a
            href="/"
            aria-label="Back to the Helagi homepage"
            className="inline-block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage"
          >
            <HelagiLockup reversed size="lg" />
          </a>
        </div>

        {/* New chat */}
        <div className="px-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-cream transition hover:border-white/25 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New chat
          </button>
        </div>

        {/* History */}
        <div className="mt-4 flex-1 overflow-y-auto scroll-area px-3">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-cream/40">
            Your conversations
          </p>
          {conversations.length === 0 ? (
            <p className="px-3 py-2 text-sm leading-6 text-cream/40">
              Nothing here yet — your chats will show up here.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {conversations.map((c) => {
                const isActive = c.id === activeId;
                // The stream writes into the active chat — don't allow
                // renaming or deleting it mid-reply.
                const locked = busy && isActive;

                if (editingId === c.id) {
                  return (
                    <li key={c.id}>
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={80}
                        aria-label="Conversation name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(c.id);
                          else if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => commitRename(c.id)}
                        className="w-full rounded-xl border border-sage/60 bg-white/10 px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40"
                      />
                    </li>
                  );
                }

                return (
                  <li key={c.id} className="group">
                    <div
                      className={`flex items-center rounded-xl transition ${
                        isActive
                          ? "bg-forest shadow-soft"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${
                          isActive
                            ? "font-medium text-cream"
                            : "text-cream/70 group-hover:text-cream"
                        }`}
                        title={c.title}
                      >
                        {c.title}
                      </button>
                      <div
                        className={`flex shrink-0 items-center gap-0.5 pr-1.5 ${
                          isActive
                            ? ""
                            : "opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => startRename(c)}
                          disabled={locked}
                          aria-label={`Rename conversation "${c.title}"`}
                          title="Rename"
                          className={actionButtonClasses}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(c)}
                          disabled={locked}
                          aria-label={`Delete conversation "${c.title}"`}
                          title="Delete"
                          className={actionButtonClasses}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Account / profile menu */}
        <div ref={menuRef} className="relative border-t border-white/10 p-3">
          {menuOpen && (
            <div
              role="menu"
              aria-label="Account menu"
              className="absolute bottom-full left-3 right-3 z-10 mb-1 animate-fade-in overflow-hidden rounded-xl border border-white/15 bg-forest shadow-lift"
            >
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-cream/80 transition hover:bg-white/10 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sage"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </Link>
              <Link
                href="/help"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-cream/80 transition hover:bg-white/10 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sage"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                Help
              </Link>
              <div className="mx-3 border-t border-white/10" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-cream/80 transition hover:bg-white/10 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sage"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Log out
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.05] px-2.5 py-2.5 text-left transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium text-cream"
                title={displayName}
              >
                {displayName}
              </p>
              <p className="text-xs leading-4 text-cream/50">
                {identity.type === "user"
                  ? "Settings, help & log out"
                  : "Guest — settings, help & log out"}
              </p>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`shrink-0 text-cream/50 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 15 6-6 6 6" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
