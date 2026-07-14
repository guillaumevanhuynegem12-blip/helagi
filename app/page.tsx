// Landing page ("/"). The chat itself lives at /chat — visitors get there by
// logging in, creating an account, or continuing as guest. Server component:
// it reads the identity cookie only to swap "Log in / Create account" for
// "Open Helagi" when the visitor already has a session.

import Link from "next/link";
import { getIdentity } from "@/lib/auth";
import { HelagiLockup } from "@/components/Logo";
import ChatPreview from "@/components/ChatPreview";
import Footer from "@/components/Footer";
import GuestButton from "@/components/GuestButton";
import Reveal from "@/components/Reveal";

/* --- Small inline icon set (stroke inherits currentColor) ----------------- */

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const icons = {
  check: (
    <path d="m5 13 4 4L19 7" />
  ),
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  list: (
    <>
      <path d="M9 6h12" />
      <path d="M9 12h12" />
      <path d="M9 18h12" />
      <path d="m3 5.5 1 1 2-2" />
      <path d="m3 11.5 1 1 2-2" />
      <path d="m3 17.5 1 1 2-2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  heart: (
    <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4.9-4.5 2.3A5.6 5.6 0 0 0 7.5 3 5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
  ),
  stethoscope: (
    <>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .1.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </>
  ),
  cap: (
    <>
      <path d="M22 10 12 5 2 10l10 5z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      <path d="M22 10v6" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z" />
  ),
  shield: (
    <path d="M12 22s8-3.6 8-9V5l-8-3-8 3v8c0 5.4 8 9 8 9z" />
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 3" />
    </>
  ),
};

/* --- Page content ---------------------------------------------------------- */

const HERO_POINTS = [
  "Free during the prototype phase",
  "Private by design",
  "There day and night",
];

const STEPS = [
  {
    step: "1",
    title: "Tell us what's wrong",
    text: "Describe how you feel in your own words — no medical terms needed.",
  },
  {
    step: "2",
    title: "Answer a few questions",
    text: "Helagi asks simple tap-to-answer questions to understand you better.",
  },
  {
    step: "3",
    title: "Get clear answers",
    text: "Plain-language guidance on what's likely going on and how urgent it looks.",
  },
];

const FEATURES = [
  {
    icon: icons.chat,
    title: "Plain-language answers",
    text: "No jargon, no scare tactics. Helagi explains what is most likely going on the way a calm, careful friend would.",
  },
  {
    icon: icons.list,
    title: "Guided follow-up questions",
    text: "Instead of a blank text box, Helagi asks simple structured questions you can answer with a tap.",
  },
  {
    icon: icons.compass,
    title: "Clear urgency guidance",
    text: "Every conversation tells you how urgent things look — self-care at home, a doctor's visit, or emergency care now.",
  },
  {
    icon: icons.file,
    title: "A summary for your doctor",
    text: "One click turns your conversation into a clean, printable summary you can bring to your appointment.",
  },
  {
    icon: icons.history,
    title: "Your history, when you want it",
    text: "With a free account your chats are saved privately so you can pick up where you left off. As a guest, nothing is stored at all.",
  },
  {
    icon: icons.book,
    title: "There whenever worry strikes",
    text: "3 a.m. or Sunday afternoon — Helagi answers the moment you need it. No appointment, no waiting room, no rush.",
  },
];

const AUDIENCES = [
  {
    icon: icons.heart,
    title: "For you and your family",
    text: "Late-night worries, a child's fever, a pain that won't go away — get a calm read on what it might be and whether it can wait until morning.",
  },
  {
    icon: icons.stethoscope,
    title: "For medical professionals",
    text: "Patients arrive with a structured, printable summary of their symptoms instead of a vague story — a clearer starting point for the consult. Helagi never replaces clinical judgment.",
  },
  {
    icon: icons.cap,
    title: "For students",
    text: "A calm way to explore how symptoms are described, questioned, and triaged — the same way you'll meet them in practice.",
  },
];

const TRUST_POINTS = [
  {
    icon: icons.book,
    title: "Careful with every answer",
    text: "Medical answers are double-checked before they reach you — and when something is uncertain, Helagi says so instead of guessing.",
  },
  {
    icon: icons.lock,
    title: "Private by design",
    text: "As a guest, your conversations never touch our servers. With an account, your chats are saved privately for you alone. We never ask for medical details to sign up — just an email.",
  },
  {
    icon: icons.shield,
    title: "Honest about limits",
    text: "Helagi tells you how urgent things look and when to see a professional. It never claims to diagnose you, and it says so plainly.",
  },
  {
    icon: icons.alert,
    title: "Clear in emergencies",
    text: "If your answers point to something serious, Helagi tells you directly to seek emergency care — before anything else.",
  },
];

const EMERGENCY_SIGNS = [
  "Severe chest pain or pressure",
  "Serious trouble breathing",
  "Heavy bleeding that won't stop",
  "Sudden weakness, numbness, or confusion",
];

export default async function LandingPage() {
  const identity = await getIdentity();
  const signedIn = identity?.type === "user";

  return (
    <div id="top" className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          {/* Plain hash link: scrolls smoothly back to the top of the page */}
          <a
            href="#top"
            aria-label="Back to the top of the page"
            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            <HelagiLockup size="lg" />
          </a>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Sections"
          >
            {[
              ["Why we exist", "#why"],
              ["How it works", "#how-it-works"],
              ["What you get", "#what-you-get"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/70 transition hover:bg-forest/[0.07] hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                {label}
              </a>
            ))}
          </nav>

          <nav className="flex items-center gap-2" aria-label="Account">
            {signedIn ? (
              <Link href="/chat" className="btn btn-primary btn-md">
                Open Helagi
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-md">
                  Log in
                </Link>
                <Link href="/register" className="btn btn-primary btn-md">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="shell grid items-center gap-12 pb-16 pt-12 lg:grid-cols-2 lg:gap-14 lg:pb-24 lg:pt-20">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow">Free AI symptom guidance</p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.08] tracking-tight text-forest-deep sm:text-5xl lg:text-[3.4rem]">
              Not feeling well?
              <br />
              Let&rsquo;s figure it out — calmly.
            </h1>
            <p className="mt-6 text-[17px] leading-8 text-ink/70">
              Searching your symptoms online usually ends in worry. Helagi
              exists so it doesn&rsquo;t have to: describe how you feel in your
              own words and get a calm, clear picture of what might be going on
              — and what to do next.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={signedIn ? "/chat" : "#get-started"}
                className="btn btn-primary btn-lg"
              >
                {signedIn ? "Open Helagi" : "Start using Helagi"}
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                See how it works
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {HERO_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 text-sm font-medium text-ink/65"
                >
                  <Icon className="h-4 w-4 text-leaf">{icons.check}</Icon>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up lg:justify-self-end [animation-delay:150ms]">
            <ChatPreview className="mx-auto w-full max-w-md lg:max-w-lg" />
          </div>
        </section>

        {/* Always-visible medical disclaimer */}
        <div className="shell pb-16 lg:pb-20">
          <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-clay/35 bg-white/80 px-5 py-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-clay">
              {icons.alert}
            </Icon>
            <p className="text-[13.5px] leading-6 text-ink/75">
              <span className="font-semibold text-clay">Please note:</span>{" "}
              Helagi provides general health information. It is not a diagnosis
              and does not replace a doctor, emergency service, or other
              qualified healthcare professional. In an emergency, call your
              local emergency number (like 112 or 911) right away.
            </p>
          </div>
        </div>

        {/* WHY — Helagi's belief and ambition (the Golden Circle: start with why) */}
        <section id="why" className="shell scroll-mt-24 pb-16 lg:pb-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why we exist</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-forest-deep sm:text-4xl">
              We believe everyone deserves to understand their own health
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-ink/70">
              That belief is where Helagi begins. Today, understanding what is
              happening in your own body is harder than it should be — clear
              answers hide behind medical jargon, waiting rooms, and
              frightening search results, and worry fills the gap.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-ink/70">
              Our ambition is to close that gap: calm, honest health
              understanding for everyone, everywhere, at any hour. Every
              question Helagi asks and every answer it gives exists in service
              of that goal — the product is simply how we pursue it.
            </p>
          </Reveal>
        </section>

        {/* HOW — the three steps */}
        <section
          id="how-it-works"
          className="scroll-mt-24 border-y border-forest/10 bg-white/70"
        >
          <div className="shell py-16 lg:py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-forest-deep sm:text-4xl">
                Three simple steps to clarity
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-ink/65">
                No forms, no medical vocabulary, no account required. Just a
                conversation that takes you seriously.
              </p>
            </Reveal>

            <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
              {/* connector line on desktop */}
              <div
                aria-hidden="true"
                className="absolute left-[16.67%] right-[16.67%] top-6 hidden border-t-2 border-dashed border-forest/15 sm:block"
              />
              {STEPS.map(({ step, title, text }, i) => (
                <Reveal key={step} delay={i * 120} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest font-display text-lg text-cream shadow-glow">
                      {step}
                    </div>
                    <h3 className="mt-5 text-[17px] font-semibold text-forest-deep">
                      {title}
                    </h3>
                    <p className="mt-2 max-w-xs text-[14px] leading-6 text-ink/65">
                      {text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOW — the promises behind every answer (dark band) */}
        <section id="trust" className="scroll-mt-24">
          <div className="shell py-16 lg:py-24">
            <div className="overflow-hidden rounded-3xl bg-forest-deep bg-gradient-to-br from-forest-deep via-forest-deep to-forest px-6 py-12 text-cream sm:px-10 lg:px-14 lg:py-16">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
                  Trust &amp; safety
                </p>
                <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
                  Built to be careful
                </h2>
                <p className="mt-4 text-[15px] leading-7 text-cream/70">
                  Health guidance is only useful if you can rely on it — and
                  know exactly where its limits are.
                </p>
              </Reveal>

              <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
                {TRUST_POINTS.map(({ icon, title, text }, i) => (
                  <Reveal key={title} delay={(i % 2) * 100}>
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sage">
                        <Icon>{icon}</Icon>
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold">{title}</h3>
                        <p className="mt-1.5 text-[13.5px] leading-6 text-cream/70">
                          {text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHAT — the product itself */}
        <section id="what-you-get" className="shell scroll-mt-24 pb-16 lg:pb-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What you get</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-forest-deep sm:text-4xl">
              More than a chat box
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-ink/65">
              Helagi is built end-to-end around one job: helping you understand
              a health worry and decide what to do next.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <div className="card h-full px-6 py-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/[0.08] text-forest">
                    <Icon>{icon}</Icon>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-forest-deep">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-ink/65">
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Audiences */}
        <section
          id="who-it-helps"
          className="scroll-mt-24 border-y border-forest/10 bg-white/70"
        >
          <div className="shell py-16 lg:py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Who it helps</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-forest-deep sm:text-4xl">
                Made for real health worries
              </h2>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              {AUDIENCES.map(({ icon, title, text }, i) => (
                <Reveal key={title} delay={i * 100}>
                  <div className="card h-full px-6 py-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage/20 text-forest">
                      <Icon>{icon}</Icon>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-forest-deep">
                      {title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-6 text-ink/65">
                      {text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Support, not a replacement for care */}
        <section className="shell py-16 lg:py-24">
          <Reveal>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="card px-6 py-8 sm:px-8">
                <p className="eyebrow">Know the limits</p>
                <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-forest-deep sm:text-3xl">
                  Helagi supports you.
                  <br />
                  It never replaces care.
                </h2>
                <p className="mt-4 text-[15px] leading-7 text-ink/70">
                  Helagi helps you understand symptoms, prepare for
                  appointments, and decide how urgent something looks. It does
                  not diagnose, prescribe, or replace the judgment of a
                  healthcare professional — and it will tell you so whenever a
                  situation needs real medical eyes.
                </p>
              </div>

              <div className="rounded-2xl border border-clay/40 bg-clay/[0.08] px-6 py-8 sm:px-8">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-5 w-5 text-clay">{icons.phone}</Icon>
                  <h3 className="text-[15px] font-semibold text-forest-deep">
                    In an emergency, don&rsquo;t chat — call
                  </h3>
                </div>
                <p className="mt-3 text-[14px] leading-6 text-ink/70">
                  Call your local emergency number (like 112 or 911) right away
                  if you or someone near you has:
                </p>
                <ul className="mt-3 space-y-2">
                  {EMERGENCY_SIGNS.map((sign) => (
                    <li
                      key={sign}
                      className="flex items-start gap-2 text-[14px] leading-6 text-ink/80"
                    >
                      <Icon className="mt-1 h-4 w-4 shrink-0 text-clay">
                        {icons.alert}
                      </Icon>
                      {sign}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Early access — honest pricing note: free now, likely paid after the
            real launch. Phrased around feedback/surveys, NOT conversation
            data: guest chats never touch our servers and account chats stay
            private, and this section must not suggest otherwise. */}
        <section id="early-access" className="shell scroll-mt-24 pb-16 lg:pb-24">
          <Reveal>
            <div className="mx-auto max-w-2xl rounded-3xl border border-forest/15 bg-white/70 px-6 py-10 text-center sm:px-10">
              <p className="eyebrow">Early access</p>
              <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-forest-deep sm:text-3xl">
                Free for now — not forever
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-ink/70">
                Helagi is a prototype, and while it grows everything is free.
                All we ask in return is your honest feedback — the short
                surveys after a session tell us where Helagi truly helps and
                where it must get better.
              </p>
              <p className="mt-3 text-[15px] leading-7 text-ink/70">
                Once that work is done and Helagi launches for real, it will
                most likely become a paid service. So this is the best moment
                to use it: it costs nothing, and what you tell us shapes what
                Helagi becomes.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Final CTA */}
        <section id="get-started" className="shell scroll-mt-24 pb-20 lg:pb-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-6 py-14 text-center text-cream sm:px-10 lg:py-16">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sage/15 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-clay/10 blur-3xl"
              />
              <div className="relative">
                <h2 className="mx-auto max-w-xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
                  Ready when you are
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-cream/75">
                  {signedIn
                    ? "Pick up right where you left off."
                    : "Create a free account to keep your conversations, or try Helagi as a guest — nothing is stored, nothing is tied to your name."}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {signedIn ? (
                    <Link
                      href="/chat"
                      className="btn btn-lg bg-cream text-forest-deep shadow-sm hover:bg-white"
                    >
                      Open Helagi
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="btn btn-lg bg-cream text-forest-deep shadow-sm hover:bg-white"
                      >
                        Create free account
                      </Link>
                      <Link
                        href="/login"
                        className="btn btn-lg border border-cream/30 text-cream hover:bg-white/10"
                      >
                        Log in
                      </Link>
                      <GuestButton variant="onDark" className="w-auto" />
                    </>
                  )}
                </div>
                {!signedIn && (
                  <p className="mt-5 text-[13px] text-cream/55">
                    Free during the prototype phase — all we ask for is an
                    email and a password. No personal or medical details.
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
