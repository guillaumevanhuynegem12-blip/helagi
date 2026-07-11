// Login page. Already signed in → straight to the chat.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { HelagiLockup } from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import GuestButton from "@/components/GuestButton";

export const metadata: Metadata = {
  title: "Log in — Helagi",
};

export default async function LoginPage() {
  const identity = await getIdentity();
  if (identity?.type === "user") redirect("/chat");

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
        <AuthForm mode="login" />
      </div>

      <div className="mt-4 w-full max-w-sm text-center">
        <p className="mb-2 text-xs text-ink/45">or</p>
        <GuestButton />
      </div>
    </div>
  );
}
