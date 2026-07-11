// PLACEHOLDER legal text — must be reviewed by a lawyer before public launch.
// The cookie table below is accurate as of writing; keep it in sync with the
// code (lib/auth.ts cookie names, lib/consent.ts).

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Helagi",
};

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="updated">Draft — requires legal review before launch.</p>

      <h2>The cookies Helagi uses</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Category</th>
            <th>Lifetime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>helagi_session</td>
            <td>Keeps you logged in to your account.</td>
            <td>Strictly necessary</td>
            <td>30 days (renewed while you use Helagi)</td>
          </tr>
          <tr>
            <td>helagi_guest</td>
            <td>
              Anonymous session ID for guests, so the service can treat your
              visit as one session without an account.
            </td>
            <td>Strictly necessary</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td>helagi_consent</td>
            <td>Remembers your cookie choices.</td>
            <td>Strictly necessary</td>
            <td>6 months</td>
          </tr>
        </tbody>
      </table>

      <h2>Analytics</h2>
      <p>
        With your consent, Helagi records first-party usage events (pages
        visited, buttons used, errors, session duration, coarse browser/OS
        info) on our own infrastructure. No third-party analytics tools are
        used and no additional analytics cookie is set — events are associated
        with the pseudonymous session ID above. The content of your
        conversations is never included.
      </p>

      <h2>Performance &amp; preference cookies</h2>
      <p>
        This optional category covers cookies that would remember settings
        between visits. Helagi currently sets none; your choice here applies to
        any that may be introduced later.
      </p>

      <h2>Changing your mind</h2>
      <p>
        You can change or withdraw your consent at any time via the
        &ldquo;Cookie settings&rdquo; link in the footer. Rejecting optional
        cookies never blocks you from using Helagi.
      </p>
    </>
  );
}
