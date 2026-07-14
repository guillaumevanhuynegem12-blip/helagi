import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/types";
import { SESSION_END_MARKER } from "@/lib/constants";
import { parseTriageQuestions } from "@/lib/parseQuestions";
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

// The model ends a wrap-up reply with SESSION_END_MARKER; ChatApp strips it
// from the stored message once streaming completes. While tokens are still
// arriving, a complete or half-arrived marker can transiently sit at the end
// of the text — never render it. (A legitimate "[[…" mid-stream un-hides
// itself as soon as more tokens show it isn't the marker.)
function stripEndMarker(text: string): string {
  let out = text.split(SESSION_END_MARKER).join("");
  const max = Math.min(SESSION_END_MARKER.length - 1, out.length);
  for (let len = max; len >= 2; len--) {
    if (out.endsWith(SESSION_END_MARKER.slice(0, len))) {
      out = out.slice(0, -len);
      break;
    }
  }
  return out.trimEnd();
}

export default function ChatMessage({
  message,
  isStreaming,
  isLast = false,
  onAnswers,
}: {
  message: Message;
  isStreaming: boolean;
  /** whether this is the newest message in the conversation */
  isLast?: boolean;
  /** called with the compiled answers when the user submits the questionnaire */
  onAnswers?: (compiled: string) => void;
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
  const content = isUser ? message.content : stripEndMarker(message.content);

  const triage = useMemo(
    () => (!isUser && interactive ? parseTriageQuestions(content) : null),
    [isUser, interactive, content],
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
                disabled={isStreaming}
                onSubmit={onAnswers!}
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
