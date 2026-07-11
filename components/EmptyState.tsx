import { EXAMPLE_PROMPTS } from "@/lib/constants";
import { HelagiMark } from "./Logo";

// Plain-language "how it works" shown to first-time visitors so they instantly
// understand what Helagi is and what will happen when they type.
const STEPS = [
  {
    step: "1",
    title: "Tell us what's wrong",
    text: "Describe how you feel in your own words — no medical terms needed.",
  },
  {
    step: "2",
    title: "Answer a few questions",
    text: "Helagi asks simple yes/no questions to understand you better.",
  },
  {
    step: "3",
    title: "Get clear answers",
    text: "Plain-language guidance, plus a summary you can print for your doctor.",
  },
];

export default function EmptyState({
  onSelectPrompt,
}: {
  onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
      <HelagiMark className="mb-4 h-14 w-14" />
      <h1 className="font-display text-3xl font-medium tracking-tight text-forest-deep sm:text-4xl">
        Not feeling well? Let&rsquo;s figure it out.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-6 text-ink/60">
        Helagi is a free health assistant. Describe your symptoms and it will
        help you understand what might be going on — and what to do next.
      </p>

      {/* How it works */}
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map(({ step, title, text }) => (
          <div
            key={step}
            className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-4 text-left"
          >
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream">
              {step}
            </div>
            <p className="text-sm font-semibold text-forest-deep">{title}</p>
            <p className="mt-1 text-[13px] leading-5 text-ink/60">{text}</p>
          </div>
        ))}
      </div>

      {/* Example prompts */}
      <p className="mt-8 text-sm font-medium text-ink/70">
        Not sure how to start? Tap one of these:
      </p>
      <div className="mt-3 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-2xl border border-forest/10 bg-white px-4 py-3 text-left text-sm text-ink/80 transition hover:border-forest/25 hover:bg-cream-muted"
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Emergency note */}
      <p className="mt-8 max-w-md text-xs leading-5 text-ink/50">
        <span className="font-semibold text-clay">In an emergency?</span>{" "}
        For severe chest pain, trouble breathing, or heavy bleeding, call your
        local emergency number (like 112 or 911) right away — don&rsquo;t wait
        for a chat.
      </p>
    </div>
  );
}
