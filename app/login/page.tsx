// Login page. Already signed in → straight to the chat.

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
  title: "Log in — Helagi",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const identity = await getIdentity();
  if (identity?.type === "user") redirect("/chat");
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <Link
        href="/"
        aria-label="Back to the Helagi homepage"
        className="mb-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
      >
        <HelagiLockup />
      </Link>

      <div className="w-full max-w-sm rounded-3xl border border-forest/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl text-forest-deep">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-ink/60">
          Log in to continue with Helagi.
        </p>
        {error === "google" && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5 text-sm text-ink"
          >
            Signing in with Google didn&rsquo;t work. Please try again, or log
            in with your email and password.
          </p>
        )}
        <AuthForm mode="login" />
        {isGoogleConfigured() && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-ink/45">
              <span className="h-px flex-1 bg-forest/10" />
              or
              <span className="h-px flex-1 bg-forest/10" />
            </div>
            <GoogleButton />
          </>
        )}
      </div>

      <div className="mt-4 w-full max-w-sm text-center">
        <p className="mb-2 text-xs text-ink/45">or</p>
        <GuestButton />
      </div>
    </div>
  );
}
