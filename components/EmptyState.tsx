import { EXAMPLE_PROMPTS } from "@/lib/constants";
import { HelagiMark } from "./Logo";

// Welcome screen for a new conversation: what Helagi is, how it works, and
// example prompts the visitor can tap to prefill the composer.
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
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-6 text-center sm:py-10">
      <div className="animate-fade-up">
        <HelagiMark className="mx-auto mb-4 h-12 w-12 sm:mb-5 sm:h-16 sm:w-16" />
        <h1 className="font-display text-[26px] font-medium leading-tight tracking-tight text-forest-deep sm:text-3xl md:text-4xl">
          Not feeling well? Let&rsquo;s figure it out.
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-ink/60 sm:mt-3 sm:text-[15px] sm:leading-7">
          Describe your symptoms below and Helagi will help you understand what
          might be going on — and what to do next.
        </p>
      </div>

      {/* How it works — number-beside-text rows on phones, cards on ≥sm */}
      <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:mt-10 sm:grid-cols-3 sm:gap-3">
        {STEPS.map(({ step, title, text }) => (
          <div
            key={step}
            className="card flex items-start gap-3 px-4 py-3 text-left sm:block sm:py-4"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream sm:mb-2.5">
              {step}
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-deep">{title}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-ink/60 sm:mt-1">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Example prompts */}
      <p className="mt-6 text-sm font-medium text-ink/70 sm:mt-10">
        Not sure how to start? Tap one of these:
      </p>
      <div className="mt-3 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-2xl border border-forest/15 bg-white px-4 py-2.5 text-left text-sm leading-6 text-ink/80 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:py-3"
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Emergency note */}
      <div className="mt-6 flex max-w-md items-start gap-2.5 rounded-2xl border border-clay/35 bg-clay/[0.07] px-4 py-3 text-left sm:mt-10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-clay"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <p className="text-xs leading-5 text-ink/60">
          <span className="font-semibold text-clay">In an emergency?</span> For
          severe chest pain, trouble breathing, or heavy bleeding, call your
          local emergency number (like 112 or 911) right away — don&rsquo;t
          wait for a chat.
        </p>
      </div>
    </div>
  );
}
