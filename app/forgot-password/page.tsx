// "Forgot password" page: enter your email, get a single-use reset link.
// Already signed in → straight to the chat, same as the other auth pages.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { HelagiLockup } from "@/components/Logo";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password — Helagi",
};

export default async function ForgotPasswordPage() {
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
            Forgot your password?
          </h1>
          <p className="mb-6 mt-1.5 text-sm leading-6 text-ink/60">
            No problem. Enter your email and we&rsquo;ll send you a link to
            choose a new one.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
