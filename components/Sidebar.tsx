"use client";

// Conversation list + "New chat" button. Permanent on desktop; on mobile it
// slides in over a backdrop (open/onClose controlled by the page).

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
  open,
  onClose,
  identity,
  onLogout,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
  identity: SidebarIdentity;
  onLogout: () => void;
}) {
  const displayName = identity.type === "user" ? identity.email : "Guest";
  const initial =
    identity.type === "user" && identity.email.length > 0
      ? identity.email[0]!.toUpperCase()
      : "G";

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
        {/* Brand */}
        <div className="px-4 py-4">
          <HelagiLockup reversed size="lg" />
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
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={c.id === activeId ? "true" : undefined}
                    className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${
                      c.id === activeId
                        ? "bg-forest font-medium text-cream shadow-soft"
                        : "text-cream/70 hover:bg-white/10 hover:text-cream"
                    }`}
                    title={c.title}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Account */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-2.5 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium text-cream"
                title={displayName}
              >
                {displayName}
              </p>
              <p className="text-xs leading-4 text-cream/50">
                {identity.type === "user"
                  ? "Chats are saved privately to your account."
                  : "Guest — chats aren't saved after you leave."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1.5 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-cream/60 transition hover:bg-white/10 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            <svg
              width="14"
              height="14"
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
      </aside>
    </>
  );
}
