"use client";

import { useState } from "react";
import type { ParsedQuestion } from "@/lib/parseQuestions";

// Clickable questionnaire rendered inside the assistant bubble: each question
// with its option buttons right next to it (plus a small text field for
// free-text ones). Compiles the answers into a single numbered message that
// repeats each question, so the sent message is self-explanatory.
export default function QuestionCard({
  questions,
  disabled,
  onSubmit,
}: {
  questions: ParsedQuestion[];
  disabled: boolean;
  onSubmit: (compiled: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [extra, setExtra] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const locked = disabled || submitted;

  const optionQuestions = questions.filter((q) => q.options);
  const allChosen = optionQuestions.every(
    (q) => (answers[q.number] ?? "").length > 0,
  );

  function pick(num: number, choice: string) {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [num]: choice }));
  }

  function submit() {
    if (locked || !allChosen) return;
    const lines = questions
      .map((q) => {
        const a = (answers[q.number] ?? "").trim();
        return a ? `${q.number}. ${q.text} — ${a}` : null;
      })
      .filter(Boolean) as string[];
    const extraInfo = extra.trim();
    if (extraInfo) lines.push(`Extra info: ${extraInfo}`);
    if (lines.length === 0) return;
    setSubmitted(true);
    onSubmit(lines.join("\n"));
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-forest/10 pt-3">
      {questions.map((q) =>
        q.options ? (
          // Question text with its answer buttons right next to it, on the
          // same row (buttons wrap below on narrow screens).
          <div
            key={q.number}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            <p className="text-[15px] font-medium text-ink">
              {q.number}. {q.text}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt) => {
                const selected = answers[q.number] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={locked}
                    onClick={() => pick(q.number, opt)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      selected
                        ? "border-forest bg-forest text-cream"
                        : "border-forest/25 bg-white text-forest enabled:hover:bg-cream-muted"
                    } disabled:opacity-60`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div key={q.number}>
            <p className="mb-1.5 text-[15px] font-medium text-ink">
              {q.number}. {q.text}
            </p>
            <input
              type="text"
              disabled={locked}
              value={answers[q.number] ?? ""}
              onChange={(e) => pick(q.number, e.target.value)}
              placeholder="Type a short answer (optional)"
              className="w-full max-w-sm rounded-xl border border-forest/20 bg-white px-3 py-1.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-forest/40 disabled:opacity-60"
            />
          </div>
        ),
      )}

      {!submitted && (
        <>
          <div>
            <p className="mb-1.5 text-[15px] font-medium text-ink">
              Anything else you want to add?{" "}
              <span className="font-normal text-ink/45">(optional)</span>
            </p>
            <textarea
              rows={2}
              disabled={locked}
              value={extra}
              maxLength={1000}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="e.g. it hurts more at night, I take blood thinners…"
              className="w-full resize-none rounded-xl border border-forest/20 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-forest/40 disabled:opacity-60"
            />
          </div>

          <div>
            <button
              type="button"
              disabled={locked || !allChosen}
              onClick={submit}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-medium text-cream transition enabled:hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send my answers
            </button>
            {!allChosen && (
              <span className="ml-3 text-xs text-ink/45">
                Please answer all the questions first
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
