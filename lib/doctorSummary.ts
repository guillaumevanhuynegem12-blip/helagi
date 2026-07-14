"use client";

// Generates the doctor-handover summary for a conversation and opens it in a
// print view (the user saves it as a PDF from the print dialog). Extracted
// from DoctorSummaryButton so the survey modal can trigger the same flow
// right after the feedback survey unlocks it.
//
// MUST be called directly from a click handler: window.open only escapes
// popup blockers inside a user gesture.

import type { Message } from "@/lib/types";
import {
  buildPrintHtml,
  buildWaitingHtml,
  buildErrorHtml,
} from "@/lib/printSummary";
import { track } from "@/lib/analytics";

export async function openDoctorSummary(messages: Message[]): Promise<void> {
  track("summary_clicked");

  // Open the window synchronously so popup blockers allow it, then fill it in.
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for this site to create the PDF.");
    return;
  }
  win.document.write(buildWaitingHtml());

  try {
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages
          .filter((m) => m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.summary) {
      track("summary_error", { status: res.status });
      const msg = data?.error ?? `Could not create the summary (${res.status}).`;
      win.document.open();
      win.document.write(buildErrorHtml(String(msg)));
      win.document.close();
      return;
    }

    win.document.open();
    win.document.write(buildPrintHtml(data.summary));
    win.document.close();
  } catch {
    track("summary_error");
    win.document.open();
    win.document.write(
      buildErrorHtml(
        "Something went wrong while creating the summary. Please try again.",
      ),
    );
    win.document.close();
  }
}
