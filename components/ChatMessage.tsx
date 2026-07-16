import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/types";
import { NEW_MESSAGE_MARKER, SESSION_END_MARKER } from "@/lib/constants";
import { matchAnswers, parseTriageQuestions } from "@/lib/parseQuestions";
import TypingIndicator from "./TypingIndicator";
import QuestionCard from "./QuestionCard";
import { HelagiMark } from "./Logo";

// Styled markdown for assistant answers (triage headings, bold options, lists).
const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-2 last:mb-0" {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-forest-deep" {...props} />
  ),
  h1: (props: React.ComponentProps<"h1">) => (
    <h3 className="mb-1.5 mt-3 font-display text-lg text-forest-deep first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h3 className="mb-1.5 mt-3 font-display text-lg text-forest-deep first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h4 className="mb-1 mt-3 font-semibold text-forest-deep first:mt-0" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => <li {...props} />,
  a: (props: React.ComponentProps<"a">) => (
    <a
      className="text-forest underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      className="rounded bg-cream-muted px-1 py-0.5 font-mono text-[13px]"
      {...props}
    />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[14px]" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th
      className="border-b border-forest/20 bg-cream-muted px-3 py-1.5 text-left font-semibold text-forest-deep"
      {...props}
    />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td className="border-b border-forest/10 px-3 py-1.5 align-top" {...props} />
  ),
  hr: () => <hr className="my-3 border-forest/10" />,
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="mb-2 border-l-2 border-clay pl-3 text-ink/80 last:mb-0"
      {...props}
    />
  ),
};

// The model ends a wrap-up reply with SESSION_END_MARKER and separates a
// trailing question from the answer with NEW_MESSAGE_MARKER; ChatApp handles
// both once streaming completes (strip / split into a second bubble). While
// tokens are still arriving, a complete or half-arrived marker can
// transiently sit in the text — never render it. A complete NEW_MESSAGE_MARKER
// mid-stream just reads as a paragraph break until the split happens.
// (A legitimate "[[…" mid-stream un-hides itself as soon as more tokens show
// it isn't a marker.)
const MARKERS = [SESSION_END_MARKER, NEW_MESSAGE_MARKER];

function stripMarkers(text: string): string {
  let out = text
    .split(NEW_MESSAGE_MARKER)
    .join("\n\n")
    .split(SESSION_END_MARKER)
    .join("");
  let partial = 0;
  for (const marker of MARKERS) {
    const max = Math.min(marker.length - 1, out.length);
    for (let len = max; len >= 2; len--) {
      if (out.endsWith(marker.slice(0, len))) {
        partial = Math.max(partial, len);
        break;
      }
    }
  }
  if (partial > 0) out = out.slice(0, -partial);
  return out.trimEnd();
}

// Older replies (and the occasional model slip) have a heading glued to the
// end of the previous sentence — "…your situation.## What this most likely
// is" — where markdown needs the "##" at the start of a line. Give such
// headings their own paragraph. (The chat route now inserts the break itself
// between tool turns; this covers saved history.)
function normalizeHeadings(text: string): string {
  return text.replace(/([^\n#])(#{2,6} )/g, "$1\n\n$2");
}

export default function ChatMessage({
  message,
  isStreaming,
  isLast = false,
  onAnswers,
  userReply,
}: {
  message: Message;
  isStreaming: boolean;
  /** whether this is the newest message in the conversation */
  isLast?: boolean;
  /** called with the compiled answers when the user submits the questionnaire */
  onAnswers?: (compiled: string) => void;
  /**
   * the user message that followed this one, if any — used to restore the
   * chosen options on an already-answered questionnaire
   */
  userReply?: string;
}) {
  const isUser = message.role === "user";
  // Show the typing indicator only for an assistant turn that has no text yet.
  const showTyping = !isUser && isStreaming && message.content.length === 0;
  // Only offer the clickable questionnaire on the newest, fully-streamed reply.
  const interactive = isLast && !isStreaming && !!onAnswers;

  // If the answer is taking long — the reply has started but the stream has
  // paused (e.g. Helagi is looking something up) — re-show the moving dots so
  // the user can tell it's still thinking. Any new text resets the timer, so
  // this only appears during a genuine pause, not while tokens are flowing.
  const streamingHere = !isUser && isStreaming && isLast;
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (!streamingHere) {
      setStalled(false);
      return;
    }
    setStalled(false);
    const timer = setTimeout(() => setStalled(true), 1200);
    return () => clearTimeout(timer);
  }, [streamingHere, message.content]);
  const showThinkingTrailer =
    streamingHere && message.content.length > 0 && stalled;

  // Marker-free view of the message used for everything visible: rendering,
  // question parsing, and the copy button.
  const content = isUser
    ? message.content
    : normalizeHeadings(stripMarkers(message.content));

  // Parse the questionnaire on every settled assistant message — not just the
  // newest one — so an answered card keeps its pill look instead of reverting
  // to raw "Options: Yes / No" text once the next reply arrives.
  const triage = useMemo(
    () =>
      !isUser && !showTyping && !streamingHere
        ? parseTriageQuestions(content)
        : null,
    [isUser, showTyping, streamingHere, content],
  );

  // For an already-answered questionnaire, recover which options the user
  // picked from the answer message that followed it.
  const answered = useMemo(
    () =>
      triage && !interactive && userReply
        ? matchAnswers(triage.questions, userReply)
        : undefined,
    [triage, interactive, userReply],
  );

  // "Copy response" below finished assistant replies. Copies the raw message
  // text (the questionnaire blocks read fine as plain text). The icon flips
  // to a checkmark for a moment as feedback.
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  async function copyResponse() {
    const text = content.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers / non-secure contexts: textarea + execCommand fallback.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        ta.remove();
      }
    }
    setCopied(true);
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  // Only completed replies can be copied — not the typing indicator, not a
  // reply that is still streaming in.
  const showCopy =
    !isUser && !showTyping && !streamingHere && content.trim().length > 0;

  if (isUser) {
    return (
      <div className="flex animate-fade-in justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-forest px-4 py-2.5 leading-7 text-cream">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in items-start justify-start gap-2.5">
      <HelagiMark className="mt-1.5 hidden h-6 w-6 shrink-0 sm:block" />
      <div className="flex w-full max-w-[85%] flex-col items-start">
        <div className="w-full break-words rounded-2xl rounded-tl-md bg-white px-4 py-3 leading-7 text-ink shadow-soft ring-1 ring-forest/10">
          {showTyping ? (
            <TypingIndicator />
          ) : triage ? (
            <>
              {triage.stripped && (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {triage.stripped}
                </ReactMarkdown>
              )}
              <QuestionCard
                questions={triage.questions}
                disabled={!interactive}
                onSubmit={interactive ? onAnswers : undefined}
                answered={answered}
              />
            </>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
              </ReactMarkdown>
              {showThinkingTrailer && (
                <div className="mt-2">
                  <TypingIndicator />
                </div>
              )}
            </>
          )}
        </div>

        {showCopy && (
          <button
            type="button"
            onClick={copyResponse}
            aria-label={copied ? "Copied" : "Copy response"}
            title={copied ? "Copied!" : "Copy response"}
            className="mt-1 flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-medium text-ink/40 transition hover:bg-forest/[0.07] hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            {copied ? (
              <>
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
                  className="text-leaf"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
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
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
