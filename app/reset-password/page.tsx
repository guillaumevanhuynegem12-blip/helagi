// Landing page for the link in the password-reset email
// (/reset-password?token=…). The token is only checked when the form is
// submitted — this page just needs one to render the form at all.
//
// Deliberately NO signed-in redirect here (unlike /login and /register):
// someone can legitimately follow a reset link while an old session is still
// alive on the device.

import type { Metadata } from "next";
import Link from "next/link";
import { HelagiLockup } from "@/components/Logo";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password — Helagi",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

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
            Choose a new password
          </h1>
          {token ? (
            <>
              <p className="mb-6 mt-1.5 text-sm leading-6 text-ink/60">
                Almost done — pick a new password for your account.
              </p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <p className="mb-6 mt-1.5 text-sm leading-6 text-ink/60">
                This page only works from the link in a password-reset email,
                and yours seems incomplete. Please use the button or link in
                the email itself.
              </p>
              <Link
                href="/forgot-password"
                className="btn btn-primary btn-md w-full"
              >
                Request a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
