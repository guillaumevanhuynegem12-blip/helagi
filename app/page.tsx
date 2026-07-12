// Landing page ("/"). The chat itself lives at /chat — visitors get there by
// logging in, creating an account, or continuing as guest. Server component:
// it reads the identity cookie only to swap "Log in / Create account" for
// "Open Helagi" when the visitor already has a session.

import Link from "next/link";
import { getIdentity } from "@/lib/auth";
import { HelagiLockup, HelagiMark } from "@/components/Logo";
import Footer from "@/components/Footer";
import GuestButton from "@/components/GuestButton";

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

const TRUST_POINTS = [
  {
    title: "Grounded in WHO ICD-11",
    text: "Medical answers are cross-checked against the World Health Organization's official disease classification.",
  },
  {
    title: "Private by design",
    text: "As a guest, your conversations never touch our servers. With an account, your chats are saved privately for you alone, so you can pick up where you left off.",
  },
  {
    title: "Honest about limits",
    text: "Helagi tells you how urgent things look and when to see a professional. It never claims to diagnose you.",
  },
];

export default async function LandingPage() {
  const identity = await getIdentity();
  const signedIn = identity?.type === "user";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <HelagiLockup />
        <nav className="flex items-center gap-2" aria-label="Account">
          {signedIn ? (
            <Link
              href="/chat"
              className="rounded-xl bg-forest px-4 py-2 text-sm font-medium text-cream transition hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              Open Helagi
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-forest transition hover:bg-cream-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-forest px-4 py-2 text-sm font-medium text-cream transition hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-14 pt-10 text-center sm:pt-16">
          <HelagiMark className="mb-5 h-16 w-16" />
          <h1 className="font-display text-4xl font-medium tracking-tight text-forest-deep sm:text-5xl">
            Not feeling well?
            <br />
            Let&rsquo;s figure it out — calmly.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-ink/65">
            Helagi is a free health assistant. Describe your symptoms in your
            own words; it asks simple follow-up questions, explains what is
            most likely going on in plain language, and tells you how urgent it
            is — grounded in the WHO ICD-11 classification.
          </p>

          {/* Disclaimer — always visible, right under the promise */}
          <p className="mt-6 max-w-xl rounded-2xl border border-clay/40 bg-white/70 px-4 py-3 text-[13px] leading-5 text-ink/70">
            <span className="font-semibold text-clay">Please note:</span>{" "}
            Helagi provides general health information. It is not a diagnosis
            and does not replace a doctor, emergency service, or other
            qualified healthcare professional. In an emergency, call your local
            emergency number (like 112 or 911) right away.
          </p>

          <Link
            href={signedIn ? "/chat" : "#get-started"}
            className="mt-8 rounded-2xl bg-forest px-8 py-3.5 text-base font-semibold text-cream shadow-sm transition hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Start using Helagi
          </Link>
        </section>

        {/* Get started: the three entry paths */}
        <section id="get-started" className="scroll-mt-8 px-4 pb-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl text-forest-deep">
              Choose how to start
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col rounded-2xl border border-forest/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-forest-deep">
                  Create account
                </p>
                <p className="mb-4 mt-1 flex-1 text-[13px] leading-5 text-ink/60">
                  Free, and all we ask for is an email and a password — no
                  personal or medical details.
                </p>
                <Link
                  href="/register"
                  className="rounded-xl bg-forest px-4 py-2.5 text-center text-sm font-medium text-cream transition hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  Create account
                </Link>
              </div>

              <div className="flex flex-col rounded-2xl border border-forest/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-forest-deep">
                  Log in
                </p>
                <p className="mb-4 mt-1 flex-1 text-[13px] leading-5 text-ink/60">
                  Welcome back — pick up right where you left off.
                </p>
                <Link
                  href="/login"
                  className="rounded-xl border border-forest/25 bg-white px-4 py-2.5 text-center text-sm font-medium text-forest transition hover:bg-cream-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  Log in
                </Link>
              </div>

              <div className="flex flex-col rounded-2xl border border-forest/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-forest-deep">
                  No account needed
                </p>
                <p className="mb-4 mt-1 flex-1 text-[13px] leading-5 text-ink/60">
                  Try Helagi as a guest with an anonymous session — nothing is
                  tied to your name.
                </p>
                <GuestButton />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 pb-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl text-forest-deep">
              How Helagi works
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STEPS.map(({ step, title, text }) => (
                <div
                  key={step}
                  className="rounded-2xl border border-forest/10 bg-white/70 px-5 py-5"
                >
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream">
                    {step}
                  </div>
                  <p className="text-sm font-semibold text-forest-deep">
                    {title}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-ink/60">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why trust it */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-4xl rounded-3xl bg-forest-deep px-6 py-8 text-cream sm:px-10">
            <h2 className="text-center font-display text-2xl">
              Built to be careful
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {TRUST_POINTS.map(({ title, text }) => (
                <div key={title}>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-cream/70">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
