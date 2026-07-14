// Help, reached from the profile menu in the chat sidebar: how Helagi works
// in short, the emergency reminder, and every policy in one place. Static —
// no identity needed.

import type { Metadata } from "next";
import Link from "next/link";
import { HelagiLockup } from "@/components/Logo";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Help — Helagi",
};

const POLICIES = [
  {
    href: "/legal/privacy",
    title: "Privacy Policy",
    text: "What we store (and what we deliberately don't), and your rights over your data.",
  },
  {
    href: "/legal/cookies",
    title: "Cookie Policy",
    text: "Which cookies Helagi uses and how to change or withdraw your consent.",
  },
  {
    href: "/legal/terms",
    title: "Terms of Use",
    text: "The rules for using Helagi, for guests and account holders alike.",
  },
  {
    href: "/legal/medical-disclaimer",
    title: "Medical Disclaimer",
    text: "What Helagi is and isn't: general health information, never a diagnosis.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link
            href="/"
            aria-label="Back to the Helagi homepage"
            className="inline-block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            <HelagiLockup size="lg" />
          </Link>
          <Link href="/chat" className="btn btn-ghost btn-md">
            Back to chat
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-8">
        <h1 className="font-display text-3xl font-medium tracking-tight text-forest-deep">
          Help
        </h1>
        <p className="mb-8 mt-2 text-sm leading-6 text-ink/60">
          Quick answers about what Helagi is, and every policy in one place.
        </p>

        {/* Emergency first — the one thing that must never be buried. */}
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-clay/40 bg-clay/[0.08] px-5 py-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-clay"
          >
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p className="text-sm leading-6 text-ink/75">
            <span className="font-semibold text-clay">In an emergency, don&rsquo;t chat — call.</span>{" "}
            Helagi provides general health information and never replaces a
            doctor or emergency service. Call your local emergency number
            (like 112 or 911) right away if a situation is serious.
          </p>
        </div>

        {/* How it works, in short */}
        <div className="card mb-4 px-6 py-6 sm:px-7">
          <h2 className="text-[15px] font-semibold text-forest-deep">
            How Helagi works
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-ink/65">
            Describe how you feel in your own words. Helagi asks a few simple
            follow-up questions, then explains what is most likely going on,
            how urgent it looks, and what to do next — and can turn the
            conversation into a printable summary for your doctor.{" "}
            <Link
              href="/#how-it-works"
              className="font-medium text-forest underline underline-offset-2"
            >
              See the full walkthrough
            </Link>
            .
          </p>
        </div>

        {/* Policies */}
        <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
          Policies
        </h2>
        <ul className="flex flex-col gap-3">
          {POLICIES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="card block px-6 py-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-7"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-forest-deep">
                    {p.title}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0 text-forest/50"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
                <span className="mt-1 block text-sm leading-6 text-ink/60">
                  {p.text}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm leading-6 text-ink/60">
          Cookie choices live in{" "}
          <Link
            href="/settings"
            className="font-medium text-forest underline underline-offset-2"
          >
            Settings
          </Link>
          , together with deleting your chats or your account.
        </p>
      </main>

      <Footer />
    </div>
  );
}
