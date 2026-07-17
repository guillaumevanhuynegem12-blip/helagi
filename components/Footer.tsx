"use client";

// Site footer: brand column with the standing medical note, product links,
// legal links, and the "Cookie settings" re-consent entry point (required so
// visitors can change or withdraw cookie consent later). Used on the landing
// page and the legal pages — not inside the chat app, which is a full-height
// screen of its own.

import Link from "next/link";
import { HelagiLockup } from "@/components/Logo";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

const PRODUCT_LINKS = [
  { href: "/chat", label: "Open Helagi" },
  { href: "/register", label: "Create account" },
  { href: "/login", label: "Log in" },
  { href: "/#how-it-works", label: "How it works" },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/medical-disclaimer", label: "Medical Disclaimer" },
];

const footerLink =
  "text-[13.5px] text-ink/60 transition hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export default function Footer() {
  return (
    <footer className="border-t border-forest/10 bg-white/60">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr] lg:gap-16">
        {/* Brand */}
        <div>
          <HelagiLockup />
          <p className="mt-4 max-w-sm text-[13.5px] leading-6 text-ink/60">
            A free health assistant that helps you understand your symptoms in
            plain language — and know what to do next.
          </p>
          <p className="mt-4 max-w-sm rounded-xl border border-clay/35 bg-clay/[0.07] px-3.5 py-2.5 text-xs leading-5 text-ink/60">
            Helagi does not replace a qualified healthcare professional. In an
            emergency, call your local emergency number (like 112 or 911)
            immediately.
          </p>
        </div>

        {/* Product */}
        <nav aria-label="Product">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest-deep">
            Product
          </p>
          <ul className="mt-4 space-y-2.5">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal */}
        <nav aria-label="Legal">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest-deep">
            Legal
          </p>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
                }
                className={footerLink}
              >
                Cookie settings
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-forest/10">
        <div className="shell flex flex-col items-center justify-between gap-2 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-ink/45">
            © {new Date().getFullYear()} Helagi
          </p>
          <p className="text-xs text-ink/45">
            General health information — not medical advice, diagnosis, or
            treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}
