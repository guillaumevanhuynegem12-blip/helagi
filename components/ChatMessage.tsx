import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/types";
import { parseTriageQuestions } from "@/lib/parseQuestions";
import TypingIndicator from "./TypingIndicator";
import QuestionCard from "./QuestionCard";

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
  hr: () => <hr className="my-3 border-forest/10" />,
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="mb-2 border-l-2 border-clay pl-3 text-ink/80 last:mb-0"
      {...props}
    />
  ),
};

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

  const triage = useMemo(
    () => (!isUser && interactive ? parseTriageQuestions(message.content) : null),
    [isUser, interactive, message.content],
  );

  if (isUser) {
    return (
      <div className="flex animate-fade-in justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-forest px-4 py-2.5 text-cream">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in justify-start">
      <div className="w-full max-w-[85%] break-words rounded-2xl bg-white px-4 py-3 text-ink ring-1 ring-forest/10">
        {showTyping ? (
          <TypingIndicator />
        ) : triage ? (
          <>
            {triage.stripped && (
              <ReactMarkdown components={markdownComponents}>
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
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
            {showThinkingTrailer && (
              <div className="mt-2">
                <TypingIndicator />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
