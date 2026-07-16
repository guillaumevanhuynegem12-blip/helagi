"use client";

// A friendly one-time welcome shown when the chat first opens: Helagi is free
// during the prototype phase (but not forever) and we'd love feedback. It's
// remembered per-browser via localStorage so returning visitors aren't nagged.

import { track } from "@/lib/analytics";

export const PROTOTYPE_NOTICE_KEY = "helagi:prototype-notice-seen";

export default function PrototypeNoticeModal({
  onClose,
}: {
  onClose: () => void;
}) {
  function dismiss() {
    try {
      window.localStorage.setItem(PROTOTYPE_NOTICE_KEY, "1");
    } catch {
      // Private mode / storage disabled — worst case the notice shows again.
    }
    track("prototype_notice_dismissed");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/40 px-4 py-6 animate-fade-in"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prototype-notice-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-y-auto rounded-3xl bg-cream p-6 text-center shadow-lift sm:p-7"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest/10 text-2xl">
          💚
        </div>

        <p className="eyebrow mt-4">Prototype</p>

        <h2
          id="prototype-notice-title"
          className="mt-2 font-display text-2xl font-medium tracking-tight text-forest-deep"
        >
          Free for now — enjoy!
        </h2>

        <div className="mt-3 space-y-3 text-sm leading-6 text-ink/70">
          <p>
            Helagi is free while we&rsquo;re in our prototype phase. It
            won&rsquo;t be forever, but right now it&rsquo;s completely on us.
          </p>
          <p>
            We&rsquo;re learning from real conversations to make it better. If
            anything surprises you — good or bad — we&rsquo;d genuinely love your
            feedback.
          </p>
          <p className="font-medium text-forest-deep">
            Thanks for being here. Enjoy!
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="btn btn-primary btn-md mt-6 w-full"
        >
          Start chatting
        </button>
      </div>
    </div>
  );
}
