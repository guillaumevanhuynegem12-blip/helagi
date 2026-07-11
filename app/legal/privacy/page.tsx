// PLACEHOLDER legal text — must be reviewed by a lawyer before public launch.
// The factual statements about what the app stores are accurate as of writing;
// keep them in sync with the code (lib/auth.ts, app/api/analytics/route.ts).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Helagi",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Draft — requires legal review before launch.</p>

      <h2>Who we are</h2>
      <p>
        Helagi is operated by [COMPANY NAME], [ADDRESS], [JURISDICTION]. For
        privacy questions, contact [CONTACT EMAIL].
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> if you create an account, we store
          your email address and a salted hash of your password (never the
          password itself). We do not ask for your name, date of birth, or any
          medical information at signup.
        </li>
        <li>
          <strong>Session data:</strong> a random session token (logged-in
          users) or a random anonymous ID (guests), stored in cookies so the
          service works. See the{" "}
          <Link href="/legal/cookies">Cookie Policy</Link>.
        </li>
        <li>
          <strong>Usage analytics (only with your consent):</strong>{" "}
          first-party event counts such as pages visited, buttons used, error
          rates, session duration, and coarse browser/OS information. Analytics
          never includes the content of your conversations, and is tied to a
          pseudonymous session ID, not your email.
        </li>
      </ul>

      <h2>Your conversations</h2>
      <p>
        Chat conversations are kept in your browser while you use Helagi and
        are <strong>not stored on our servers</strong>. To generate an answer,
        your conversation is transmitted to our AI provider (Anthropic) and,
        for medical terminology lookups, search terms may be sent to the World
        Health Organization&rsquo;s ICD-11 API. [CONFIRM PROVIDER DATA-PROCESSING
        TERMS AND RETENTION WITH LEGAL.]
      </p>
      <p>
        If Helagi ever introduces server-side storage or analysis of medical
        conversations, it will be handled separately and securely, and only
        after clear information and appropriate consent — it is not covered by
        normal analytics consent.
      </p>

      <h2>Legal basis &amp; retention</h2>
      <p>
        [FILL IN: legal bases per purpose (contract for accounts, consent for
        analytics), retention periods (analytics counters are currently kept
        ~90 days; sessions expire after 30 days of inactivity), account
        deletion process.]
      </p>

      <h2>Your rights</h2>
      <p>
        [FILL IN: access, rectification, erasure, portability, complaint to
        supervisory authority, and how to exercise them via [CONTACT EMAIL].]
      </p>
    </>
  );
}
