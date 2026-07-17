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
import { NEW_MESSAGE_MARKER, SESSION_END_MARKER } from "@/lib/constants";
import { streamChat } from "@/lib/streamChat";
import { track } from "@/lib/analytics";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";
import Sidebar, { type SidebarIdentity } from "@/components/Sidebar";
import DoctorSummaryButton from "@/components/DoctorSummaryButton";
import SurveyModal, { type SurveyReason } from "@/components/SurveyModal";
import PrototypeNoticeModal, {
  PROTOTYPE_NOTICE_KEY,
} from "@/components/PrototypeNoticeModal";
import { HelagiLockup } from "@/components/Logo";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Instant placeholder title (first words of the first message). Replaced by a
// short AI-generated title once the first reply has finished — unless the
// user renamed the chat in the meantime.
function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}

// Titles may be renamed by hand; keep them within what the server-side
// history store accepts (chatStore MAX_TITLE_CHARS).
const MAX_TITLE_CHARS = 80;

export default function ChatApp({ identity }: { identity: SidebarIdentity }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Feedback survey. Non-null opens the modal; the reason changes its copy
  // and what happens after submitting ("summary" chains into the doctor
  // summary). endHints maps conversation id → id of the reply the model
  // flagged with SESSION_END_MARKER ("this conversation has probably reached
  // its natural end") — the finished-session prompt only ever shows under
  // that flagged reply, not after every answer. "Not yet" clears the hint
  // until the model flags another reply.
  const [surveyReason, setSurveyReason] = useState<SurveyReason | null>(null);
  const [endHints, setEndHints] = useState<Record<string, string>>({});

  // One-time "free during the prototype, we'd love feedback" welcome. Shown the
  // first time the chat opens on this browser, then remembered so it doesn't
  // nag on later visits.
  const [showNotice, setShowNotice] = useState(false);

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
    try {
      if (window.localStorage.getItem(PROTOTYPE_NOTICE_KEY) !== "1") {
        setShowNotice(true);
      }
    } catch {
      // Storage unavailable (private mode) — just show the welcome.
      setShowNotice(true);
    }
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
  const surveyDone = activeConversation?.surveyDone === true;

  // Marks the active conversation as surveyed (for accounts this persists via
  // the normal autosave, so the survey is never asked twice for one chat).
  const markSurveyDone = useCallback(() => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, surveyDone: true } : c)),
    );
  }, [activeId]);

  // "Have you finished this session?" — only under the newest reply, and only
  // when the model itself flagged that reply as a natural end of the
  // conversation (not after intermediate answers or question rounds).
  const lastMessage = messages[messages.length - 1];
  const showFinishedPrompt =
    !isStreaming &&
    !surveyDone &&
    surveyReason === null &&
    lastMessage?.role === "assistant" &&
    lastMessage.content.trim().length > 0 &&
    endHints[activeConversation?.id ?? ""] === lastMessage.id;

  const dismissFinishedPrompt = useCallback(() => {
    if (!activeConversation) return;
    const id = activeConversation.id;
    setEndHints((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [activeConversation]);

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

  const renameChat = useCallback((id: string, title: string) => {
    const clean = title.trim().replace(/\s+/g, " ").slice(0, MAX_TITLE_CHARS);
    if (!clean) return; // an empty rename keeps the old title
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: clean } : c)),
    );
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  // Asks the model for a proper short title once the first exchange is
  // complete. Fire-and-forget: on any failure the placeholder simply stays.
  // The `c.title === placeholder` guard means a manual rename that happened
  // while this request was in flight always wins.
  const fetchAiTitle = useCallback(
    async (convId: string, userText: string, reply: string) => {
      try {
        const res = await fetch("/api/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: userText,
            assistant: reply.slice(0, 2000),
          }),
        });
        const data = await res.json().catch(() => null);
        const title =
          res.ok && typeof data?.title === "string" ? data.title.trim() : "";
        if (!title) return;
        const placeholder = titleFrom(userText);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId && c.title === placeholder
              ? { ...c, title: title.slice(0, MAX_TITLE_CHARS) }
              : c,
          ),
        );
      } catch {
        // Placeholder title stays.
      }
    },
    [],
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
  // by the clickable questionnaire (which sends compiled answers directly,
  // flagged hidden — the answered card already shows them, so no user bubble).
  const sendText = useCallback(
    async (raw: string, opts?: { hidden?: boolean }) => {
      const text = raw.trim();
      if (!text || isStreaming) return;

      // Resolve the conversation we're writing to (create one if this is a new chat).
      const isNewConversation = !activeId;
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

      const userMessage: Message = {
        id: makeId(),
        role: "user",
        content: text,
        ...(opts?.hidden ? { hidden: true } : {}),
      };
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

      // The reply is accumulated locally too, so the title generator can see
      // it without re-reading React state.
      let reply = "";
      const appendToAssistant = (chunk: string) => {
        reply += chunk;
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
      };

      // Send the full conversation history so follow-ups keep context
      // (e.g. answering the assistant's triage questions). A reply that was
      // split into multiple bubbles (see below) is merged back into a single
      // assistant turn, so the API always sees alternating roles.
      const history: { role: Message["role"]; content: string }[] = [];
      for (const m of conversations.find((c) => c.id === convId)?.messages ??
        []) {
        if (m.content.trim().length === 0) continue;
        const last = history[history.length - 1];
        if (last && last.role === m.role) {
          last.content += "\n\n" + m.content;
        } else {
          history.push({ role: m.role, content: m.content });
        }
      }

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

      // Finalize the streamed reply:
      // - SESSION_END_MARKER means this reply is a natural end of the
      //   conversation — strip it and remember it, which is what makes the
      //   "Have you finished this session?" prompt appear.
      // - NEW_MESSAGE_MARKER separates a finished answer from a trailing
      //   selectable question (e.g. the recovery/care plan offer). Split the
      //   stored message there so the question gets its own bubble and
      //   renders as clickable buttons.
      const hadEndMarker = reply.includes(SESSION_END_MARKER);
      if (hadEndMarker) {
        reply = reply.split(SESSION_END_MARKER).join("").trimEnd();
      }
      const parts = reply
        .split(NEW_MESSAGE_MARKER)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (hadEndMarker || reply.includes(NEW_MESSAGE_MARKER)) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.flatMap((m) => {
                    if (m.id !== assistantId) return [m];
                    if (parts.length === 0) return [{ ...m, content: reply }];
                    // The last part keeps the original id, so the
                    // end-of-session hint below still points at the newest
                    // reply.
                    return parts.map((content, i) =>
                      i === parts.length - 1
                        ? { ...m, content }
                        : {
                            id: makeId(),
                            role: "assistant" as const,
                            content,
                          },
                    );
                  }),
                }
              : c,
          ),
        );
      }
      if (hadEndMarker) {
        setEndHints((prev) => ({ ...prev, [convId]: assistantId }));
      }

      // First exchange of a fresh conversation → ask for a proper AI title
      // (replaces the truncated-text placeholder set above). The title
      // generator sees the reply without internal markers.
      if (isNewConversation) {
        void fetchAiTitle(
          convId,
          text,
          parts.length > 0 ? parts.join("\n\n") : reply,
        );
      }
    },
    [isStreaming, activeId, conversations, fetchAiTitle],
  );

  // Send from the input box.
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendText(text);
  }, [input, sendText]);

  // Send from a questionnaire card: hidden, since the card itself keeps
  // showing the chosen answers.
  const sendAnswers = useCallback(
    (compiled: string) => {
      void sendText(compiled, { hidden: true });
    },
    [sendText],
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectChat}
        onNewChat={startNewChat}
        onRename={renameChat}
        onDelete={deleteChat}
        busy={isStreaming}
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
              <DoctorSummaryButton
                messages={messages}
                disabled={isStreaming}
                surveyDone={surveyDone}
                onRequireSurvey={() => setSurveyReason("summary")}
              />
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
            <DoctorSummaryButton
              messages={messages}
              disabled={isStreaming}
              surveyDone={surveyDone}
              onRequireSurvey={() => setSurveyReason("summary")}
            />
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
              {messages.map((message, index) =>
                // Compiled questionnaire answers stay in the data (the model
                // and the answered card both need them) but get no bubble.
                message.hidden ? null : (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming}
                    isLast={index === messages.length - 1}
                    onAnswers={sendAnswers}
                    userReply={
                      messages[index + 1]?.role === "user"
                        ? messages[index + 1].content
                        : undefined
                    }
                  />
                ),
              )}

              {showFinishedPrompt && (
                <div className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-forest/15 bg-white/70 px-4 py-3 animate-fade-in">
                  <p className="text-sm text-ink/70">
                    Have you finished this session?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        track("finished_yes");
                        // Also dismiss the prompt, so cancelling the survey
                        // doesn't immediately re-ask — it returns after the
                        // next reply instead.
                        dismissFinishedPrompt();
                        setSurveyReason("finished");
                      }}
                      className="btn btn-primary px-3.5 py-1.5 text-sm"
                    >
                      Yes, I&rsquo;m done
                    </button>
                    <button
                      type="button"
                      onClick={dismissFinishedPrompt}
                      className="btn btn-ghost px-3.5 py-1.5 text-sm"
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {showNotice && (
          <PrototypeNoticeModal onClose={() => setShowNotice(false)} />
        )}

        {surveyReason !== null && activeConversation && (
          <SurveyModal
            reason={surveyReason}
            messages={messages}
            onSubmitted={markSurveyDone}
            onClose={() => setSurveyReason(null)}
          />
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
