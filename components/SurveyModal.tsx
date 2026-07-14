"use client";

// End-of-session feedback survey, shown in two situations:
// - the visitor says "yes, I'm finished" to the finished-session prompt, or
// - they ask for the doctor summary before having answered it (the summary
//   unlocks right after submitting — the thank-you screen offers to create it).
//
// Four questions, under a minute: overall rating, "did you get your answer",
// and two optional free-text fields (what was good / what could be better).

import { useState } from "react";
import type { Message } from "@/lib/types";
import { openDoctorSummary } from "@/lib/doctorSummary";
import { track } from "@/lib/analytics";

export type SurveyReason = "finished" | "summary";

const RATING_LABELS = ["Poor", "Not great", "Okay", "Good", "Excellent"];

export default function SurveyModal({
  reason,
  messages,
  onSubmitted,
  onClose,
}: {
  reason: SurveyReason;
  messages: Message[];
  // Called once the survey is stored — the parent marks the conversation as
  // surveyed (which unlocks the doctor summary).
  onSubmitted: () => void;
  onClose: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [answered, setAnswered] = useState<"yes" | "partly" | "no" | null>(null);
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (rating === null) {
      setError("Please pick a rating first.");
      return;
    }
    if (answered === null) {
      setError("Please tell us whether you got the answer you needed.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          answered,
          liked: liked.trim(),
          improve: improve.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      track("survey_submitted", { rating, answered, reason });
      onSubmitted();
      setDone(true);
    } catch {
      setError(
        "Could not reach the server. Please check your connection and try again.",
      );
    }
    setBusy(false);
  }

  const labelClasses = "mb-1.5 block text-sm font-medium text-forest-deep";
  const chipClasses = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
      active
        ? "border-forest bg-forest text-cream"
        : "border-forest/25 bg-white text-ink/70 hover:border-forest/50"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Feedback survey"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-cream p-6 shadow-lift sm:p-7"
      >
        {done ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-medium tracking-tight text-forest-deep">
              Thank you! 💚
            </h2>
            <p className="text-sm leading-6 text-ink/70">
              Your feedback helps us make Helagi better for everyone.
            </p>
            {reason === "summary" ? (
              <button
                type="button"
                onClick={() => {
                  // Fresh click = user gesture, so the print window may open.
                  void openDoctorSummary(messages);
                  onClose();
                }}
                className="btn btn-primary btn-md w-full"
              >
                Create my doctor summary
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary btn-md w-full"
              >
                Close
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-xl font-medium tracking-tight text-forest-deep">
                {reason === "summary"
                  ? "One quick thing first"
                  : "Before you go…"}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-ink/60">
                {reason === "summary"
                  ? "Please answer a few quick questions — then we'll prepare your doctor summary."
                  : "Mind answering a few quick questions? It takes under a minute."}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-sm text-ink"
              >
                {error}
              </p>
            )}

            <div>
              <span className={labelClasses}>How was Helagi today?</span>
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating from 1 to 5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} out of 5 — ${RATING_LABELS[value - 1]}`}
                    onClick={() => setRating(value)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
                      rating !== null && value <= rating
                        ? "border-forest bg-forest text-cream"
                        : "border-forest/25 bg-white text-ink/60 hover:border-forest/50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 min-h-4 text-xs text-ink/55">
                {rating !== null ? RATING_LABELS[rating - 1] : "1 = poor, 5 = excellent"}
              </p>
            </div>

            <div>
              <span className={labelClasses}>
                Did you get the answer you needed?
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["yes", "Yes"],
                    ["partly", "Partly"],
                    ["no", "No"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnswered(value)}
                    aria-pressed={answered === value}
                    className={chipClasses(answered === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="survey-liked" className={labelClasses}>
                What did you like? <span className="font-normal text-ink/45">(optional)</span>
              </label>
              <textarea
                id="survey-liked"
                value={liked}
                onChange={(e) => setLiked(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="What worked well for you?"
                className="input-field resize-none"
              />
            </div>

            <div>
              <label htmlFor="survey-improve" className={labelClasses}>
                What could be better?{" "}
                <span className="font-normal text-ink/45">(optional)</span>
              </label>
              <textarea
                id="survey-improve"
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Anything confusing, missing, or broken?"
                className="input-field resize-none"
              />
              <p className="mt-1.5 text-xs leading-5 text-ink/45">
                Please don&rsquo;t include personal or medical details.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-md flex-1"
              >
                {reason === "summary" ? "Cancel" : "Not now"}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary btn-md flex-1"
              >
                {busy ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
