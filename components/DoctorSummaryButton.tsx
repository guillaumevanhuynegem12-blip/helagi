"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { openDoctorSummary } from "@/lib/doctorSummary";
import { track } from "@/lib/analytics";

// Opens the doctor-handover summary — but only after the visitor has answered
// the feedback survey for this conversation. Before that, clicking hands off
// to the survey modal (which offers to create the summary once submitted).
export default function DoctorSummaryButton({
  messages,
  disabled,
  surveyDone,
  onRequireSurvey,
}: {
  messages: Message[];
  disabled: boolean;
  surveyDone: boolean;
  onRequireSurvey: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (busy || disabled) return;
    if (!surveyDone) {
      track("summary_survey_gate");
      onRequireSurvey();
      return;
    }
    setBusy(true);
    try {
      await openDoctorSummary(messages);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={disabled || busy}
      title="Create a printable summary of this chat to bring to your doctor"
      className="btn btn-secondary gap-1.5 px-3.5 py-1.5 text-sm"
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
      {busy ? (
        "Preparing…"
      ) : (
        <>
          <span className="sm:hidden">Doctor summary</span>
          <span className="hidden sm:inline">Summary for your doctor</span>
        </>
      )}
    </button>
  );
}
