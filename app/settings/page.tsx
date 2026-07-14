// Settings, reached from the profile menu in the chat sidebar. Cookie
// preferences, chat-history deletion, and account deletion live here; the
// interactive parts are in components/SettingsPanel.tsx. No identity at all →
// back to the landing page, like /chat.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { HelagiLockup } from "@/components/Logo";
import SettingsPanel from "@/components/SettingsPanel";

export const metadata: Metadata = {
  title: "Settings — Helagi",
};

export default async function SettingsPage() {
  const identity = await getIdentity();
  if (!identity) redirect("/");

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
          Settings
        </h1>
        <p className="mb-8 mt-2 text-sm leading-6 text-ink/60">
          Manage your cookies, your data, and your account.
        </p>
        <SettingsPanel
          identity={
            identity.type === "user"
              ? { type: "user", email: identity.email }
              : { type: "guest" }
          }
        />
      </main>
    </div>
  );
}
