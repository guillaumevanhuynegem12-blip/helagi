"use client";

// The chat application — moved verbatim from app/page.tsx when the landing
// page took over "/". The chat UI and streaming behavior are unchanged; the
// only additions are the identity/logout wiring for the sidebar and a few
// consent-gated analytics beacons (event names only, never message content).
//
// Chat history:
// - Logged-in accounts: conversations are loaded from and saved to the
//   account's private server-side history (/api/chats) — they follow the
//   account, and each account only ever sees its own chats.
// - Guests: React state only. Chats exist for the lifetime of the browser tab
//   and are gone the moment the guest leaves — nothing touches the server.
// Either way the full history is re-sent to /api/chat on every turn.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Message } from "@/lib/types";
import { streamChat } from "@/lib/streamChat";
import { track } from "@/lib/analytics";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";
import Sidebar, { type SidebarIdentity } from "@/components/Sidebar";
import DoctorSummaryButton from "@/components/DoctorSummaryButton";
import { HelagiLockup } from "@/components/Logo";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}

export default function ChatApp({ identity }: { identity: SidebarIdentity }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether the view should follow the newest text. Scrolling up while the
  // answer streams in unsticks it, so the user can read earlier content
  // without being pulled back down; scrolling near the bottom re-sticks it.
  const stickToBottomRef = useRef(true);

  const isAccount = identity.type === "user";
  // Saving is blocked until the server history has been fetched, so an empty
  // just-mounted state can never overwrite an account's real history.
  const [historyLoaded, setHistoryLoaded] = useState(!isAccount);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    track("chat_opened");
  }, []);

  // Accounts: fetch the private server-side history once on mount.
  useEffect(() => {
    if (!isAccount) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chats");
        const data = res.ok ? await res.json().catch(() => null) : null;
        if (!cancelled && Array.isArray(data?.conversations)) {
          setConversations(data.conversations);
        }
      } catch {
        // Offline or server hiccup — start empty; saving stays enabled so the
        // session still gets stored once the connection is back.
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAccount]);

  // Accounts: autosave (debounced) whenever the conversations change — but
  // not mid-stream; the save fires once the reply has finished.
  useEffect(() => {
    if (!isAccount || !historyLoaded || isStreaming) return;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void fetch("/api/chats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations }),
      }).catch(() => {
        // Best effort — the next change retries.
      });
    }, 800);
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [conversations, isAccount, historyLoaded, isStreaming]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  // Auto-scroll to the latest content as messages grow / stream in — but only
  // while the user is at (or near) the bottom.
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    // Instant (not smooth) while streaming: a smooth animation can't keep up
    // with rapid chunks, which would falsely read as "user scrolled up".
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  const startNewChat = useCallback(() => {
    if (isStreaming) return;
    setActiveId(null);
    setSidebarOpen(false);
  }, [isStreaming]);

  const selectChat = useCallback(
    (id: string) => {
      if (isStreaming) return;
      setActiveId(id);
      setSidebarOpen(false);
    },
    [isStreaming],
  );

  // Ends the session server-side (session/guest cookies cleared) and returns
  // to the landing page. A full navigation, not a client route change, so all
  // in-memory chat state is gone afterwards.
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, leaving the page drops the chat state; the
      // cookies then expire on their own.
    }
    window.location.href = "/";
  }, []);

  // Core send: streams a reply for the given text. Used by the input box and
  // by the clickable questionnaire (which sends compiled answers directly).
  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isStreaming) return;

      // Resolve the conversation we're writing to (create one if this is a new chat).
      let convId = activeId;
      if (!convId) {
        convId = makeId();
        const newConv: Conversation = {
          id: convId,
          title: titleFrom(text),
          messages: [],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveId(convId);
      }

      const userMessage: Message = { id: makeId(), role: "user", content: text };
      const assistantId = makeId();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: c.messages.length === 0 ? titleFrom(text) : c.title,
                messages: [...c.messages, userMessage, assistantMessage],
              }
            : c,
        ),
      );
      // Sending always re-sticks the view so the user sees their own message
      // and the start of the reply.
      stickToBottomRef.current = true;
      setIsStreaming(true);
      track("message_sent");

      const appendToAssistant = (chunk: string) =>
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + chunk }
                      : m,
                  ),
                }
              : c,
          ),
        );

      // Send the full conversation history so follow-ups keep context
      // (e.g. answering the assistant's triage questions).
      const history = (
        conversations.find((c) => c.id === convId)?.messages ?? []
      )
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        for await (const chunk of streamChat([
          ...history,
          { role: "user", content: text },
        ])) {
          appendToAssistant(chunk);
        }
      } catch (err) {
        track("chat_error");
        const msg =
          err instanceof Error
            ? err.message
            : "Sorry — something went wrong. Please try sending your message again.";
        appendToAssistant(msg);
      }

      setIsStreaming(false);
    },
    [isStreaming, activeId, conversations],
  );

  // Send from the input box.
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendText(text);
  }, [input, sendText]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectChat}
        onNewChat={startNewChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        identity={identity}
        onLogout={logout}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-2 border-b border-forest/10 bg-cream px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-forest transition hover:bg-forest/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <a
            href="/"
            aria-label="Back to the Helagi homepage"
            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <HelagiLockup />
          </a>
          {!isEmpty && (
            <div className="ml-auto">
              <DoctorSummaryButton messages={messages} disabled={isStreaming} />
            </div>
          )}
        </header>

        {/* Desktop top bar: conversation title + doctor summary */}
        {!isEmpty && (
          <header className="hidden items-center justify-between gap-4 border-b border-forest/10 bg-cream px-6 py-3 md:flex">
            <h1
              className="truncate text-sm font-medium text-ink/70"
              title={activeConversation?.title}
            >
              {activeConversation?.title ?? "Conversation"}
            </h1>
            <DoctorSummaryButton messages={messages} disabled={isStreaming} />
          </header>
        )}

        {isEmpty ? (
          <div className="scroll-area flex-1 overflow-y-auto">
            <EmptyState onSelectPrompt={setInput} />
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="scroll-area flex-1 overflow-y-auto"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming}
                  isLast={index === messages.length - 1}
                  onAnswers={sendText}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          disabled={isStreaming}
        />
      </main>
    </div>
  );
}
