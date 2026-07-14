// Builds the printable doctor-summary page and drives the browser's print
// dialog (where the user picks "Save as PDF").

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Minimal markdown → HTML for the fixed structure the summary uses
// (## headings, "- " bullets, **bold**). Input is escaped first.
function mdToHtml(md: string): string {
  const lines = escapeHtml(md).split("\n");
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const bolded = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${bolded.slice(4)}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${bolded.slice(3)}</h2>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${bolded.slice(2)}</li>`);
    } else {
      closeList();
      out.push(`<p>${bolded}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

const MARK_SVG = `<svg viewBox="6 28 108 82" width="34" height="26" xmlns="http://www.w3.org/2000/svg"><g stroke="#1F5C45" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.9"><path d="M60 95 C 53 100, 47 102, 41 106"/><path d="M60 95 C 60 101, 60 104, 60 108"/><path d="M60 95 C 67 100, 73 102, 79 106"/></g><path d="M60 96 C 57 82, 63 68, 60 52" stroke="#1F5C45" stroke-width="4.4" fill="none" stroke-linecap="round"/><g fill="#D98E5A"><circle cx="58.3" cy="84" r="2.5"/><circle cx="61.2" cy="74" r="2.5"/><circle cx="59.2" cy="63.5" r="2.5"/></g><path d="M60 55 C 49 53, 39 48, 33 39 C 42 39, 53 44, 60 55 Z" fill="#74B58C"/><path d="M60 48 C 70 45, 80 40, 85 31 C 75 32, 64 38, 60 48 Z" fill="#4E9E72"/></svg>`;

// Shell for the transient popup states (loading / error) shown while the
// summary is generated. Branded — cream canvas, white card, the mark — so the
// wait looks intentional instead of like a broken blank tab. Inline CSS only:
// this document lives in a fresh popup with no access to the app's styles.
function popupShell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #F6F1E7;
    font-family: ui-sans-serif, system-ui, "Segoe UI", Arial, sans-serif;
    color: #23332B;
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .card {
    background: #fff;
    border: 1px solid rgba(31, 92, 69, .12);
    border-radius: 24px;
    padding: 44px 40px;
    max-width: 430px; width: 100%;
    text-align: center;
    box-shadow: 0 2px 6px rgba(20, 59, 44, .05), 0 20px 48px -16px rgba(20, 59, 44, .18);
  }
  .brand { display: flex; align-items: flex-end; justify-content: center; gap: 8px; margin-bottom: 28px; }
  .brand span { font-family: Georgia, serif; font-size: 24px; color: #1F5C45; line-height: .85; }
  h1 { font-family: Georgia, serif; font-size: 22px; font-weight: 500; color: #143B2C; margin-bottom: 10px; }
  p { font-size: 14.5px; line-height: 1.6; color: rgba(35, 51, 43, .7); }
  .dots { display: flex; gap: 7px; justify-content: center; margin: 26px 0 4px; }
  .dots i {
    width: 9px; height: 9px; border-radius: 50%;
    background: #1F5C45;
    animation: bounce 1.2s infinite ease-in-out;
  }
  .dots i:nth-child(2) { animation-delay: .15s; }
  .dots i:nth-child(3) { animation-delay: .3s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: .35; }
    40% { transform: translateY(-5px); opacity: 1; }
  }
  .icon { margin: 0 auto 18px; }
  .hint { margin-top: 22px; font-size: 12.5px; color: rgba(35, 51, 43, .5); }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">${MARK_SVG}<span>helagi</span></div>
    ${inner}
  </div>
</body>
</html>`;
}

// Shown the moment the popup opens, while /api/summary is still working.
export function buildWaitingHtml(): string {
  return popupShell(
    "Preparing your summary — Helagi",
    `<h1>Preparing your summary</h1>
    <p>Helagi is turning your conversation into a clean, printable handover for your doctor.</p>
    <div class="dots"><i></i><i></i><i></i></div>
    <p class="hint">This usually takes a few seconds — keep this tab open, the print window opens automatically.</p>`,
  );
}

// Friendly branded error state for the same popup (message is escaped here).
export function buildErrorHtml(message: string): string {
  return popupShell(
    "Summary — Helagi",
    `<svg class="icon" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#D98E5A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
      <path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
    <h1>Couldn&rsquo;t create the summary</h1>
    <p>${escapeHtml(message)}</p>
    <p class="hint">You can close this tab and try again from the chat.</p>`,
  );
}

export function buildPrintHtml(summaryMarkdown: string): string {
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // The document's own "# " title line becomes the page heading.
  let title = "Summary";
  let body = summaryMarkdown;
  const titleMatch = summaryMarkdown.match(/^\s*#\s+(.+)\s*$/m);
  if (titleMatch) {
    title = titleMatch[1].replace(/\*\*/g, "").trim();
    body = summaryMarkdown.replace(titleMatch[0], "").trim();
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Helagi — Summary for your doctor</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #23332b;
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 32px;
    line-height: 1.5;
  }
  header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #1F5C45; padding-bottom: 14px; margin-bottom: 8px;
  }
  .brand { display: flex; align-items: flex-end; gap: 8px; }
  .brand span { font-size: 26px; color: #1F5C45; line-height: 0.85; }
  .date { font-size: 13px; color: #6b7a70; }
  h1 { font-size: 20px; font-weight: 500; color: #143B2C; margin: 18px 0 4px; }
  .note {
    font-size: 12.5px; color: #6b7a70; font-style: italic;
    margin-bottom: 18px;
  }
  h2 {
    font-size: 15px; color: #143B2C; margin: 18px 0 6px;
    border-bottom: 1px solid rgba(31,92,69,.2); padding-bottom: 3px;
  }
  h3 { font-size: 14px; color: #143B2C; margin: 12px 0 4px; }
  ul { padding-left: 20px; margin-bottom: 6px; }
  li { margin-bottom: 3px; font-size: 14px; }
  p { font-size: 14px; margin-bottom: 6px; }
  footer {
    margin-top: 28px; padding-top: 12px; border-top: 1px solid rgba(31,92,69,.2);
    font-size: 11.5px; color: #6b7a70;
  }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <header>
    <div class="brand">${MARK_SVG}<span>helagi</span></div>
    <div class="date">${date}</div>
  </header>
  <h1>${escapeHtml(title)}</h1>
  <p class="note">Prepared from a conversation with the Helagi medical assistant. AI-generated — for information and discussion, not a diagnosis or a substitute for professional advice.</p>
  ${mdToHtml(body)}
  <footer>Generated by Helagi (helagi medical AI assistant) on ${date}. This document reflects only what the user reported in the chat and the AI's non-diagnostic suggestions. Professional judgement always takes precedence.</footer>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body>
</html>`;
}
