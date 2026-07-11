"use client";

// Site footer with the legal links and the "Cookie settings" re-consent entry
// point (required so visitors can change or withdraw cookie consent later).
// Used on the landing page and the legal pages — not inside the chat app,
// which is a full-height screen of its own.

import Link from "next/link";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/medical-disclaimer", label: "Medical Disclaimer" },
];

export default function Footer() {
  return (
    <footer className="border-t border-forest/10 px-4 py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <nav aria-label="Legal">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-ink/60">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
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
                className="transition hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                Cookie settings
              </button>
            </li>
          </ul>
        </nav>
        <p className="max-w-xl text-xs leading-5 text-ink/45">
          Helagi provides general health information and does not replace a
          qualified healthcare professional. In an emergency, call your local
          emergency number immediately.
        </p>
        <p className="text-xs text-ink/40">
          © {new Date().getFullYear()} Helagi
        </p>
      </div>
    </footer>
  );
}
