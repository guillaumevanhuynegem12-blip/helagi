// Registration page. Deliberately minimal: an account is an email and a
// password, nothing else — no names, no health questions. Already signed in →
// straight to the chat.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/googleAuth";
import { HelagiLockup } from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import GoogleButton from "@/components/GoogleButton";
import GuestButton from "@/components/GuestButton";

export const metadata: Metadata = {
  title: "Create account — Helagi",
};

export default async function RegisterPage() {
  const identity = await getIdentity();
  if (identity?.type === "user") redirect("/chat");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            aria-label="Back to the Helagi homepage"
            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            <HelagiLockup size="lg" />
          </Link>
        </div>

        <div className="card rounded-3xl p-6 shadow-lift sm:p-8">
          <h1 className="font-display text-2xl font-medium tracking-tight text-forest-deep">
            Create your account
          </h1>
          <p className="mb-6 mt-1.5 text-sm leading-6 text-ink/60">
            Free, and all we need is an email and a password — no personal or
            medical details. We&rsquo;ll email you a 6-digit code to confirm
            the address is yours.
          </p>
          <AuthForm mode="register" />
          {isGoogleConfigured() && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-ink/45">
                <span className="h-px flex-1 bg-forest/10" />
                or continue with
                <span className="h-px flex-1 bg-forest/10" />
              </div>
              <GoogleButton />
            </>
          )}
        </div>

        <div className="mt-5 text-center">
          <p className="mb-2.5 text-xs text-ink/45">
            Just want to try Helagi first?
          </p>
          <GuestButton />
          <p className="mt-5 text-xs leading-5 text-ink/40">
            Chats as a guest stay in your browser and are never stored on our
            servers.
          </p>
        </div>
      </div>
    </div>
  );
}
