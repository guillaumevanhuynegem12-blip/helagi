// Shared frame for the legal pages: brand header, a prominent "placeholder —
// needs legal review" notice, prose styling, and the site footer.

import Link from "next/link";
import { HelagiLockup } from "@/components/Logo";
import Footer from "@/components/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 py-4">
        <Link
          href="/"
          aria-label="Back to the Helagi homepage"
          className="inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
        >
          <HelagiLockup />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-14 pt-2">
        <div
          role="note"
          className="mb-8 rounded-2xl border border-clay/50 bg-clay/10 px-4 py-3 text-sm leading-6 text-ink"
        >
          <strong className="text-clay">Placeholder document.</strong> This
          text is a working draft and has <strong>not</strong> been reviewed by
          a lawyer. It must receive proper legal review — and the bracketed
          gaps must be filled in — before Helagi launches publicly.
        </div>
        <article className="legal-prose">{children}</article>
      </main>

      <Footer />
    </div>
  );
}
