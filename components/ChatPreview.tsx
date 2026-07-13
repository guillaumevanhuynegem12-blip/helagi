// Static, non-interactive preview of a Helagi conversation for the landing
// page hero. Built from the same visual language as the real chat (bubbles,
// question chips, composer) so what visitors see is what they get. Purely
// illustrative — exposed to assistive tech as a single labelled image.

import { HelagiMark } from "./Logo";

function Chip({ label, selected = false }: { label: string; selected?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[12.5px] font-medium ${
        selected
          ? "border-forest bg-forest text-cream"
          : "border-forest/25 bg-white text-forest"
      }`}
    >
      {label}
    </span>
  );
}

export default function ChatPreview({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Preview of a Helagi conversation: a person describes a swollen knee, and Helagi replies with simple follow-up questions to understand what is going on."
      className={`relative ${className}`}
    >
      {/* soft brand glow behind the card — subtle, not neon */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-sage/25 via-transparent to-clay/15 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-lift">
        {/* Window bar */}
        <div className="flex items-center justify-between border-b border-forest/10 bg-cream/60 px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-forest/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-forest/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-forest/15" />
          </div>
          <div className="flex items-center gap-1.5">
            <HelagiMark className="h-4 w-4" crop />
            <span className="font-display text-sm lowercase leading-none text-forest">
              helagi
            </span>
          </div>
          <span className="w-10" aria-hidden="true" />
        </div>

        {/* Conversation */}
        <div className="flex flex-col gap-3 px-4 py-5 sm:px-5">
          {/* user message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-forest px-4 py-2.5 text-[13.5px] leading-5 text-cream">
              My knee is swollen and it hurts to walk
            </div>
          </div>

          {/* assistant reply with question chips */}
          <div className="flex items-start gap-2.5">
            <HelagiMark className="mt-1 h-5 w-5 shrink-0" />
            <div className="w-full max-w-[85%] rounded-2xl rounded-tl-md border border-forest/10 bg-white px-4 py-3 shadow-soft">
              <p className="text-[13.5px] leading-5 text-ink">
                I&rsquo;m sorry — that sounds uncomfortable. A few quick
                questions so I can understand it better:
              </p>
              <div className="mt-3 space-y-2.5 border-t border-forest/10 pt-3">
                <div>
                  <p className="text-[12.5px] font-medium text-ink">
                    1. Did it start after a fall, twist, or knock?
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Chip label="Yes" selected />
                    <Chip label="No" />
                  </div>
                </div>
                <div>
                  <p className="text-[12.5px] font-medium text-ink">
                    2. Is the knee warm or red to the touch?
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Chip label="Yes" />
                    <Chip label="No" />
                    <Chip label="Not sure" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* thinking dots */}
          <div className="flex items-center gap-2.5" aria-hidden="true">
            <HelagiMark className="h-5 w-5 shrink-0" />
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-forest/10 bg-white px-4 py-3 shadow-soft">
              <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-sage [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-sage [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-sage [animation-delay:400ms]" />
            </div>
          </div>
        </div>

        {/* Composer mock */}
        <div className="px-4 pb-4 sm:px-5">
          <div className="flex items-center gap-2 rounded-full border border-forest/15 bg-white py-2 pl-4 pr-2 shadow-soft">
            <span className="flex-1 text-[13px] text-ink/35">
              Describe your symptoms…
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-cream">
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
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
