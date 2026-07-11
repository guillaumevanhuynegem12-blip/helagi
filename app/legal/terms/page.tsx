// PLACEHOLDER legal text — must be reviewed by a lawyer before public launch.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — Helagi",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="updated">Draft — requires legal review before launch.</p>

      <h2>What Helagi is</h2>
      <p>
        Helagi is an AI assistant that provides general health information. It
        is <strong>not</strong> a medical device, does not provide medical
        diagnoses, and does not replace a doctor, emergency service, or other
        qualified healthcare professional. See the{" "}
        <Link href="/legal/medical-disclaimer">Medical Disclaimer</Link>.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not rely on Helagi for emergencies — call your local emergency number.</li>
        <li>Do not attempt to abuse, overload, or reverse-engineer the service.</li>
        <li>Do not use Helagi to generate harmful or unlawful content.</li>
        <li>One person per account; keep your password to yourself.</li>
      </ul>

      <h2>Accounts</h2>
      <p>
        You can use Helagi as a guest or with an account (email + password).
        We may suspend accounts that abuse the service. [FILL IN: account
        deletion process and contact.]
      </p>

      <h2>Liability &amp; warranty</h2>
      <p>
        [FILL IN: limitation of liability, no-warranty clauses, and governing
        law for [JURISDICTION] — this section in particular must be drafted by
        a lawyer.]
      </p>

      <h2>Changes</h2>
      <p>
        [FILL IN: how users are informed of changes to these terms.]
      </p>
    </>
  );
}
