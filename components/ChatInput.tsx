"use client";

// Message composer pinned under the chat: auto-growing textarea (Enter sends,
// Shift+Enter for a newline) with the medical disclaimer underneath.

import { useEffect, useRef } from "react";
import { MAX_INPUT_CHARS, DISCLAIMER } from "@/lib/constants";

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a max height as the user types.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  const remaining = MAX_INPUT_CHARS - value.length;
  const nearLimit = remaining <= 200;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div className="flex items-end gap-2 rounded-[1.6rem] border border-forest/15 bg-white p-2 shadow-lift transition focus-within:border-forest/40 focus-within:ring-2 focus-within:ring-forest/15">
        <label htmlFor="chat-input" className="sr-only">
          Describe your symptoms or ask a health question
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          autoFocus
          value={value}
          maxLength={MAX_INPUT_CHARS}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your symptoms or ask a health question…"
          className="max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-ink/40"
        />
        {nearLimit && (
          <span
            className={`pb-2.5 text-xs tabular-nums ${remaining <= 40 ? "text-clay" : "text-ink/40"}`}
            aria-live="polite"
          >
            {remaining}
          </span>
        )}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition enabled:hover:bg-forest-deep enabled:hover:shadow-glow enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-center text-xs leading-5 text-ink/40">
        {DISCLAIMER}
      </p>
    </div>
  );
}
