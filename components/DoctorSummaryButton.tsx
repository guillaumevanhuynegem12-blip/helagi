"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { buildPrintHtml, escapeHtml } from "@/lib/printSummary";
import { track } from "@/lib/analytics";

// Generates a doctor-handover summary of the current conversation and opens it
// in a print view (user saves as PDF from the print dialog).
export default function DoctorSummaryButton({
  messages,
  disabled,
}: {
  messages: Message[];
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (busy || disabled) return;
    track("summary_clicked");

    // Open the window synchronously so popup blockers allow it, then fill it in.
    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow pop-ups for this site to create the PDF.");
      return;
    }
    win.document.write(
      "<title>Preparing summary…</title><body style='font-family:sans-serif;padding:40px;color:#23332b'>Preparing your summary…</body>",
    );

    setBusy(true);
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
        win.document.write(
          `<body style='font-family:sans-serif;padding:40px;color:#23332b'>${escapeHtml(String(msg))}</body>`,
        );
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
        "<body style='font-family:sans-serif;padding:40px;color:#23332b'>Something went wrong while creating the summary. Please try again.</body>",
      );
      win.document.close();
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
